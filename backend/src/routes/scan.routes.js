//scan.routes.js

const express = require('express');
const router = express.Router();

const { cloneRepo, findLockfile, cleanup } = require('../modules/ingest/repoIngest');
const { parseLockfile } = require('../modules/parse/npmLockParser');
const { queryVulnerabilities } = require('../modules/enrich/osvClient');
const { checkTyposquat } = require('../modules/anomaly/typosquat');
const { checkFreshness } = require('../modules/anomaly/freshness');
const { checkVersionPinning } = require('../modules/anomaly/versionPinning');
const { buildCycloneDX } = require('../modules/serialize/cyclonedx');

const FRESHNESS_CONCURRENCY = 25; // tune down if you see 429s from npm registry

router.post('/scan', async (req, res) => {
  const { githubUrl } = req.body;
  if (!githubUrl) return res.status(400).json({ error: 'githubUrl is required' });

  let repoDir;
  try {
    repoDir = cloneRepo(githubUrl);
    const lockPath = findLockfile(repoDir);
    const components = parseLockfile(lockPath);

    const vulnMap = await queryVulnerabilities(components);

    const anomalies = new Map();
    const freshnessCandidates = [];

    // Pass 1: synchronous checks (typosquat, version-pinning) — instant, no network
    for (const c of components) {
      const hits = [checkTyposquat(c.name), checkVersionPinning(c.declaredRanges)].filter(Boolean);
      if (hits.length > 0) {
        anomalies.set(c.purl, hits);
      } else {
        freshnessCandidates.push(c); // only check freshness if nothing else already flagged it
      }
    }

    // Pass 2: freshness checks, batched with bounded concurrency instead of one-at-a-time
    for (let i = 0; i < freshnessCandidates.length; i += FRESHNESS_CONCURRENCY) {
      const batch = freshnessCandidates.slice(i, i + FRESHNESS_CONCURRENCY);
      const results = await Promise.all(
        batch.map(c => checkFreshness(c.name).catch(() => null))
      );
      results.forEach((fresh, idx) => {
        if (fresh) anomalies.set(batch[idx].purl, [fresh]);
      });
    }

    const sbom = buildCycloneDX({ components, vulnMap, anomalies });
    res.json(sbom);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (repoDir) cleanup(repoDir);
  }
});

module.exports = router;