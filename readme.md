# SBOM_260077

A tool that takes a GitHub repo URL and generates a security-focused Software Bill of Materials (SBOM): every npm dependency, known vulnerabilities, and a handful of anomaly checks (typosquatting, risky licenses, suspicious install scripts, and more) — output as a standard CycloneDX JSON report.

---

## Requirements

- **Node.js 18+** and **npm** — check with `node -v` / `npm -v`
- **git** — needs to be callable from the command line (`git --version`)
- **Windows only:** use **PowerShell**, not the old Command Prompt (`cmd.exe`) — it's already the default terminal in VS Code and Windows Terminal, and every command below assumes it. `curl` and `python3` (as `py`) both ship with modern Windows, so no extra installs needed.

---

## Setup

```bash
git clone <this-repo-url>
cd sih260077_SBOM/backend
npm install
```
Same on every OS. No `.env` file or API keys required — everything the tool talks to (GitHub, npm registry, OSV.dev) is public.

---

## Running the server

**macOS / Linux:**
```bash
PORT=5050 npm run dev
```

**Windows (PowerShell):**
```powershell
$env:PORT=5050; npm run dev
```

We use `5050` instead of the default `5000` because **on macOS, port 5000 is often already held by AirPlay Receiver**, causing a confusing `EADDRINUSE` error. `5050` sidesteps that everywhere, so it's just the recommended default rather than something every OS specifically needs.

You should see:
```
SBOM backend running on :5050
```

If a previous run is stuck holding the port:
```bash
# macOS / Linux
lsof -ti :5050 | xargs kill -9
```
```powershell
# Windows (PowerShell) — find the process, then kill it by PID
netstat -ano | findstr :5050
taskkill /PID <the_pid_from_above> /F
```

## Running the Frontend

1. Navigate to the frontend folder:
   cd frontend

2. Install dependencies:
   npm install

3. Set up environment variables:
   cp .env.example .env
   # then edit .env and set:
   VITE_API_URL=http://localhost:5050   (backend URL)

4. Start the dev server:
   npm run dev
   # Do NOT use --port 5050 — that's the backend's port.
   # Frontend will run on its default port (usually 5173).

5. Make sure the backend is running separately on port 5050
   (see backend README) before using the app — frontend needs
   it for API calls.

---

## Running a scan

**macOS / Linux:**
```bash
curl -X POST http://localhost:5050/api/scan \
  -H "Content-Type: application/json" \
  -d '{"githubUrl":"https://github.com/OWNER/REPO"}' \
  > /tmp/scan-result.json

python3 -m json.tool /tmp/scan-result.json > /tmp/scan-pretty.json
```

**Windows (PowerShell)** — the backslash line-continuation above doesn't work in PowerShell, and quoting JSON needs escaped double-quotes, so it's easiest as one line:
```powershell
curl -X POST http://localhost:5050/api/scan -H "Content-Type: application/json" -d '{\"githubUrl\":\"https://github.com/OWNER/REPO\"}' -o scan-result.json

py -m json.tool scan-result.json > scan-pretty.json
```
(If `py` doesn't work, try `python` instead — depends on how Python was installed.)

**A scan can take anywhere from ~15 seconds to over a minute** for large repos — this is normal, it's checking every dependency against the npm registry and a vulnerability database, not a hang. Wait for the command to finish before opening the file.

To view the result:
```bash
# macOS
open /tmp/scan-pretty.json
```
```bash
# Linux
xdg-open /tmp/scan-pretty.json
```
```powershell
# Windows (PowerShell)
notepad scan-pretty.json
# or: start scan-pretty.json    (opens in your default JSON/text app)
```
Or, on any OS, open it in VS Code: `code scan-pretty.json` (if you have the `code` CLI installed).

---

## Running tests

```bash
npm test                          # run everything, same command on every OS
npx jest test/<name>.test.js      # run one suite, e.g. npx jest test/typosquat.test.js
```

---

## How it works, in plain terms

You give it a GitHub URL. Here's what happens, step by step:

1. **Clone the repo** — a shallow, temporary clone (deleted automatically when the scan finishes).
2. **Read `package-lock.json`** — this file already lists every dependency your project uses, including the indirect ones you never installed by hand. We flatten that into a simple list: name, version, and a few flags (is it a dev-only dependency? does it run a script during install?).
3. **Check for known vulnerabilities** — every package + version gets checked against [OSV.dev](https://osv.dev), a public vulnerability database. Anything with a known CVE/advisory gets flagged.
4. **Run anomaly checks on each package:**
   - **Typosquat check** — is this package's name suspiciously close (1-2 character edits) to a well-known package, but *not* actually that package? (e.g. a fake `expres` pretending to be `express`.) This is a common trick used to trick people into installing malware.
   - **Version pinning check** — is this dependency declared with a dangerously loose version range (like `*` or `latest`), meaning any future update — including a malicious one — gets installed automatically without anyone noticing?
   - **Install-script check** — does this package run a script automatically the moment it's installed? That's normal for some legitimate packages (native bindings, etc.), but it's also exactly how several real npm supply-chain attacks have worked — malicious code running before anyone even reads it.
   - **Freshness check** — is this a package that was published very recently *and* barely anyone downloads it? New + unpopular is a common profile for a malicious package trying to sneak in.
   - **License check** — what license does this package use? Permissive licenses (MIT, Apache, etc.) are safe for most use. "Copyleft" licenses (GPL, LGPL) can legally require you to open-source your own code if you use them — worth knowing about before you ship.
   - **Deprecated check** — has the package's own maintainer marked it deprecated on npm? If so, we surface their actual reason.
5. **Build the report** — everything above gets assembled into one JSON file in the CycloneDX format (an industry-standard SBOM format), plus a `riskSummary` section at the top with quick counts (how many critical/high/medium/low findings) so you don't have to read through every single dependency to get the gist.

---

## Known limitations right now

- **Scans are synchronous** — one request, blocking, until the whole thing finishes. No progress bar, no partial results.
- **Freshness/license checks hit the public npm registry hundreds of times per scan** — on a large dependency tree this can occasionally get rate-limited (HTTP 429). The tool retries automatically, but a few checks may still come back inconclusive on very large repos.
- **Typosquat detection only compares against ~9,500 well-known packages** ([`npm-high-impact`](https://www.npmjs.com/package/npm-high-impact)) — very obscure legitimate packages could theoretically still get a false positive, though this is rare in practice.
- **Requires an npm lockfile version 3** (generated by npm 7+). Older lockfiles will still scan, but install-script detection won't have data to work with.