const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const registry = fs.readFileSync(path.join(root, 'migrations/011_organization_ownership_backfill_registry.sql'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'migrations/012_immutable_organization_ownership.sql'), 'utf8');
const client = fs.readFileSync(path.join(root, 'supabase-client.js'), 'utf8');
const v1Store = fs.readFileSync(path.join(root, 'v1-store.js'), 'utf8');

test('all restaurant operational tables receive explicit ownership', () => {
  const existing = ['course_assignments', 'course_progress', 'training_attempts', 'certificates', 'learner_groups'];
  const added = ['group_memberships', 'group_course_assignments', 'v1_quiz_sessions', 'v1_quiz_attempts', 'v1_practical_reviews', 'v1_certificates'];
  for (const table of existing) {
    assert.match(migration, new RegExp(`alter table public\\.${table} alter column organization_id set not null`, 'i'), table);
  }
  for (const table of added) {
    assert.match(migration, new RegExp(`alter table public\\.${table}[\\s\\S]{0,100}add column if not exists organization_id`, 'i'), table);
    assert.match(migration, new RegExp(`alter table public\\.${table} alter column organization_id set not null`, 'i'), table);
  }
  assert.match(migration, /training_announcements[\s\S]{0,100}add column if not exists organization_id/i);
  assert.doesNotMatch(migration, /v1_profile_preferences[\s\S]{0,100}add column[^;]*organization_id/i);
});

test('historical ownership is immutable and membership changes cannot move records', () => {
  assert.match(migration, /create or replace function public\.prevent_organization_ownership_change/i);
  assert.match(migration, /old\.organization_id is distinct from new\.organization_id/i);
  for (const table of ['course_progress', 'training_attempts', 'v1_quiz_attempts', 'v1_practical_reviews', 'v1_certificates']) {
    assert.match(migration, new RegExp(`'${table}'`), table);
  }
});

test('ambiguous existing rows stop atomically instead of using current membership', () => {
  assert.match(migration, /^begin;/m);
  assert.match(migration, /raise exception 'Ambiguous organization ownership/i);
  assert.match(migration, /public\.organization_ownership_backfill/i);
  assert.match(registry, /revoke all on table public\.organization_ownership_backfill from anon, authenticated/i);
  assert.doesNotMatch(migration, /order by organization_id[\s\S]{0,80}limit 1/i);
  assert.doesNotMatch(migration, /sole_membership/i);
  assert.doesNotMatch(migration, /delete\s+from\s+public\.(course_|training_|v1_)/i);
  assert.doesNotMatch(migration, /truncate/i);
});

test('only the two owner-confirmed V1 test attempts are explicitly mapped', () => {
  const confirmedOrganization = '943108b8-61f0-44cb-ab66-0fb529afc300';
  const confirmedAttempts = [
    '621da588-202d-4019-9c63-d2504255326c',
    'ff5c405e-477e-4a9c-a8f5-6de99c46be62'
  ];
  for (const attemptId of confirmedAttempts) {
    assert.ok(registry.includes(attemptId), attemptId);
  }
  assert.ok(registry.includes(confirmedOrganization));
  assert.ok(registry.includes('11be6c36-3a3c-4e49-b7d3-1fb1d35ba812'));
  assert.match(registry, /Manual owner\/operator confirmation on 2026-09-24/);
  assert.match(registry, /development\/test record, not employee training/);
  assert.match(registry, /No membership inference/);
  assert.match(registry, /on conflict \(record_table, record_key\) do nothing/i);
  assert.match(registry, /Confirmed Task 2 ownership decisions are missing or conflict/i);
  assert.match(registry, /decision\.created_by = '11be6c36-3a3c-4e49-b7d3-1fb1d35ba812'/i);

  const insertedAttemptIds = [...registry.matchAll(/'([0-9a-f]{8}-[0-9a-f-]{27})'/gi)]
    .map(match => match[1])
    .filter(value => ![confirmedOrganization, '11be6c36-3a3c-4e49-b7d3-1fb1d35ba812'].includes(value));
  assert.deepEqual(new Set(insertedAttemptIds), new Set(confirmedAttempts));
});

test('learner reads are self-only within the selected restaurant', () => {
  for (const policy of ['organization_progress_access', 'organization_attempt_access', 'v1_attempts_read', 'v1_practical_read', 'v1_certificates_read']) {
    const start = migration.indexOf(`create policy ${policy}`);
    assert.notEqual(start, -1, policy);
    const definition = migration.slice(start, start + 420);
    assert.match(definition, /organization_id = public\.current_organization_id\(\)/i, policy);
    assert.match(definition, /user_id = auth\.uid\(\)/i, policy);
    assert.match(definition, /public\.is_organization_admin\(organization_id\)/i, policy);
    assert.doesNotMatch(definition, /is_organization_member\(organization_id\)/i, policy);
  }
});

test('restaurant managers are scoped to their selected organization', () => {
  assert.match(migration, /create or replace function public\.is_organization_admin\(p_organization_id uuid\)/i);
  assert.match(migration, /membership\.organization_id = p_organization_id[\s\S]*membership\.user_id = auth\.uid\(\)[\s\S]*membership\.role = 'admin'/i);
  assert.match(migration, /progress\.organization_id = public\.current_organization_id\(\)/i);
  assert.match(migration, /assignment\.organization_id = public\.current_organization_id\(\)/i);
});

test('browser writes cannot spoof organization ownership', () => {
  assert.match(migration, /v_organization_id uuid := public\.require_current_organization_id\(\)/i);
  assert.match(migration, /insert into public\.v1_quiz_attempts\([\s\S]*v_organization_id/i);
  assert.match(migration, /with check \(organization_id = public\.current_organization_id\(\) and user_id = auth\.uid\(\)\)/i);
  assert.match(migration, /revoke all on table public\.course_assignments, public\.course_progress,[\s\S]*from anon, authenticated/i);
  assert.match(client, /rpc\("record_training_attempt"/i);
  assert.match(client, /rpc\("save_training_completion"/i);
});

test('multi-organization context is explicit and never chosen by UUID order', () => {
  assert.match(migration, /create table if not exists public\.user_organization_context/i);
  assert.match(migration, /create or replace function public\.set_current_organization/i);
  assert.match(migration, /if not exists \([\s\S]*organization_members[\s\S]*p_organization_id[\s\S]*auth\.uid\(\)/i);
  assert.doesNotMatch(migration, /order by organization_id[\s\S]{0,80}limit 1/i);
  assert.match(client, /getOrganizationContext/);
  assert.match(client, /Select a restaurant before accessing training data/);
});

test('frontend queries and local fallback keys are organization-scoped', () => {
  assert.match(v1Store, /serveup-v1:\$\{kind\}:\$\{organizationId\}:\$\{userId\}:\$\{courseId\}/);
  assert.match(v1Store, /eq\('organization_id', organizationId\)/);
  assert.match(v1Store, /onConflict: 'organization_id,user_id,course_id'/);
  assert.match(v1Store, /onConflict: 'organization_id,user_id,course_id,item_id'/);
  assert.match(client, /eq\("organization_id", organizationId\)/);
});
