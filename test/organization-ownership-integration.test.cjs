const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

test('PostgreSQL organization isolation integration scenarios', { skip: !process.env.SERVEUP_TEST_DATABASE_URL }, () => {
  const sql = path.join(__dirname, 'sql/organization-ownership.integration.sql');
  const result = spawnSync('psql', ['-X', '-v', 'ON_ERROR_STOP=1', process.env.SERVEUP_TEST_DATABASE_URL, '-f', sql], {
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});
