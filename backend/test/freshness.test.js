jest.mock('axios');
const axios = require('axios');
const { checkFreshness } = require('../src/modules/anomaly/freshness');

describe('checkFreshness', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('flags a package published yesterday with very few downloads', async () => {
    const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();

    axios.get
      .mockResolvedValueOnce({
        data: {
          'dist-tags': { latest: '0.0.1' },
          time: { '0.0.1': yesterday },
        },
      })
      .mockResolvedValueOnce({
        data: { downloads: 5 },
      });

    const result = await checkFreshness('suspicious-new-pkg');
    expect(result).not.toBeNull();
    expect(result.type).toBe('freshness');
    expect(result.severity).toBe('medium');
  });

  test('does not flag an established package with high downloads', async () => {
    const twoYearsAgo = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString();

    axios.get
      .mockResolvedValueOnce({
        data: {
          'dist-tags': { latest: '4.19.2' },
          time: { '4.19.2': twoYearsAgo },
        },
      })
      .mockResolvedValueOnce({
        data: { downloads: 20000000 },
      });

    const result = await checkFreshness('express');
    expect(result).toBeNull();
  });

  test('does not flag a recently published package IF it already has high downloads', async () => {
    const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();

    axios.get
      .mockResolvedValueOnce({
        data: {
          'dist-tags': { latest: '2.0.0' },
          time: { '2.0.0': yesterday },
        },
      })
      .mockResolvedValueOnce({
        data: { downloads: 50000 }, // well above the 100/week threshold
      });

    const result = await checkFreshness('popular-fast-mover');
    expect(result).toBeNull();
  });
});
