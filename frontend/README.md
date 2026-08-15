# SBOM Scanner — Frontend

React (Vite) + Tailwind frontend for the SBOM backend described in
`SIH_26077_part3.md`. Built against that doc's **§4 current API shape**
(`riskSummary`, per-component `licenses`/`properties`) — not the older
contract in the original build guide.

## What it does

- One input: a GitHub URL.
- Calls `POST /api/scan` on your backend (long-running, synchronous — no
  polling, matches the backend's actual architecture).
- Shows a risk summary dashboard (severity counts + anomaly-type breakdown),
  then a searchable, sortable, filterable table of every resolved
  dependency, with expandable rows showing full vulnerability IDs (linked
  out to GHSA/OSV) and every anomaly with its severity + reason.

## Running it

```bash
npm install
cp .env.example .env
# edit .env if your backend isn't on http://localhost:5050
npm run dev
```

Opens on `http://localhost:5173`. Your backend needs to be running
separately (`PORT=5050 npm run dev` from `backend/`, per the doc) and needs
CORS enabled for the frontend's origin — the backend's `server.js` already
has `app.use(cors())`, so this should just work out of the box.

## Build for production

```bash
npm run build
```

Outputs static files to `dist/` — serve with any static host, or point
`vite preview` at it locally to sanity-check the production build.

## Project structure

```
src/
  App.jsx                    # state machine: idle -> loading -> results | error
  api.js                     # POST /api/scan client
  utils/transform.js         # parses CycloneDX properties into UI-friendly shapes
  components/
    ScanInput.jsx            # Phase 1 — URL input + validation
    LoadingState.jsx         # Phase 1 — loading state, honest about no real progress signal
    ErrorBanner.jsx          # Phase 1 — error display
    RiskSummary.jsx          # Phase 2 — dashboard cards + anomaly-type bars
    ComponentTable.jsx       # Phases 3-5 — table, search/sort/filter, expandable rows
    SeverityBadge.jsx        # shared severity color coding (critical/high/medium/low)
```

## Known limitations / not built yet

Straight from `SIH_26077_part3.md` §9 Phase 6 ("Polish") — not done, listed
here so nothing gets assumed finished by mistake:

- No license-breakdown chart (pie/bar of permissive vs copyleft vs unknown)
- No export button (raw CycloneDX JSON download, or CSV/PDF summary)
- No table virtualization — fine up to several hundred rows, worth adding
  (`react-window` or similar) if a scanned repo's component count gets into
  the thousands and the table feels sluggish
- No dedicated empty-state illustration for a repo with zero anomalies —
  currently just renders a normal table where every row says "Clean"

## A note on the loading state

The backend has no job queue or progress signal — `POST /api/scan` blocks
until the whole pipeline finishes, sometimes 15s, sometimes over a minute.
The loading screen's rotating messages ("Cloning repository…", "Resolving
dependencies…", etc.) are **not real backend status** — they're a
best-guess sequence on a timer, exactly as `SIH_26077_part3.md` §8
acknowledges. If the backend is ever changed to expose real job status,
`LoadingState.jsx` is the only file that would need to change.
