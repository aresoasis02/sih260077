//scan.routes.js

const express = require('express');
const router = express.Router();

const { cloneRepo, findLockfile, cleanup } = require('../modules/ingest/repoIngest');
const { parseLockfile } = require('../modules/parse/npmLockParser');
const { queryVulnerabilities } = require('../modules/enrich/osvClient');
const { checkTyposquat } = require('../modules/anomaly/typosquat');
const { checkFreshness } = require('../modules/anomaly/freshness');
const { checkVersionPinning } = require('../modules/anomaly/versionPinning');
const { checkInstallScript } = require('../modules/anomaly/installScript');
const { getPackageMetadata } = require('../modules/license/licenseExtract');
const { classifyLicense, classifyDeprecation } = require('../modules/license/licenseClassify');
const { buildCycloneDX } = require('../modules/serialize/cyclonedx');
const { buildRiskSummary } = require('../modules/serialize/riskSummary');
const { npmHighImpact } = require('npm-high-impact');

const FRESHNESS_CONCURRENCY = 25;
const LICENSE_CONCURRENCY = 25;

function addAnomalyHit(anomalies, purl, hit) {
  if (!hit) return;
  const existing = anomalies.get(purl) || [];
  existing.push(hit);
  anomalies.set(purl, existing);
}

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

    // Pass 1: synchronous checks
    let typosquatHits = 0;
    for (const c of components) {
      const isKnownPopular = npmHighImpact.includes(c.name);
      const hits = [
        checkTyposquat(c.name),
        checkVersionPinning(c.declaredRanges),
        checkInstallScript(c, isKnownPopular),
      ].filter(Boolean);

      if (hits.some(h => h.type === 'typosquat')) typosquatHits++;

      hits.forEach(hit => addAnomalyHit(anomalies, c.purl, hit));

      if (hits.length === 0) {
        freshnessCandidates.push(c);
      }
    }

    // --- INSTRUMENTATION: remove once confirmed ---
    console.log(`[scan] typosquat hits: ${typosquatHits} / ${components.length} components checked`);
    console.log(`[scan] freshness candidates: ${freshnessCandidates.length}`);
    // ------------------------------------------------

    // Pass 2: freshness checks, batched
    let freshnessHits = 0;
    let freshnessErrors = 0;
    for (let i = 0; i < freshnessCandidates.length; i += FRESHNESS_CONCURRENCY) {
      const batch = freshnessCandidates.slice(i, i + FRESHNESS_CONCURRENCY);
      const results = await Promise.all(
        batch.map(c =>
          checkFreshness(c.name).catch(err => {
            freshnessErrors++;
            // --- INSTRUMENTATION: remove once confirmed ---
            console.log(`[scan] freshness check failed for ${c.name}: ${err.message}`);
            // ------------------------------------------------
            return null;
          })
        )
      );
      results.forEach((fresh, idx) => {
        if (fresh) {
          freshnessHits++;
          addAnomalyHit(anomalies, batch[idx].purl, fresh);
        }
      });
    }

    // --- INSTRUMENTATION: remove once confirmed ---
    console.log(`[scan] freshness hits: ${freshnessHits}, errors/timeouts: ${freshnessErrors}`);
    // ------------------------------------------------

    // Pass 3: license + deprecation, batched, runs for every component
    for (let i = 0; i < components.length; i += LICENSE_CONCURRENCY) {
      const batch = components.slice(i, i + LICENSE_CONCURRENCY);
      const results = await Promise.all(batch.map(c => getPackageMetadata(c.name)));
      results.forEach(({ license, deprecated }, idx) => {
        const c = batch[idx];
        c.license = license;
        addAnomalyHit(anomalies, c.purl, classifyLicense(license));
        addAnomalyHit(anomalies, c.purl, classifyDeprecation(deprecated));
      });
    }

    const sbom = buildCycloneDX({ components, vulnMap, anomalies });
    sbom.riskSummary = buildRiskSummary(components, vulnMap, anomalies);

    res.json(sbom);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (repoDir) cleanup(repoDir);
  }
});

module.exports = router;