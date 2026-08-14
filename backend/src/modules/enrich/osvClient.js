//osvClient.js

const axios = require('axios');

const OSV_BATCH_URL = 'https://api.osv.dev/v1/querybatch';
const BATCH_SIZE = 1000; // OSV batch endpoint accepts large batches; chunk defensively

async function queryVulnerabilities(components) {
  const chunks = chunkArray(components, BATCH_SIZE);
  const results = new Map(); // purl -> vuln list

  for (const chunk of chunks) {
    const queries = chunk.map(c => ({ package: { purl: c.purl } }));
    const { data } = await axios.post(OSV_BATCH_URL, { queries });

    data.results.forEach((result, i) => {
      const purl = chunk[i].purl;
      results.set(purl, result.vulns || []);
    });
  }

  return results; // Map<purl, vuln[]>
}

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

module.exports = { queryVulnerabilities };