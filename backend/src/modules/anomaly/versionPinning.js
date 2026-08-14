//anamoly/versionPinning.js

const LOOSE_PATTERNS = [/^\*$/, /^latest$/, /^\^0\.0\./];

function checkVersionPinning(declaredRanges) {
  const flagged = declaredRanges.filter(range =>
    LOOSE_PATTERNS.some(pattern => pattern.test(range))
  );
  if (flagged.length === 0) return null;

  return {
    type: 'version-pinning',
    severity: 'low',
    reason: `Declared with loose range(s): ${flagged.join(', ')}`,
  };
}

module.exports = { checkVersionPinning };