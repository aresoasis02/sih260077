jest.mock('axios');
const axios = require('axios');
const { queryVulnerabilities } = require('../src/modules/enrich/osvClient');

describe('queryVulnerabilities', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns vuln hits for a component known to have them', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        results: [
          { vulns: [{ id: 'GHSA-fake-1234' }] },
        ],
      },
    });

    const components = [
      { purl: 'pkg:npm/lodash@4.17.4' }, // old, real lodash version with known CVEs
    ];

    const vulnMap = await queryVulnerabilities(components);
    expect(vulnMap.get('pkg:npm/lodash@4.17.4')).toEqual([{ id: 'GHSA-fake-1234' }]);
  });

  test('returns empty array for a clean/current package', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        results: [{ vulns: undefined }],
      },
    });

    const components = [{ purl: 'pkg:npm/express@4.19.2' }];
    const vulnMap = await queryVulnerabilities(components);
    expect(vulnMap.get('pkg:npm/express@4.19.2')).toEqual([]);
  });

  test('chunks correctly when component count exceeds batch size', async () => {
    // Simulate a small batch size scenario by feeding > BATCH_SIZE isn't practical
    // (BATCH_SIZE is 1000, hardcoded in the module) so instead we assert axios.post
    // is called once per chunk by checking call count with a large-ish input while
    // mocking every call to resolve.
    axios.post.mockImplementation((url, body) => {
      return Promise.resolve({
        data: { results: body.queries.map(() => ({ vulns: [] })) },
      });
    });

    const components = Array.from({ length: 1500 }, (_, i) => ({
      purl: `pkg:npm/fake-pkg-${i}@1.0.0`,
    }));

    const vulnMap = await queryVulnerabilities(components);
    // 1500 components at BATCH_SIZE 1000 => 2 chunks => 2 axios.post calls
    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(vulnMap.size).toBe(1500);
  });
});
