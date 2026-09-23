const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

test('both admin dashboards expose the shared three-language switcher', () => {
  const legacy = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
  const v1 = fs.readFileSync(path.join(root, 'v1-admin.html'), 'utf8');
  for (const source of [legacy, v1]) {
    assert.match(source, /id="adminLanguageSelect"/);
    assert.match(source, /value="en"/);
    assert.match(source, /value="ja"/);
    assert.match(source, /value="hi"/);
    assert.match(source, /admin-i18n\.js/);
  }
});

test('admin translations cover core navigation, reports, practical checks and statuses', () => {
  const source = fs.readFileSync(path.join(root, 'admin-i18n.js'), 'utf8');
  for (const key of ['Training dashboard','Assignments','Completed training','Practical check','Course test settings','Saving…','Overdue','No matching staff or courses.']) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.equal((source.match(new RegExp(`'${escaped}'`, 'g')) || []).length >= 2, true, key);
  }
  assert.match(source, /localStorage\.setItem\('serveupLanguage'/);
});
