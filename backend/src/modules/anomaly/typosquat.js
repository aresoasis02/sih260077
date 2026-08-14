//anamoly/typosquat.js

const levenshtein = require('fast-levenshtein');
const topPackages = require('../../data/top-npm-packages.json'); // static list, download once

const EDIT_DISTANCE_THRESHOLD = 2;

function checkTyposquat(componentName) {
  if (topPackages.includes(componentName)) return null; // it IS the popular package

  for (const popularName of topPackages) {
    const distance = levenshtein.get(componentName, popularName);
    if (distance > 0 && distance <= EDIT_DISTANCE_THRESHOLD) {
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