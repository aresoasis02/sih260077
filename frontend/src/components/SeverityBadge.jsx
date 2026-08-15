const STYLES = {
  critical: 'bg-critical/15 text-critical border-critical/30',
  high: 'bg-high/15 text-high border-high/30',
  medium: 'bg-medium/15 text-medium border-medium/30',
  low: 'bg-low/15 text-low border-low/30',
}

const LABEL = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export default function SeverityBadge({ severity, size = 'sm' }) {
  if (!severity) return null
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-mono font-medium uppercase tracking-wide ${padding} ${STYLES[severity]}`}
    >
      {LABEL[severity]}
    </span>
  )
}
