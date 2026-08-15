// Everything here works off the ACTUAL current response shape from
// SIH_26077_part3.md §4 — not the older §9 contract in part 1.

const ANOMALY_PREFIX = 'sbomtool:anomaly:'

export const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low']

export const SEVERITY_LABEL = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

// Parses one CycloneDX property into { type, severity, reason }.
// property.name  = "sbomtool:anomaly:install-script"
// property.value = "low — Has a preinstall/postinstall/install lifecycle script..."
function parseAnomalyProperty(prop) {
  const type = prop.name.startsWith(ANOMALY_PREFIX)
    ? prop.name.slice(ANOMALY_PREFIX.length)
    : prop.name

  const sepIndex = prop.value.indexOf('—')
  let severity = 'low'
  let reason = prop.value

  if (sepIndex !== -1) {
    severity = prop.value.slice(0, sepIndex).trim().toLowerCase()
    reason = prop.value.slice(sepIndex + 1).trim()
  }

  if (!SEVERITY_ORDER.includes(severity)) severity = 'low'

  return { type, severity, reason }
}

// Builds purl -> vuln[] map. `vulnerabilities` is a flat list, one entry
// per vuln, each pointing back at a purl via `affects[0].ref`.
export function buildVulnByPurl(vulnerabilities = []) {
  const map = new Map()
  for (const v of vulnerabilities) {
    const purl = v.affects?.[0]?.ref
    if (!purl) continue
    if (!map.has(purl)) map.set(purl, [])
    map.get(purl).push(v)
  }
  return map
}

// Takes a raw component from the API and returns an enriched version with:
// - anomalies: parsed [{type, severity, reason}]
// - vulns: [{id, ...}]
// - severity: the single worst severity this component carries overall
//   ('critical' if it has any CVE, regardless of anomaly severity — a known
//   vuln always outranks a heuristic flag)
export function enrichComponent(component, vulnByPurl) {
  const vulns = vulnByPurl.get(component.purl) || []
  const anomalies = (component.properties || []).map(parseAnomalyProperty)

  let severity = null
  if (vulns.length > 0) {
    severity = 'critical'
  } else if (anomalies.length > 0) {
    for (const level of SEVERITY_ORDER) {
      if (anomalies.some((a) => a.severity === level)) {
        severity = level
        break
      }
    }
  }

  return {
    ...component,
    vulns,
    anomalies,
    severity, // null = clean, no flags at all
    flagCount: vulns.length + anomalies.length,
  }
}

export function enrichAllComponents(sbom) {
  const vulnByPurl = buildVulnByPurl(sbom.vulnerabilities)
  return (sbom.components || []).map((c) => enrichComponent(c, vulnByPurl))
}

// Degrades gracefully if riskSummary.byType isn't present yet (§7b, not
// guaranteed applied on every backend checkout) by computing it client-side
// from the already-enriched components.
export function getAnomalyTypeBreakdown(riskSummary, enrichedComponents) {
  if (riskSummary?.byType) return riskSummary.byType

  const byType = {}
  for (const c of enrichedComponents) {
    for (const a of c.anomalies) {
      byType[a.type] = (byType[a.type] || 0) + 1
    }
  }
  return byType
}

export function formatAnomalyTypeLabel(type) {
  return type
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}
