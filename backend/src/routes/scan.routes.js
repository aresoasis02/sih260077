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
    for (const c of components) {
      const hits = [
        checkTyposquat(c.name),
        checkVersionPinning(c.declaredRanges),
      ].filter(Boolean);
      // freshness check is async + network-heavy — only run it on components
      // that don't already have OTHER flags, to keep scan time reasonable in a demo
      if (hits.length === 0) {
        const fresh = await checkFreshness(c.name).catch(() => null);
        if (fresh) hits.push(fresh);
      }
      if (hits.length) anomalies.set(c.purl, hits);
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