const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'lp.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'lp-i18n.js'), 'utf8');

test('landing page exposes a Japanese and English language switcher', () => {
  assert.match(html, /id="lpLanguage"/);
  assert.match(html, /<option value="ja">日本語<\/option>/);
  assert.match(html, /<option value="en">English<\/option>/);
  assert.match(html, /lp-i18n\.js\?v=1/);
  assert.match(source, /localStorage\.setItem\("serveupLanguage"/);
});

test('landing page English copy covers every visible Japanese text node', () => {
  const dictionaryBlock = source.slice(source.indexOf('const english = {'), source.indexOf('const attributeEnglish'));
  const keys = new Set(Array.from(dictionaryBlock.matchAll(/^\s*"([^"]+)":/gm), match => match[1]));
  const body = html.slice(html.indexOf('<body'), html.indexOf('</body>'));
  const visibleText = Array.from(body.matchAll(/>([^<>]+)</g), match => match[1].trim())
    .filter(text => /[\u3040-\u30ff\u3400-\u9fff]/.test(text));
  const missing = [...new Set(visibleText.filter(text => !keys.has(text)))];
  assert.deepEqual(missing, []);
});

test('landing page localizes metadata, accessibility labels and consultation email links', () => {
  assert.match(source, /Multilingual Restaurant Staff Training/);
  assert.match(source, /attributeEnglish/);
  assert.match(source, /englishMailLinks/);
  assert.ok(source.includes('meta[property="og:title"]'));
});
