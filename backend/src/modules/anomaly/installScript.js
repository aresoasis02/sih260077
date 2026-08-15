//anomaly/installScript.js

function checkInstallScript(component, isKnownPopular) {
  if (!component.hasInstallScript) return null;

  // A lifecycle script on a well-known package is normal (native bindings, etc.)
  // The same script on an obscure/unpopular package is a much stronger signal —
  // this is literally the event-stream / ua-parser-js attack pattern.
  const severity = isKnownPopular ? 'low' : 'high';

  return {
    type: 'install-script',
    severity,
    reason: isKnownPopular
      ? 'Has a preinstall/postinstall/install lifecycle script (common for native-binding packages)'
      : 'Has a preinstall/postinstall/install lifecycle script on a package with no established popularity — verify before trusting',
  };
}

module.exports = { checkInstallScript };