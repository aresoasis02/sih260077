//anomaly/freshness.js

const axios = require('axios');

async function getWithRetry(url, attempt = 0) {
  try {
    return await axios.get(url, { timeout: 5000 });
  } catch (err) {
    const status = err.response && err.response.status;
    if (status === 429 && attempt < 2) {
      const retryAfter = err.response.headers['retry-after'];
      const delay = retryAfter ? Number(retryAfter) * 1000 : 500 * 2 ** attempt;
      await new Promise(r => setTimeout(r, delay));
      return getWithRetry(url, attempt + 1);
    }
    throw err;
  }
}

async function checkFreshness(componentName) {
  const { data } = await getWithRetry(`https://registry.npmjs.org/${encodeURIComponent(componentName)}`);
  const latestVersion = data['dist-tags'].latest;
  const publishedDate = new Date(data.time[latestVersion]);
  const daysSincePublish = (Date.now() - publishedDate) / (1000 * 60 * 60 * 24);

  const downloadsRes = await getWithRetry(
    `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(componentName)}`
  );
  const weeklyDownloads = downloadsRes.data.downloads || 0;

  if (daysSincePublish < 30 && weeklyDownloads < 100) {
    return {
      type: 'freshness',
      severity: 'medium',
      reason: `Published ${Math.round(daysSincePublish)} days ago with only ${weeklyDownloads} weekly downloads`,
    };
  }
  return null;
}

module.exports = { checkFreshness };