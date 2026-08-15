import { useState } from 'react'

const GITHUB_URL_PATTERN = /^https?:\/\/github\.com\/[^/\s]+\/[^/\s]+\/?$/

export default function ScanInput({ onSubmit, disabled }) {
  const [url, setUrl] = useState('')
  const [touched, setTouched] = useState(false)

  const isValid = GITHUB_URL_PATTERN.test(url.trim())
  const showError = touched && url.trim().length > 0 && !isValid

  function handleSubmit(e) {
    e.preventDefault()
    setTouched(true)
    if (!isValid) return
    onSubmit(url.trim().replace(/\/$/, ''))
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <label htmlFor="repo-url" className="block text-sm text-muted mb-2">
        GitHub repository URL
      </label>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-dim text-sm select-none">
            ↗
          </span>
          <input
            id="repo-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={() => setTouched(true)}
            disabled={disabled}
            placeholder="https://github.com/owner/repo"
            className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-3.5 font-mono text-sm text-text placeholder:text-dim focus:border-accent focus:ring-1 focus:ring-accent transition-colors disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={disabled || !url.trim()}
          className="shrink-0 bg-accent hover:bg-accent/90 disabled:bg-border disabled:text-dim disabled:cursor-not-allowed text-bg font-semibold px-6 py-3.5 rounded-lg transition-colors"
        >
          {disabled ? 'Scanning…' : 'Run scan'}
        </button>
      </div>
      {showError && (
        <p className="mt-2 text-sm text-critical">
          That doesn't look like a GitHub repository URL — try something like{' '}
          <span className="font-mono">https://github.com/owner/repo</span>.
        </p>
      )}
      <p className="mt-3 text-xs text-dim">
        Public repos only, npm/Node.js projects with a committed <span className="font-mono text-dim">package-lock.json</span>.
      </p>
    </form>
  )
}
