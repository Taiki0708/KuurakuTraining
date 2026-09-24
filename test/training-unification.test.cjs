const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('learner navigation presents one ServeUp Training program', () => {
  const home = read('index.html');
  const account = read('my-training.html');
  const training = read('v1.html');

  assert.match(home, />ServeUp Training</);
  assert.doesNotMatch(home, /Foundation courses|data-course-id=/);
  assert.doesNotMatch(home, /ServeUp V1|Open V1|V1 training/);
  assert.doesNotMatch(account, /V1 training/);
  assert.match(training, /href="admin\.html" id="adminLink"/);
});

test('all eight unified courses can be assigned by an administrator', () => {
  const admin = read('admin.html');
  const ids = [
    'restaurant-orientation', 'hygiene-food-safety', 'guest-service-basics', 'workplace-communication',
    'allergies-dietary', 'safety-emergency', 'order-serving-payment', 'complaints-difficult'
  ];
  for (const id of ids) assert.match(admin, new RegExp(`option value="${id}"`));
  assert.match(admin, /Staff progress &amp; practical checks/);
});

test('catalog migration preserves original rows while activating the unified catalog', () => {
  const migration = read('migrations/007_unify_training_catalog.sql');
  assert.match(migration, /insert into public\.courses \(id, sort_order, is_active\)/i);
  assert.doesNotMatch(migration, /insert into public\.courses \([^)]*title/i);
  assert.match(migration, /on conflict \(id\) do update/i);
  assert.match(migration, /is_active = false/i);
  assert.doesNotMatch(migration, /delete\s+from\s+public\.courses/i);
  for (const legacyId of ['customer-service', 'food-safety', 'japanese-hospitality', 'restaurant-basics']) {
    assert.match(migration, new RegExp(`'${legacyId}'`));
  }
});

test('account history merges original completions into canonical course IDs', () => {
  const accountScript = read('my-training.js');
  assert.match(accountScript, /'restaurant-basics': 'restaurant-orientation'/);
  assert.match(accountScript, /'food-safety': 'hygiene-food-safety'/);
  assert.match(accountScript, /'customer-service': 'guest-service-basics'/);
  assert.match(accountScript, /'japanese-hospitality': 'guest-service-basics'/);
  assert.match(accountScript, /trainingStore\.attempts/);
});
