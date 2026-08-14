//serializer/cyclonedx.js

function buildCycloneDX({ components, vulnMap, anomalies }) {
  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
    },
    components: components.map(c => buildComponent(c, anomalies)),
    vulnerabilities: buildVulnList(components, vulnMap),
  };
}

function buildComponent(c, anomalies) {
  const component = {
    type: 'library',
    name: c.name,
    version: c.version,
    purl: c.purl,
    scope: c.dev ? 'optional' : 'required',
  };

  // CycloneDX has no native "anomaly" field — attach as custom properties
  // directly on the component they describe, namespaced so downstream tools
  // can ignore them if they don't understand them. Per spec, components[]
  // entries support their own properties[] array — this keeps each finding
  // attributable to the exact package it's about, instead of floating in a
  // detached top-level list with no reference back.
  const hits = anomalies.get(c.purl) || [];
  if (hits.length > 0) {
    component.properties = hits.map(a => ({
      name: `sbomtool:anomaly:${a.type}`,
      value: `${a.severity} — ${a.reason}`,
    }));
  }

  return component;
}

function buildVulnList(components, vulnMap) {
  const vulns = [];
  for (const c of components) {
    const hits = vulnMap.get(c.purl) || [];
    hits.forEach(v => {
      vulns.push({
        id: v.id,
        affects: [{ ref: c.purl }],
      });
    });
  }
  return vulns;
}

module.exports = { buildCycloneDX };