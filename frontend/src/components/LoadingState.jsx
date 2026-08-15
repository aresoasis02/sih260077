import { useEffect, useState } from 'react'

// Honest UX: the backend is fully synchronous with no real progress signal,
// so these are a rotating best-guess of pipeline stage, not a live status.
// See SIH_26077_part3.md §8 — this is a deliberate, acknowledged limitation.
const STAGES = [
  'Cloning repository…',
  'Resolving lockfile dependency tree…',
  'Querying OSV.dev for known vulnerabilities…',
  'Checking for typosquats and install scripts…',
  'Checking package freshness and licenses…',
  'Assembling risk report…',
]

export default function LoadingState() {
  const [stageIndex, setStageIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const stageTimer = setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, STAGES.length - 1))
    }, 9000)
    const clock = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => {
      clearInterval(stageTimer)
      clearInterval(clock)
    }
  }, [])

  const rows = Array.from({ length: 8 })

  return (
    <div className="w-full max-w-2xl animate-fade-in">
      <div className="relative overflow-hidden rounded-lg border border-border bg-surface">
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent animate-scan-sweep" />
        <div className="divide-y divide-border">
          {rows.map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="h-2 w-2 rounded-full bg-border shrink-0" />
              <div
                className="h-2.5 rounded bg-border"
                style={{ width: `${35 + ((i * 13) % 45)}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm text-text flex items-center gap-2">
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-dot" />
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-dot [animation-delay:0.2s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-dot [animation-delay:0.4s]" />
          </span>
          {STAGES[stageIndex]}
        </p>
        <span className="text-xs text-dim font-mono">{elapsed}s</span>
      </div>
      <p className="mt-2 text-xs text-dim">
        Large dependency trees can take up to a minute or two. This runs a real clone and live registry lookups — hang tight.
      </p>
    </div>
  )
}
