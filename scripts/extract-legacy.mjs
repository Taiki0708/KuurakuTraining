import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import vm from 'node:vm';

const courses = ['customer-service', 'food-safety', 'japanese-hospitality', 'restaurant-basics'];
const output = [];
for (const courseId of courses) {
  const html = readFileSync(new URL(`../${courseId}.html`, import.meta.url), 'utf8');
  const match = html.match(/const questions = (\[[\s\S]*?\]);\s*ServeUpQuiz\.init/);
  if (!match) throw new Error(`Legacy questions not found: ${courseId}`);
  const questions = vm.runInNewContext(match[1]);
  questions.forEach((item, index) => output.push({
    id: `legacy-${courseId}-${String(index + 1).padStart(2, '0')}`,
    courseId,
    type: 'multiple_choice',
    difficulty: 'beginner',
    roles: ['all'],
    correctAnswer: item.correct ?? item.answer,
    tags: ['legacy'],
    active: true,
    reviewStatus: courseId === 'food-safety' ? 'needs_human_review' : 'legacy',
    translations: {
      en: {
        question: item.question,
        options: item.answers ?? item.options,
        explanation: item.explanation,
        keyPoint: item.key || ''
      }
    }
  }));
}
mkdirSync(new URL('../data/', import.meta.url), { recursive: true });
writeFileSync(new URL('../data/legacy-questions.json', import.meta.url), JSON.stringify(output, null, 2) + '\n');
console.log(`Extracted ${output.length} immutable legacy IDs.`);
