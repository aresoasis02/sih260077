//license/licenseExtract.js

const axios = require('axios');

async function getPackageMetadata(componentName) {
  try {
    const { data } = await axios.get(`https://registry.npmjs.org/${componentName}`, {
      timeout: 5000,
    });

    const license = extractLicense(data);
    const latestVersion = data['dist-tags'] && data['dist-tags'].latest;
    const versionInfo = latestVersion && data.versions ? data.versions[latestVersion] : null;
    const deprecated = (versionInfo && versionInfo.deprecated) || data.deprecated || null;

    return { license, deprecated };
  } catch {
    // network failure, 404, timeout — don't let one bad lookup break the scan
    return { license: 'UNKNOWN', deprecated: null };
  }
}

function extractLicense(data) {
  // npm registry has used a few different shapes for this field over the years
  if (typeof data.license === 'string') return data.license;
  if (data.license && data.license.type) return data.license.type;
  if (Array.isArray(data.licenses) && data.licenses.length > 0) return data.licenses[0].type || 'UNKNOWN';
  return 'UNKNOWN';
}

module.exports = { getPackageMetadata };