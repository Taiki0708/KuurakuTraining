const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const migrationsDir = path.join(root, 'migrations');
const productionSqlFiles = fs.readdirSync(migrationsDir)
  .filter(name => name.endsWith('.sql'))
  .sort()
  .map(name => path.join(migrationsDir, name));
const productionSql = productionSqlFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n');
const legacySchema = fs.readFileSync(path.join(migrationsDir, '008_production_legacy_schema.sql'), 'utf8');
const legacyRpcs = fs.readFileSync(path.join(migrationsDir, '009_production_legacy_rpcs.sql'), 'utf8');
const aclSnapshot = fs.readFileSync(path.join(migrationsDir, '010_production_acl_snapshot.sql'), 'utf8');
const baseline = fs.readFileSync(path.join(migrationsDir, 'PRODUCTION-BASELINE.md'), 'utf8');

const frontendSources = ['supabase-client.js', 'v1-store.js', 'v1-admin.js']
  .map(name => fs.readFileSync(path.join(root, name), 'utf8'))
  .join('\n');

function referenced(pattern) {
  return [...frontendSources.matchAll(pattern)].map(match => match[1]);
}

test('every frontend table reference has a version-controlled table definition', () => {
  const tables = new Set(referenced(/\.from\(['"]([^'"]+)['"]\)/g));
  for (const table of tables) {
    assert.match(
      productionSql,
      new RegExp(`create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.${table}\\b`, 'i'),
      table
    );
  }
});

test('every frontend RPC reference has a version-controlled function definition', () => {
  const functions = new Set(referenced(/\.rpc\(['"]([^'"]+)['"]/g));
  for (const fn of functions) {
    assert.match(
      productionSql,
      new RegExp(`create\\s+or\\s+replace\\s+function\\s+public\\.${fn}\\s*\\(`, 'i'),
      fn
    );
  }
});

test('production baseline covers organization, membership and assignment objects', () => {
  for (const table of [
    'organizations', 'organization_members', 'user_roles', 'course_assignments',
    'learner_groups', 'group_memberships', 'group_course_assignments'
  ]) {
    assert.match(legacySchema, new RegExp(`create table if not exists public\\.${table}\\b`, 'i'), table);
    assert.match(legacySchema, new RegExp(`alter table public\\.${table} enable row level security`, 'i'), table);
  }
  for (const fn of [
    'current_organization_id', 'is_organization_member',
    'is_current_organization_admin', 'is_platform_admin',
    'get_my_training_access', 'get_training_learners',
    'assign_training_course', 'get_training_assignments'
  ]) {
    assert.match(productionSql, new RegExp(`function public\\.${fn}\\s*\\(`, 'i'), fn);
  }
});

test('legacy production tables have RLS and the inspected named policies', () => {
  const legacyTables = [
    'organizations', 'organization_members', 'user_roles', 'courses',
    'course_translations', 'course_questions', 'course_assignments',
    'course_progress', 'training_attempts', 'certificates', 'learner_groups',
    'group_memberships', 'group_course_assignments', 'training_announcements'
  ];
  for (const table of legacyTables) {
    assert.match(legacySchema, new RegExp(`alter table public\\.${table} enable row level security`, 'i'), table);
  }
  for (const policy of [
    'organization_assignment_access', 'organization_progress_access',
    'organization_progress_write', 'organization_progress_update',
    'organization_attempt_access', 'organization_attempt_write',
    'organization_certificate_access'
  ]) {
    assert.ok(legacySchema.includes(policy), policy);
  }
});

test('captured security-definer functions pin their search path', () => {
  const definitions = legacyRpcs.match(/create or replace function[\s\S]*?\$function\$;/gi) || [];
  assert.ok(definitions.length >= 27);
  for (const definition of definitions) {
    assert.match(definition, /security definer/i);
    assert.match(definition, /set search_path\s*=\s*public(?:, auth)?/i);
  }
});

test('production ACL snapshot keeps answer keys unavailable to browser roles', () => {
  assert.match(aclSnapshot, /revoke all on table public\.v1_question_keys from anon, authenticated/i);
  assert.doesNotMatch(aclSnapshot, /grant all on table public\.v1_question_keys to anon/i);
});

test('staging-only SQL is outside the production migration sequence', () => {
  const rootSqlNames = productionSqlFiles.map(file => path.basename(file));
  assert.ok(!rootSqlNames.includes('003_serveup_staging_access.sql'));
  assert.ok(!rootSqlNames.includes('004_serveup_staging_test_members.sql'));
  assert.ok(fs.existsSync(path.join(migrationsDir, 'staging/003_serveup_staging_access.sql')));
  assert.ok(fs.existsSync(path.join(migrationsDir, 'staging/004_serveup_staging_test_members.sql')));
});

test('baseline migrations contain no destructive schema or data statements', () => {
  const sql = [legacySchema, legacyRpcs, aclSnapshot].join('\n');
  assert.doesNotMatch(sql, /drop\s+table/i);
  assert.doesNotMatch(sql, /alter\s+table[\s\S]{0,100}\bdrop\b/i);
  assert.doesNotMatch(sql, /truncate\s+(table\s+)?/i);
});

test('known drift and inspection requirements are documented instead of guessed', () => {
  assert.match(baseline, /Requires production Supabase inspection/);
  assert.match(baseline, /four legacy course IDs/i);
  assert.match(baseline, /organization_plan/);
  assert.match(baseline, /types are not present in the\s+inspected production `public` schema/i);
  assert.match(baseline, /have not been applied/i);
});
