const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'auth.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'auth.js'), 'utf8');

test('authentication screen separates sign-in, sign-up and email confirmation states', () => {
  assert.match(html, /id="signInModeButton"/);
  assert.match(html, /id="signUpButton"/);
  assert.match(html, /id="confirmPassword"/);
  assert.match(html, /id="confirmationPanel"/);
  assert.match(html, /id="resendButton"/);
  assert.match(html, /id="authLanguage"/);
});

test('authentication flow prevents duplicate requests and handles email limits', () => {
  assert.match(script, /if \(busy \|\| !validateForm\(\)\) return/);
  assert.match(script, /over_email_send_rate_limit/);
  assert.match(script, /startSubmitCooldown/);
  assert.match(script, /auth\.resend\(\{ type: "signup"/);
  assert.match(script, /startCooldown\(60\)/);
});

test('authentication screen includes English, Japanese and Hindi copy', () => {
  assert.match(script, /en: \{/);
  assert.match(script, /ja: \{/);
  assert.match(script, /hi: \{/);
  assert.match(script, /メールを確認してください/);
  assert.match(script, /अपना ईमेल देखें/);
});
