//npmLockParser.js

const fs = require('fs');

function parseLockfile(lockPath) {
  const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));

  if (lockData.lockfileVersion < 3) {
    throw new Error('lockfileVersion < 3 not supported — regenerate with npm 7+');
  }

  const components = [];

  for (const [pkgPath, pkgInfo] of Object.entries(lockData.packages)) {
    if (pkgPath === '') continue; // root package itself
    const name = pkgPath.replace('node_modules/', '');
    if (!pkgInfo.version) continue; // workspace refs etc.

    components.push({
      name,
      version: pkgInfo.version,
      purl: `pkg:npm/${encodeURIComponent(name)}@${pkgInfo.version}`,
      resolved: pkgInfo.resolved || null,
      integrity: pkgInfo.integrity || null,
      dev: pkgInfo.dev || false,
      optional: pkgInfo.optional || false,
      hasInstallScript: pkgInfo.hasInstallScript || false,
      // raw declared range from the parent's perspective — needed later for §4c version-pinning check
      declaredRanges: findDeclaredRanges(lockData.packages, name),
    });
  }

  return components;
}

// finds every place this package name was declared as a dependency, and at what range,
// so the version-pinning anomaly check (loose ranges like "*" or "latest") has something to inspect
function findDeclaredRanges(packages, targetName) {
  const ranges = [];
  for (const [, pkgInfo] of Object.entries(packages)) {
    if (pkgInfo.dependencies && pkgInfo.dependencies[targetName]) {
      ranges.push(pkgInfo.dependencies[targetName]);
    }
  }
  return ranges;
}

module.exports = { parseLockfile };