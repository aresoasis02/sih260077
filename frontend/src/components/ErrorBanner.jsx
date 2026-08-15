export default function ErrorBanner({ message, onDismiss }) {
  return (
    <div className="w-full max-w-2xl animate-fade-in rounded-lg border border-critical/30 bg-critical/10 px-4 py-3.5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-critical font-mono text-sm">✕</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-text">Scan failed</p>
          <p className="mt-1 text-sm text-muted">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-dim hover:text-muted text-sm shrink-0"
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
