//anomaly/freshness.js

const axios = require('axios');

async function checkFreshness(componentName) {
  const { data } = await axios.get(`https://registry.npmjs.org/${componentName}`, {
    timeout: 5000,
  });
  const latestVersion = data['dist-tags'].latest;
  const publishedDate = new Date(data.time[latestVersion]);
  const daysSincePublish = (Date.now() - publishedDate) / (1000 * 60 * 60 * 24);

  const downloadsRes = await axios.get(
    `https://api.npmjs.org/downloads/point/last-week/${componentName}`,
    { timeout: 5000 }
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