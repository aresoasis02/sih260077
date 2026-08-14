//anamoly/typosquat.js

const levenshtein = require('fast-levenshtein');
const topPackages = require('../../data/top-npm-packages.json'); // static list, download once

// Short names sit close to many unrelated real packages (e.g. "vite" -> "vitest"
// is only 2 edits, but vitest is a legitimate, unrelated package). A flat
// distance-2 threshold produces false positives on short names, so the
// threshold scales down for them.
const SHORT_NAME_LENGTH = 5;
const SHORT_NAME_THRESHOLD = 1;
const DEFAULT_THRESHOLD = 2;

function checkTyposquat(componentName) {
  if (topPackages.includes(componentName)) return null; // it IS the popular package

  const threshold =
    componentName.length <= SHORT_NAME_LENGTH ? SHORT_NAME_THRESHOLD : DEFAULT_THRESHOLD;

  for (const popularName of topPackages) {
    const distance = levenshtein.get(componentName, popularName);
    if (distance > 0 && distance <= threshold) {
      return {
        type: 'typosquat',
        severity: 'high',
        reason: `Name is ${distance} edit(s) from popular package "${popularName}" but is not that package`,
      };
    }
  }
  return null;
}

module.exports = { checkTyposquat };