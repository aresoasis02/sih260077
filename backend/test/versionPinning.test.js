const { checkVersionPinning } = require('../src/modules/anomaly/versionPinning');

describe('checkVersionPinning', () => {
  test('flags a wildcard range', () => {
    const result = checkVersionPinning(['*']);
    expect(result).not.toBeNull();
    expect(result.type).toBe('version-pinning');
    expect(result.severity).toBe('low');
  });

  test('flags "latest"', () => {
    const result = checkVersionPinning(['latest']);
    expect(result).not.toBeNull();
  });

  test('flags 0.0.x ranges', () => {
    const result = checkVersionPinning(['^0.0.1']);
    expect(result).not.toBeNull();
  });

  test('does not flag a properly pinned range', () => {
    const result = checkVersionPinning(['^4.18.2']);
    expect(result).toBeNull();
  });

  test('does not flag an empty declaredRanges array', () => {
    const result = checkVersionPinning([]);
    expect(result).toBeNull();
  });

  test('flags if ANY range in a mixed list is loose', () => {
    const result = checkVersionPinning(['^4.18.2', '*']);
    expect(result).not.toBeNull();
    expect(result.reason).toContain('*');
  });
});
