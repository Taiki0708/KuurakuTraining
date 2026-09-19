const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const environment = fs.readFileSync(path.join(root, 'environment.js'), 'utf8');
const client = fs.readFileSync(path.join(root, 'supabase-client.js'), 'utf8');

test('staging backend is explicit and does not leak into later production navigation', () => {
  assert.match(environment, /params\.get\('environment'\) === 'staging'/);
  assert.doesNotMatch(environment, /localStorage|sessionStorage/);
  assert.match(environment, /kphwbearafqzfgnsfmiy\.supabase\.co/);
  assert.match(client, /window\.SERVEUP_SUPABASE_CONFIG \|\|/);
  assert.match(client, /wngljrvtoifrrsewcixx\.supabase\.co/);
});

test('staging navigation preserves its environment and disables public sign-up', () => {
  assert.match(environment, /url\.searchParams\.set\('environment', 'staging'\)/);
  assert.match(environment, /if \(signUp\) signUp\.hidden = true/);
  for (const file of ['v1.html','v1-admin.html','v1-certificate.html','auth.html']) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(html.indexOf('environment.js') < html.indexOf('supabase-client.js'), `${file} loads environment first`);
  }
});
