import { useMemo, useState } from 'react'
import SeverityBadge from './SeverityBadge'
import { SEVERITY_ORDER, SEVERITY_LABEL, formatAnomalyTypeLabel } from '../utils/transform'

function vulnLink(id) {
  if (id.startsWith('GHSA')) return `https://github.com/advisories/${id}`
  return `https://osv.dev/vulnerability/${id}`
}

const SEVERITY_RANK = { critical: 0, high: 1, medium: 2, low: 3, null: 4 }

export default function ComponentTable({ components }) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('severity')
  const [sortDir, setSortDir] = useState('asc')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [onlyVulns, setOnlyVulns] = useState(false)
  const [onlyFlagged, setOnlyFlagged] = useState(false)
  const [expanded, setExpanded] = useState(() => new Set())

  const allTypes = useMemo(() => {
    const types = new Set()
    components.forEach((c) => c.anomalies.forEach((a) => types.add(a.type)))
    return Array.from(types).sort()
  }, [components])

  const filtered = useMemo(() => {
    let list = components

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((c) => c.name.toLowerCase().includes(q))
    }
    if (severityFilter !== 'all') {
      list = list.filter((c) => c.severity === severityFilter)
    }
    if (typeFilter !== 'all') {
      list = list.filter((c) => c.anomalies.some((a) => a.type === typeFilter))
    }
    if (onlyVulns) {
      list = list.filter((c) => c.vulns.length > 0)
    }
    if (onlyFlagged) {
      list = list.filter((c) => c.flagCount > 0)
    }

    const sorted = [...list].sort((a, b) => {
      let cmp = 0
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortBy === 'version') cmp = a.version.localeCompare(b.version)
      else if (sortBy === 'flags') cmp = b.flagCount - a.flagCount
      else if (sortBy === 'severity') cmp = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
      return sortDir === 'asc' ? cmp : -cmp
    })

    return sorted
  }, [components, search, severityFilter, typeFilter, onlyVulns, onlyFlagged, sortBy, sortDir])

  function toggleSort(col) {
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(col)
      setSortDir('asc')
    }
  }

  function toggleExpanded(purl) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(purl)) next.delete(purl)
      else next.add(purl)
      return next
    })
  }

  const activeFilterCount =
    (severityFilter !== 'all' ? 1 : 0) +
    (typeFilter !== 'all' ? 1 : 0) +
    (onlyVulns ? 1 : 0) +
    (onlyFlagged ? 1 : 0)

  function clearFilters() {
    setSeverityFilter('all')
    setTypeFilter('all')
    setOnlyVulns(false)
    setOnlyFlagged(false)
  }

  return (
    <div className="w-full animate-fade-in">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search components by name…"
            className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 text-sm font-mono placeholder:text-dim focus:border-accent focus:ring-1 focus:ring-accent"
          />
          <span className="self-center text-xs text-dim whitespace-nowrap">
            {filtered.length} of {components.length} shown
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-surface border border-border rounded-md px-3 py-1.5 text-xs text-muted focus:border-accent"
          >
            <option value="all">All severities</option>
            {SEVERITY_ORDER.map((s) => (
              <option key={s} value={s}>{SEVERITY_LABEL[s]}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-surface border border-border rounded-md px-3 py-1.5 text-xs text-muted focus:border-accent"
          >
            <option value="all">All flag types</option>
            {allTypes.map((t) => (
              <option key={t} value={t}>{formatAnomalyTypeLabel(t)}</option>
            ))}
          </select>

          <button
            onClick={() => setOnlyVulns((v) => !v)}
            className={`rounded-md px-3 py-1.5 text-xs border transition-colors ${
              onlyVulns
                ? 'bg-critical/15 border-critical/30 text-critical'
                : 'bg-surface border-border text-muted hover:border-borderLight'
            }`}
          >
            Has vulnerability
          </button>

          <button
            onClick={() => setOnlyFlagged((v) => !v)}
            className={`rounded-md px-3 py-1.5 text-xs border transition-colors ${
              onlyFlagged
                ? 'bg-accent/15 border-accent/30 text-accent'
                : 'bg-surface border-border text-muted hover:border-borderLight'
            }`}
          >
            Has any flag
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-dim hover:text-muted underline underline-offset-2"
            >
              Clear filters ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[1fr_120px_100px_120px_140px_28px] gap-2 px-4 py-2.5 bg-raised border-b border-border text-xs text-dim uppercase tracking-wide">
            <SortHeader label="Name" col="name" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
            <SortHeader label="Version" col="version" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
            <span>Scope</span>
            <span>License</span>
            <SortHeader label="Flags" col="severity" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
            <span />
          </div>

          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-dim">
              No components match the current filters.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((c) => (
                <ComponentRow
                  key={c.purl}
                  component={c}
                  isExpanded={expanded.has(c.purl)}
                  onToggle={() => toggleExpanded(c.purl)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="mt-1.5 text-[11px] text-dim sm:hidden">Scroll horizontally to see all columns →</p>
    </div>
  )
}

function SortHeader({ label, col, sortBy, sortDir, onClick }) {
  const active = sortBy === col
  return (
    <button
      onClick={() => onClick(col)}
      className={`text-left flex items-center gap-1 hover:text-muted transition-colors ${active ? 'text-accent' : ''}`}
    >
      {label}
      {active && <span className="text-[10px]">{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </button>
  )
}

function ComponentRow({ component: c, isExpanded, onToggle }) {
  const licenseLabel = c.licenses?.length
    ? c.licenses.map((l) => l.license?.id).filter(Boolean).join(', ')
    : '—'

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full grid grid-cols-[1fr_120px_100px_120px_140px_28px] gap-2 px-4 py-3 text-left items-center hover:bg-raised/60 transition-colors"
      >
        <span className="font-mono text-sm text-text truncate">{c.name}</span>
        <span className="font-mono text-xs text-muted truncate">{c.version}</span>
        <span className="text-xs text-muted capitalize">{c.scope || 'required'}</span>
        <span className="text-xs text-muted truncate">{licenseLabel}</span>
        <span className="flex items-center gap-1.5">
          {c.severity ? (
            <>
              <SeverityBadge severity={c.severity} />
              {c.flagCount > 1 && <span className="text-[11px] text-dim">+{c.flagCount - 1}</span>}
            </>
          ) : (
            <span className="text-xs text-dim">Clean</span>
          )}
        </span>
        <span className={`text-dim text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-1 bg-bg/40 border-t border-border/60 animate-fade-in">
          <p className="text-xs text-dim font-mono mb-3 break-all">{c.purl}</p>

          {c.vulns.length > 0 && (
            <div className="mb-3">
              <p className="text-xs uppercase tracking-wide text-dim mb-1.5">Vulnerabilities</p>
              <div className="flex flex-wrap gap-2">
                {c.vulns.map((v) => (
                  <a
                    key={v.id}
                    href={vulnLink(v.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-critical/30 bg-critical/10 px-2.5 py-1 text-xs font-mono text-critical hover:bg-critical/20 transition-colors"
                  >
                    {v.id} ↗
                  </a>
                ))}
              </div>
            </div>
          )}

          {c.anomalies.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-dim mb-1.5">Flags</p>
              <div className="space-y-1.5">
                {c.anomalies.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <SeverityBadge severity={a.severity} />
                    <span className="text-muted">
                      <span className="text-text">{formatAnomalyTypeLabel(a.type)}</span> — {a.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {c.vulns.length === 0 && c.anomalies.length === 0 && (
            <p className="text-sm text-dim">No vulnerabilities or flags for this component.</p>
          )}
        </div>
      )}
    </div>
  )
}
