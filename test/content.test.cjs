const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const courses = read('data/courses.json');
const bank = read('data/questions.json');

test('eight courses each have 30 active, fully trilingual questions', () => {
  assert.equal(courses.length, 8);
  assert.equal(bank.filter(q => q.active).length, 240);
  for (const course of courses) {
    const questions = bank.filter(q => q.active && q.courseId === course.id);
    assert.equal(questions.length, 30, course.id);
    for (const question of questions) {
      assert.ok(['multiple_choice','true_false','scenario'].includes(question.type));
      assert.ok(question.reviewStatus);
      for (const language of ['en','ja','hi']) {
        const text = question.translations[language];
        assert.ok(text?.question && text?.explanation && text?.keyPoint, `${question.id} ${language}`);
        assert.ok(text.options[question.correctAnswer], `${question.id} ${language} answer`);
      }
    }
  }
});

test('legacy question IDs are preserved but excluded from the new active test bank', () => {
  const legacy = read('data/legacy-questions.json');
  for (const old of legacy) {
    const mapped = bank.find(q => q.id === old.id);
    assert.ok(mapped, old.id);
    assert.equal(mapped.active, false);
    assert.equal(mapped.legacyCourseId, old.courseId);
  }
});

test('manifest and service-worker shell paths exist locally', () => {
  const manifest = read('manifest.webmanifest');
  assert.equal(manifest.name, 'ServeUp');
  assert.equal(manifest.display, 'standalone');
  for (const size of [192,512]) {
    for (const purpose of ['any','maskable']) {
      const icon = manifest.icons.find(item => item.sizes === `${size}x${size}` && item.purpose === purpose);
      assert.ok(icon, `${size} ${purpose}`);
      const png = fs.readFileSync(path.join(root, icon.src));
      assert.equal(png.toString('ascii', 1, 4), 'PNG');
      assert.equal(png.readUInt32BE(16), size);
      assert.equal(png.readUInt32BE(20), size);
    }
  }
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(sw, /offline\.html/);
  assert.match(sw, /data\\\/\(courses\|questions\)/);
});
