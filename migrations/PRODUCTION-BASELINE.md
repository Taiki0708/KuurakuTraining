# ServeUp production database baseline

This directory now contains an auditable baseline for the application-owned
objects used by the production ServeUp frontend. The baseline was compared
with read-only PostgreSQL catalog queries against production on 2026-09-24.
No migration in this Task 1 change was applied to production.

## Migration sets

Production migrations, in order:

1. `001_serveup_v1.sql`
2. `002_serveup_v1_seed.sql`
3. `005_fix_attempt_scoring.sql`
4. `006_profile_display_name.sql`
5. `007_unify_training_catalog.sql`
6. `008_production_legacy_schema.sql`
7. `009_production_legacy_rpcs.sql`
8. `010_production_acl_snapshot.sql`

Staging-only bootstraps are intentionally isolated under `migrations/staging/`.
They contain a hard-coded staging organization and test account emails and
must never be included in a production migration run.

## Application-owned tables covered

Legacy and organization layer:

- `organizations`
- `organization_members`
- `user_roles`
- `courses`
- `course_translations`
- `course_questions`
- `course_assignments`
- `course_progress`
- `training_attempts`
- `certificates`
- `learner_groups`
- `group_memberships`
- `group_course_assignments`
- `training_announcements`

V1 training layer:

- `v1_course_settings`
- `v1_question_keys`
- `v1_practical_items`
- `v1_quiz_sessions`
- `v1_quiz_attempts`
- `v1_practical_reviews`
- `v1_certificates`
- `v1_profile_preferences`

The baseline includes the inspected columns, defaults, primary and unique
keys, foreign keys, CHECK constraints, the non-primary V1 attempts index, RLS
enablement, policies, and grants. Primary and unique constraints create the
other inspected indexes.

## RPC/functions covered

Organization and access:

- `current_organization_id()`
- `is_organization_member(uuid)`
- `is_current_organization_admin()`
- `is_platform_admin()`
- `is_training_admin()`
- `get_my_training_access()`
- `get_training_learners()`

Assignments, reports, groups, and certificates:

- `assign_training_course(uuid,text,date)`
- `get_training_assignments()`
- `get_training_report()`
- `issue_training_certificate(text)`
- `get_my_training_certificate(text)`
- `get_training_groups()`
- `create_training_group(text,text)`
- `get_training_group_members(uuid)`
- `add_training_group_member(uuid,uuid)`
- `assign_training_group_course(uuid,text,date)`

Course and announcement administration:

- `get_course_translation(text,text)`
- `get_admin_courses()`
- `save_training_course(text,integer,boolean,text,text)`
- `save_training_course_translation(text,text,text,text)`
- `get_admin_course_questions(text)`
- `save_training_question(uuid,text,text,jsonb,smallint,text,integer)`
- `save_training_question_locale(uuid,text,text,text,jsonb,smallint,text,integer)`
- `delete_training_question(uuid,text)`
- `get_training_announcements()`
- `save_training_announcement(uuid,text,text,boolean)`

Platform administration:

- `get_platform_organizations()`
- `create_platform_organization(text,text)`
- `update_platform_organization(uuid,text,text,text)`
- `get_platform_organization_members(uuid)`
- `add_platform_organization_member(uuid,text,text)`

V1 functions remain covered by `001` and `005`:

- `v1_is_platform_admin()`
- `v1_is_manager_of(uuid)`
- `submit_v1_attempt(uuid,text,text[],jsonb)`
- `issue_v1_certificate(text)`
- `v1_issue_certificate_after_practical()`

## Trigger coverage

Production has one non-internal application trigger:

- `v1_practical_certificate` on `v1_practical_reviews`, defined in `001`.

No custom non-internal trigger was found on `auth.users` during the inspection.

## Confirmed production concerns retained by the baseline

These are intentionally not fixed in Task 1:

1. `course_assignments` and `course_progress` still have CHECK constraints
   limited to the four legacy course IDs, while the frontend now offers eight
   unified course IDs.
2. `course_progress` and `training_attempts` allow any member of an
   organization to select every row for that organization, not only their own
   rows. A learner can therefore query coworker results directly through the
   REST API.
3. `current_organization_id()` selects the first organization UUID. A user in
   more than one organization has no explicit active-organization context.
4. `learner_groups.name` is globally unique rather than unique per
   organization.
5. `get_training_learners()` returns every organization member and does not
   filter `role = 'learner'`.
6. Most tables currently grant all table privileges to `anon` and
   `authenticated`; RLS is the effective boundary. Most RPCs also retain broad
   execute grants. `010` records that state but does not endorse it.
7. `training_announcements` and the legacy course content are global rather
   than organization-scoped.
8. V1 training records still do not carry `organization_id`. That change is
   explicitly deferred to Task 2.

## Requires production Supabase inspection

- **Requires production Supabase inspection:** safely invoking
  `create_platform_organization`, `update_platform_organization`, and
  `add_platform_organization_member`. Their captured production bodies cast to
  `public.organization_plan`, `public.organization_status`, and
  `public.organization_member_role`, but those types are not present in the
  inspected production `public` schema. Calling the mutation RPCs would change
  production data, so Task 1 did not execute them.
- **Requires production Supabase inspection:** project-level Auth settings
  such as email confirmation, redirect URLs, provider configuration, SMTP, and
  password policy. These are Supabase project configuration, not PostgreSQL
  objects exposed by the migration catalog.
- **Requires production Supabase inspection:** Supabase-managed definitions in
  the `auth` schema. The application references `auth.users`, but vendor-owned
  Auth schema migrations should not be copied into application migrations.
- **Requires production Supabase inspection:** database-wide default
  privileges and role inheritance outside the application-owned `public`
  objects. `010` records the effective grants on objects the frontend uses.

## Safety

The baseline migrations contain no table drops, column drops, data deletes,
data truncation, or bulk data updates. `CREATE TABLE IF NOT EXISTS` preserves
existing production tables. `CREATE OR REPLACE FUNCTION` reproduces inspected
function bodies. Policies are created only when the named policy is absent.

Because `010` deliberately records broad current ACLs and the platform RPC
type references need inspection, review these migrations before any production
application. They have not been applied as part of Task 1.
