const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../quiz-core.js');
const bank = Array.from({ length: 30 }, (_, i) => ({ id: `q${i}`, courseId: 'course', active: true, correctAnswer: 0, translations: { en: {} } }));

test('draw is unique, bounded and prefers unseen questions', () => {
    const drawn = core.selectQuestions(bank, 10, bank.slice(0, 20).map(q => q.id), () => 0.3);
    assert.equal(drawn.length, 10);
    assert.equal(new Set(drawn.map(q => q.id)).size, 10);
    assert.ok(drawn.every(q => Number(q.id.slice(1)) >= 20));
});
test('draw handles shortages and duplicate IDs', () => {
    assert.equal(core.selectQuestions([bank[0], bank[0], bank[1]], 15).length, 2);
    assert.deepEqual(core.selectQuestions([], 10), []);
});

test('draw avoids two variants of one scenario when alternatives exist', () => {
  const bank = [
    { id:'a1', scenarioGroup:'a' }, { id:'a2', scenarioGroup:'a' },
    { id:'b1', scenarioGroup:'b' }, { id:'c1', scenarioGroup:'c' }
  ];
  const selected = core.selectQuestions(bank, 3, [], () => 0.5);
  assert.equal(new Set(selected.map(item => item.scenarioGroup)).size, 3);
});
test('80 percent is a passing score', () => {
    const ten = bank.slice(0, 10);
    const answers = Object.fromEntries(ten.map((q, i) => [q.id, i < 8 ? 0 : 1]));
    assert.deepEqual(core.scoreAnswers(ten, answers), { correct: 8, total: 10, score: 80, passed: true, wrongIds: ['q8', 'q9'] });
    assert.equal(core.scoreAnswers(ten, answers, 90).passed, false);
});
test('filter excludes inactive and untranslated questions', () => {
    assert.equal(core.eligibleQuestions([...bank, { id:'x', courseId:'course', active:false, translations:{en:{}} }], 'course', 'hi').length, 0);
});
