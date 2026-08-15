//serialize/riskSummary.js

function buildRiskSummary(components, vulnMap, anomalies) {
  let critical = 0, high = 0, medium = 0, low = 0;
  const byType = {};

  for (const c of components) {
    const vulnCount = (vulnMap.get(c.purl) || []).length;
    const anomalyHits = anomalies.get(c.purl) || [];

    anomalyHits.forEach(a => {
      byType[a.type] = (byType[a.type] || 0) + 1;
    });

    if (vulnCount > 0) critical++;
    else if (anomalyHits.some(a => a.severity === 'high')) high++;
    else if (anomalyHits.some(a => a.severity === 'medium')) medium++;
    else if (anomalyHits.length > 0) low++;
  }

  return {
    totalComponents: components.length,
    critical,
    high,
    medium,
    low,
    flaggedCount: critical + high + medium + low,
    byType,
  };
}

module.exports = { buildRiskSummary };