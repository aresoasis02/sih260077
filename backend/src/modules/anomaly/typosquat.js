//anomaly/typosquat.js

const levenshtein = require('fast-levenshtein');
const { npmHighImpact } = require('npm-high-impact'); // real, maintained popularity dataset

const SHORT_NAME_LENGTH = 5;
const SHORT_NAME_THRESHOLD = 1;
const DEFAULT_THRESHOLD = 2;
const MIN_NAME_LENGTH_TO_CHECK = 3; // below this, edit-distance comparisons are too noisy to be meaningful

function checkTyposquat(componentName) {
  if (componentName.length < MIN_NAME_LENGTH_TO_CHECK) return null;
  if (npmHighImpact.includes(componentName)) return null; // it IS the popular package

  const threshold =
    componentName.length <= SHORT_NAME_LENGTH ? SHORT_NAME_THRESHOLD : DEFAULT_THRESHOLD;

  for (const popularName of npmHighImpact) {
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