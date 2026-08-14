const fs = require('fs');
const { cloneRepo, findLockfile, cleanup } = require('../src/modules/ingest/repoIngest');

// IMPORTANT: replace this with a small public repo YOU control that has a
// committed package-lock.json at its root. Easiest way to guarantee this:
//   1. mkdir test-fixture-repo && cd test-fixture-repo
//   2. npm init -y && npm install express
//   3. git init && git add . && git commit -m "init"
//   4. create a new PUBLIC repo on GitHub, push it there
// Using a repo you control means this test won't break if some third-party
// repo changes its lockfile policy or gets deleted.
const TEST_REPO_URL = 'https://github.com/marmikjain5/web.3-website';
const REPO_WITHOUT_LOCKFILE_URL = 'https://github.com/aresoasis02/python-lab-programs-sem-1';

describe('repoIngest', () => {
  jest.setTimeout(30000); // cloning needs more than jest's 5s default

  test('clones a repo and finds the lockfile', () => {
    let repoDir;
    try {
      repoDir = cloneRepo(TEST_REPO_URL);
      const lockPath = findLockfile(repoDir);
      expect(fs.existsSync(lockPath)).toBe(true);
      expect(lockPath.endsWith('package-lock.json')).toBe(true);
    } finally {
      if (repoDir) cleanup(repoDir);
    }
  });

  test('throws a clear error when no lockfile is present', () => {
    let repoDir;
    try {
      repoDir = cloneRepo(REPO_WITHOUT_LOCKFILE_URL);
      expect(() => findLockfile(repoDir)).toThrow(/No package-lock.json found/);
    } finally {
      if (repoDir) cleanup(repoDir);
    }
  });

  test('cleanup actually removes the temp dir', () => {
    const repoDir = cloneRepo(TEST_REPO_URL);
    expect(fs.existsSync(repoDir)).toBe(true);
    cleanup(repoDir);
    expect(fs.existsSync(repoDir)).toBe(false);
  });
});
