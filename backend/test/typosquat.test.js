const { checkTyposquat } = require('../src/modules/anomaly/typosquat');

describe('checkTyposquat', () => {
  test('flags a deliberately typosquatted name close to "express"', () => {
    const result = checkTyposquat('expres'); // 1 edit from "express"
    expect(result).not.toBeNull();
    expect(result.type).toBe('typosquat');
    expect(result.reason).toContain('express');
  });

  test('flags a deliberately typosquatted name close to "lodash"', () => {
    const result = checkTyposquat('loadash'); // 1 edit (transposition-ish) from "lodash"
    expect(result).not.toBeNull();
  });

  test('does not flag the real package name itself', () => {
    const result = checkTyposquat('express');
    expect(result).toBeNull();
  });

  test('does not flag a name that is not close to anything popular', () => {
    const result = checkTyposquat('my-totally-unrelated-internal-utility-pkg');
    expect(result).toBeNull();
  });
});
