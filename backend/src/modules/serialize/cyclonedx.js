//serializer/cyclonedx.js

function buildCycloneDX({ components, vulnMap, anomalies }) {
  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
    },
    components: components.map(c => ({
      type: 'library',
      name: c.name,
      version: c.version,
      purl: c.purl,
      scope: c.dev ? 'optional' : 'required',
    })),
    vulnerabilities: buildVulnList(components, vulnMap),
    properties: buildAnomalyProperties(components, anomalies),
  };
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

// CycloneDX has no native "anomaly" field — attach as custom properties per component,
// namespaced so downstream tools can ignore them if they don't understand them
function buildAnomalyProperties(components, anomalies) {
  const props = [];
  for (const c of components) {
    const hits = anomalies.get(c.purl) || [];
    hits.forEach(a => {
      props.push({
        name: `sbomtool:anomaly:${a.type}`,
        value: `${a.severity} — ${a.reason}`,
      });
    });
  }
  return props;
}

module.exports = { buildCycloneDX };