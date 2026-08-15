//SBOM_260077

### Basic usage

npm install                        # after cloning fresh, or after adding npm-high-impact
npm test                           # run all suites
npx jest test/<name>.test.js       # run one suite
PORT=5050 npm run dev              # start server (avoids macOS port 5000 / AirPlay conflict)
lsof -ti :5050 | xargs kill -9     # free the port if something's stuck holding it

curl -X POST http://localhost:5050/api/scan -H "Content-Type: application/json" \
  -d '{"githubUrl":"REPO_URL_HERE"}' > /tmp/scan-result.json
python3 -m json.tool /tmp/scan-result.json > /tmp/scan-pretty.json
open /tmp/scan-pretty.json         # Mac; use `code` instead of open, if you prefer VS Code