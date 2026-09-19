import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const rootPath = fileURLToPath(root);
const walk = directory => readdirSync(directory, { withFileTypes:true }).flatMap(entry => {
  if (entry.name === '.git') return [];
  const target = join(directory, entry.name);
  return entry.isDirectory() ? walk(target) : [target];
});
const allFiles = walk(rootPath);
const scripts = allFiles.filter(name => ['.js','.mjs','.cjs'].includes(extname(name)));
for (const name of scripts) execFileSync(process.execPath, ['--check', name]);
for (const name of allFiles.filter(file => ['.json','.webmanifest'].includes(extname(file)))) JSON.parse(readFileSync(name, 'utf8'));
for (const html of allFiles.filter(file => extname(file) === '.html')) {
  const source = readFileSync(html, 'utf8');
  const base = source.match(/<base\s+href=["']([^"']+)["']/i)?.[1];
  const basePath = base ? resolve(dirname(html), base) : dirname(html);
  for (const match of source.matchAll(/(?:src|href)=["']([^"']+)["']/gi)) {
    const reference = match[1].split(/[?#]/)[0];
    if (!reference || /^(?:https?:|mailto:|tel:|data:|javascript:|\/)/i.test(reference)) continue;
    if (!existsSync(resolve(basePath, reference))) throw new Error(`${html} references missing ${reference}`);
  }
}
const courses = JSON.parse(readFileSync(new URL('data/courses.json', root), 'utf8'));
const legacy = JSON.parse(readFileSync(new URL('data/legacy-questions.json', root), 'utf8'));
const bank = JSON.parse(readFileSync(new URL('data/questions.json', root), 'utf8'));
if (courses.length !== 8 || legacy.length !== 40) throw new Error('Course or legacy bank count differs from expected.');
if (new Set(legacy.map(q => q.id)).size !== legacy.length) throw new Error('Duplicate legacy ID.');
if (new Set(bank.map(q => q.id)).size !== bank.length) throw new Error('Duplicate question ID.');
for (const course of courses) {
  const active = bank.filter(q => q.courseId === course.id && q.active);
  if (active.length !== 30) throw new Error(`${course.id} has ${active.length} active questions.`);
  for (const question of active) {
    for (const lang of ['en', 'ja', 'hi']) {
      const t = question.translations[lang];
      if (!t?.question || !t?.explanation || !t?.keyPoint || !Array.isArray(t.options) || t.options.length < 2 || !t.options[question.correctAnswer]) {
        throw new Error(`${question.id} missing valid ${lang} content.`);
      }
    }
  }
}
console.log(`Checked ${scripts.length} scripts and local HTML references; ${courses.length} courses, ${bank.filter(q => q.active).length} trilingual active questions and ${legacy.length} preserved legacy questions.`);
