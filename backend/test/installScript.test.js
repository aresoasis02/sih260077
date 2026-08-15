const { checkInstallScript } = require('../src/modules/anomaly/installScript');

describe('checkInstallScript', () => {
  it('flags high severity when the package has an install script and is not well-known', () => {
    const result = checkInstallScript({ hasInstallScript: true }, false);
    expect(result).not.toBeNull();
    expect(result.severity).toBe('high');
    expect(result.type).toBe('install-script');
  });

  it('flags low severity when the package has an install script but is well-known', () => {
    const result = checkInstallScript({ hasInstallScript: true }, true);
    expect(result).not.toBeNull();
    expect(result.severity).toBe('low');
  });

  it('returns null when there is no install script', () => {
    const result = checkInstallScript({ hasInstallScript: false }, false);
    expect(result).toBeNull();
  });
});