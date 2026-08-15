//license/licenseExtract.js

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

async function getPackageMetadata(componentName) {
  try {
    const { data } = await getWithRetry(`https://registry.npmjs.org/${encodeURIComponent(componentName)}`);
    const license = extractLicense(data);
    const latestVersion = data['dist-tags'] && data['dist-tags'].latest;
    const versionInfo = latestVersion && data.versions ? data.versions[latestVersion] : null;
    const deprecated = (versionInfo && versionInfo.deprecated) || data.deprecated || null;
    return { license, deprecated };
  } catch {
    return { license: 'UNKNOWN', deprecated: null };
  }
}

function extractLicense(data) {
  if (typeof data.license === 'string') return data.license;
  if (data.license && data.license.type) return data.license.type;
  if (Array.isArray(data.licenses) && data.licenses.length > 0) return data.licenses[0].type || 'UNKNOWN';
  return 'UNKNOWN';
}

module.exports = { getPackageMetadata };