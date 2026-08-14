//repoingest.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function cloneRepo(githubUrl) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sbom-'));
  execSync(`git clone --depth 1 ${githubUrl} ${tmpDir}`, { stdio: 'ignore' });
  return tmpDir;
}

function findLockfile(repoDir) {
  const lockPath = path.join(repoDir, 'package-lock.json');
  if (!fs.existsSync(lockPath)) {
    throw new Error('No package-lock.json found — manifest-only');
  }
  return lockPath;
}

function cleanup(repoDir) {
  fs.rmSync(repoDir, { recursive: true, force: true });
}

module.exports = { cloneRepo, findLockfile, cleanup };