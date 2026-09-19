const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const schema = fs.readFileSync(path.join(root, 'migrations/001_serveup_v1.sql'), 'utf8');
const seed = fs.readFileSync(path.join(root, 'migrations/002_serveup_v1_seed.sql'), 'utf8');
const stagingAccess = fs.readFileSync(path.join(root, 'migrations/003_serveup_staging_access.sql'), 'utf8');
const stagingMembers = fs.readFileSync(path.join(root, 'migrations/004_serveup_staging_test_members.sql'), 'utf8');
const scoringFix = fs.readFileSync(path.join(root, 'migrations/005_fix_attempt_scoring.sql'), 'utf8');

test('all user-data V1 tables enable row-level security', () => {
  for (const table of ['v1_course_settings','v1_question_keys','v1_practical_items','v1_quiz_sessions','v1_quiz_attempts','v1_practical_reviews','v1_certificates','v1_profile_preferences']) {
    assert.match(schema, new RegExp(`alter table public\\.${table} enable row level security`, 'i'), table);
  }
});

test('answer keys have no authenticated client grant and attempts are server-scored', () => {
  assert.match(schema, /revoke all on public\.v1_question_keys from anon, authenticated/i);
  assert.doesNotMatch(schema, /grant\s+select[^;]*v1_question_keys\s+to\s+authenticated/i);
  assert.match(schema, /create or replace function public\.submit_v1_attempt/i);
  assert.match(schema, /v_score\s*:=\s*round/i);
  assert.doesNotMatch(schema, /policy[^;]+v1_attempts[^;]+for insert/i);
});

test('practical approval requires a manager relationship and a passing quiz', () => {
  assert.match(schema, /reviewer_id\s*=\s*\(select auth\.uid\(\)\)/i);
  assert.match(schema, /public\.v1_is_manager_of\(user_id\)/i);
  assert.match(schema, /v1_quiz_attempts[\s\S]+a\.passed/i);
  assert.match(schema, /v1_issue_certificate_after_practical/i);
});

test('seed preserves legacy completion records through explicit course mapping', () => {
  for (const [oldId, newId] of [['restaurant-basics','restaurant-orientation'],['food-safety','hygiene-food-safety'],['customer-service','guest-service-basics'],['japanese-hospitality','guest-service-basics']]) {
    assert.ok(seed.includes(`('${oldId}','${newId}')`));
  }
  assert.match(seed, /on conflict \(id\) do nothing/i);
});

test('migrations also support an empty staging project', () => {
  assert.match(schema, /to_regprocedure\('public\.get_my_training_access\(\)'\)/i);
  assert.match(schema, /to_regprocedure\('public\.get_training_learners\(\)'\)/i);
  assert.match(seed, /to_regclass\('public\.course_progress'\) is not null/i);
});

test('staging access bootstrap is scoped, server-readable and closed to browser table access', () => {
  assert.match(stagingAccess, /to_regprocedure\('public\.get_my_training_access\(\)'\) is null/i);
  assert.match(stagingAccess, /to_regprocedure\('public\.get_training_learners\(\)'\) is null/i);
  assert.match(stagingAccess, /security definer set search_path = public, auth, pg_temp/i);
  assert.match(stagingAccess, /revoke all on public\.serveup_memberships from anon, authenticated/i);
  assert.match(stagingAccess, /learner\.organization_id = access\.organization_id/i);
  assert.match(stagingAccess, /learner\.role = 'learner'/i);
});

test('staging test-member seed is idempotent and contains no passwords', () => {
  assert.match(stagingMembers, /manager@serveup-staging\.test/);
  assert.match(stagingMembers, /learner@serveup-staging\.test/);
  assert.match(stagingMembers, /on conflict \(user_id\) do update/i);
  assert.doesNotMatch(stagingMembers, /encrypted_password|password\s*=/i);
});

test('attempt scoring qualifies question IDs and keeps answer keys server-side', () => {
  assert.match(scoringFix, /selected\(question_id\)/i);
  assert.match(scoringFix, /question_key\.id = selected\.question_id/i);
  assert.match(scoringFix, /security definer/i);
  assert.match(scoringFix, /revoke all on function public\.submit_v1_attempt/i);
});
