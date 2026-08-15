//license/licenseClassify.js

// Strong copyleft: derivative/linked works must also be released under the same license —
// this is the category that's genuinely dangerous to ship inside proprietary/closed-source software.
const STRONG_COPYLEFT = ['GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'AGPL-1.0'];

// Weak copyleft: only requires disclosing modifications to the licensed files themselves,
// not your whole program — lower risk, still worth a human looking at it before shipping.
const WEAK_COPYLEFT = ['LGPL-2.1', 'LGPL-3.0', 'MPL-2.0', 'MPL-1.1', 'EPL-1.0', 'EPL-2.0', 'CDDL-1.0', 'CDDL-1.1'];

const PERMISSIVE = ['MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', '0BSD', 'Unlicense', 'CC0-1.0'];

function classifyLicense(licenseId) {
  const raw = (licenseId || 'UNKNOWN').trim();
  // strip SPDX "-or-later" / "-only" suffixes so "LGPL-3.0-or-later" matches "LGPL-3.0"
  const normalized = raw.replace(/-(or-later|only)$/i, '');

  if (STRONG_COPYLEFT.includes(normalized)) {
    return {
      type: 'license',
      severity: 'high',
      reason: `Strong copyleft license (${raw}) — using this in proprietary software may legally require releasing your own source code`,
    };
  }
  if (WEAK_COPYLEFT.includes(normalized)) {
    return {
      type: 'license',
      severity: 'medium',
      reason: `Weak copyleft license (${raw}) — modifications to this package's own code may need to stay open, review before shipping`,
    };
  }
  if (raw === 'UNKNOWN' || raw === '') {
    return {
      type: 'license',
      severity: 'medium',
      reason: 'No license metadata found — legally treated as all-rights-reserved by default, do not assume it is safe to use',
    };
  }
  if (PERMISSIVE.includes(normalized)) {
    return null;
  }
  return {
    type: 'license',
    severity: 'low',
    reason: `Unrecognized or non-standard license string ("${raw}") — verify manually`,
  };
}

function classifyDeprecation(deprecated) {
  if (!deprecated) return null;
  return {
    type: 'deprecated',
    severity: 'high',
    reason: `Package is deprecated: "${deprecated}"`,
  };
}

module.exports = { classifyLicense, classifyDeprecation };