// Base URL for the backend. Override at build/dev time with a .env file:
//   VITE_API_BASE_URL=http://localhost:5050/api
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api'

/**
 * Calls POST /api/scan. This is a long-running, fully synchronous request
 * (backend has no job queue / polling) — it can take anywhere from ~15s to
 * over a minute for large repos. No AbortController timeout is set here on
 * purpose: cutting the request off client-side would just show an error for
 * a scan that was actually still working server-side.
 */
export async function scanRepo(githubUrl) {
  const res = await fetch(`${API_BASE_URL}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ githubUrl }),
  })

  let body
  try {
    body = await res.json()
  } catch {
    throw new Error('The server sent back something unreadable. Try again.')
  }

  if (!res.ok) {
    throw new Error(body.error || `Scan failed (${res.status})`)
  }

  return body
}
