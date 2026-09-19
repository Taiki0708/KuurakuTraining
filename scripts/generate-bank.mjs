import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const courses = JSON.parse(readFileSync(new URL('data/courses.json', root), 'utf8'));
const scenarios = JSON.parse(readFileSync(new URL('data/scenarios.json', root), 'utf8'));
const legacy = JSON.parse(readFileSync(new URL('data/legacy-questions.json', root), 'utf8'));
const languages = ['en', 'ja', 'hi'];
const prompts = {
  en: { first: 'What is the best first step?', yes: 'Is this a good response?', correct: 'The best action is: ', wrong: 'Guessing or ignoring the situation does not resolve it. Check with the responsible person and follow the store procedure.', guess: 'Guess and continue without checking.', ignore: 'Ignore the situation until someone else notices.', key: 'Check, communicate, then act.' },
  ja: { first: 'まず、どうしますか？', yes: 'この対応は適切ですか？', correct: '適切な対応：', wrong: '推測したり放置したりせず、担当者へ確認し、店の手順に従います。', guess: '確認せず、推測して進める。', ignore: 'ほかの人が気づくまで放っておく。', key: '確認し、伝えてから行動する。' },
  hi: { first: 'सबसे पहले क्या करना चाहिए?', yes: 'क्या यह उचित प्रतिक्रिया है?', correct: 'सही कदम: ', wrong: 'अनुमान लगाना या अनदेखी करना समस्या नहीं सुलझाता। ज़िम्मेदार व्यक्ति से जाँचें और दुकान की प्रक्रिया मानें।', guess: 'बिना जाँचे अनुमान लगाकर आगे बढ़ें।', ignore: 'जब तक कोई और न देखे, स्थिति को अनदेखा करें।', key: 'जाँचें, बताएँ, फिर काम करें।' }
};
const output = legacy.map(question => {
  const course = courses.find(item => item.legacyCourseIds.includes(question.courseId));
  if (!course) throw new Error(`No mapping for ${question.id}`);
  return { ...question, legacyCourseId: question.courseId, courseId: course.id, active: false,
    reviewStatus: ['hygiene-food-safety', 'allergies-dietary', 'safety-emergency'].includes(course.id) ? 'needs_human_review' : question.reviewStatus };
});
for (const course of courses) {
  const rows = scenarios[course.id];
  if (!rows) throw new Error(`Missing scenarios: ${course.id}`);
  rows.forEach((row, index) => {
    if (row.length !== 6) throw new Error(`Invalid scenario: ${course.id} ${index}`);
    const prefix = `v1-${course.id}-${String(index + 1).padStart(2, '0')}`;
    const scenario = Object.fromEntries(languages.map((lang, i) => [lang, row[i]]));
    const good = Object.fromEntries(languages.map((lang, i) => [lang, row[i + 3]]));
    const base = { courseId: course.id, scenarioGroup: prefix, storeRuleKey: prefix, difficulty: 'beginner', roles: ['all'], tags: ['scenario'], active: true, reviewStatus: 'needs_human_review' };
    const correctIndex = index % 3;
    output.push({ ...base, id: `${prefix}-a`, type: 'scenario', correctAnswer: correctIndex,
      translations: Object.fromEntries(languages.map(lang => [lang, {
        question: `${scenario[lang]} ${prompts[lang].first}`,
        options: correctIndex === 0 ? [good[lang], prompts[lang].guess, prompts[lang].ignore]
          : correctIndex === 1 ? [prompts[lang].guess, good[lang], prompts[lang].ignore]
          : [prompts[lang].guess, prompts[lang].ignore, good[lang]],
        explanation: `${prompts[lang].correct}${good[lang]} ${prompts[lang].wrong}`,
        keyPoint: prompts[lang].key
      }])) });
    const positive = index % 2 === 0;
    output.push({ ...base, id: `${prefix}-b`, type: 'true_false', correctAnswer: positive ? 0 : 1,
      translations: Object.fromEntries(languages.map(lang => [lang, {
        question: `${scenario[lang]} ${positive ? good[lang] : prompts[lang].guess} ${prompts[lang].yes}`,
        options: lang === 'ja' ? ['はい', 'いいえ'] : lang === 'hi' ? ['हाँ', 'नहीं'] : ['Yes', 'No'],
        explanation: `${prompts[lang].correct}${good[lang]} ${prompts[lang].wrong}`,
        keyPoint: prompts[lang].key
      }])) });
  });
}
for (const course of courses) {
  const count = output.filter(question => question.courseId === course.id && question.active).length;
  if (count !== 30) throw new Error(`${course.id}: ${count} questions, expected 30`);
}
writeFileSync(new URL('data/questions.json', root), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Generated ${output.filter(question => question.active).length} active questions and preserved ${legacy.length} legacy questions across ${courses.length} courses.`);
