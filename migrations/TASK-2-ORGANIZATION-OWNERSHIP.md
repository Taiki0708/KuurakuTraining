# Task 2 organization ownership

## Design classification

| Table | `organization_id` | Reason |
| --- | --- | --- |
| `course_assignments` | Required | An assignment is issued by one restaurant and must not move with a learner. |
| `course_progress` | Required | Scores and completion history are private restaurant records. |
| `training_attempts` | Required | Every attempt belongs to the restaurant where it was taken. |
| `certificates` | Required | The issuing restaurant is part of certificate provenance. |
| `learner_groups` | Required | Groups are restaurant-owned management objects. |
| `group_memberships` | Required, derived from group | Explicit ownership makes joins and RLS independently safe. |
| `group_course_assignments` | Required, derived from group | Group assignments must remain in the group's restaurant. |
| `training_announcements` | Optional | `NULL` means platform/global; a value means restaurant-only. |
| `v1_quiz_sessions` | Required | In-progress state must be separated between restaurants. |
| `v1_quiz_attempts` | Required | Quiz history is private and immutable per restaurant. |
| `v1_practical_reviews` | Required | A manager approval belongs to the reviewing restaurant. |
| `v1_certificates` | Required | Certificate provenance must survive later membership changes. |
| `v1_profile_preferences` | Not applicable | Display name and locale are user-global preferences, not training history. |

`user_organization_context` stores the user's explicit active restaurant.
Single-membership users receive that one context automatically. A user with
multiple memberships and no saved selection receives no active organization;
the database never chooses the first UUID.

## Existing-data rules

Migration `011` creates a server-only, auditable mapping registry. Migration
`012` accepts only these sources of historical ownership:

1. An already populated `organization_id` (never overwritten).
2. An explicit reviewed row in `organization_ownership_backfill`.
3. A deterministic legacy V1 attempt ID linked to its organization-owned
   `course_progress` source row.
4. A V1 practical review or certificate linked to passed attempts for exactly
   one organization.
5. A group child row linked to its organization-owned parent group.

Current membership alone is never treated as proof of historical ownership.
If any required row remains unresolved, migration `012` raises an exception and
the whole transaction rolls back.

Backfill record keys use these formats:

| `record_table` | `record_key` |
| --- | --- |
| `course_assignments` | `<user_id>|<course_id>` |
| `course_progress` | `<user_id>|<course_id>` |
| `training_attempts` | `<id>` |
| `certificates` | `<id>` |
| `learner_groups` | `<id>` |
| `v1_quiz_sessions` | `<user_id>|<course_id>` |
| `v1_quiz_attempts` | `<id>` |
| `v1_practical_reviews` | `<user_id>|<course_id>|<item_id>` |
| `v1_certificates` | `<id>` |

## Production read-only finding and reviewed resolution (2026-09-24)

- One organization member exists; no current multi-organization user exists.
- Legacy `course_progress`: 1 row, already organization-owned.
- V1 attempts: 3 rows. One `legacy` row is deterministically linked to owned
  progress. Two native V1 rows have no immutable organization lineage.
- V1 practical reviews: 1 row, linkable after its passed attempt is mapped.
- No other required table contains an unresolved row.

The ServeUp owner/operator subsequently confirmed that the two native V1 rows
were development/testing activity, not employee training, and explicitly
approved their ownership by `Existing organization`
(`943108b8-61f0-44cb-ab66-0fb529afc300`). Migration `011` records only those
two decisions. No other ambiguous ownership is inferred.

| `record_table` | `record_key` | Confirmed organization |
| --- | --- | --- |
| `v1_quiz_attempts` | `621da588-202d-4019-9c63-d2504255326c` | `943108b8-61f0-44cb-ab66-0fb529afc300` |
| `v1_quiz_attempts` | `ff5c405e-477e-4a9c-a8f5-6de99c46be62` | `943108b8-61f0-44cb-ab66-0fb529afc300` |

The registry records the confirming owner/operator account as
`11be6c36-3a3c-4e49-b7d3-1fb1d35ba812`. The insert fails if that Auth user or
the target organization is absent, and migration `011` raises an exception if
a pre-existing registry row conflicts with the confirmed organization,
confirmation reason, or confirmer.

## Read-only preflight for manual review

Run this after migration `011` and before `012`. It reveals record identifiers,
not answers, emails, names, or quiz content.

```sql
select 'v1_quiz_attempts'::text as record_table,
       attempt.id::text as record_key,
       attempt.completed_at
from public.v1_quiz_attempts attempt
where attempt.source <> 'legacy'
order by attempt.completed_at;
```

After the responsible restaurant is verified from business records, add an
audited mapping as a SQL administrator. Do not add another mapping merely
because a user currently has one membership:

```sql
insert into public.organization_ownership_backfill(
  record_table, record_key, organization_id, reason
)
values (
  'v1_quiz_attempts',
  '<reviewed-attempt-id>',
  '<verified-organization-id>',
  '<how ownership was independently verified>'
);
```

Never populate this registry from the browser and never use the current
membership as the sole verification reason.

## New-row rules

- Browser-facing writes either call a `SECURITY DEFINER` RPC that derives the
  active organization, or carry an organization value checked by RLS against
  the validated active context.
- Legacy attempts/progress and both certificate issuers derive ownership in RPCs.
- V1 scoring derives ownership in `submit_v1_attempt`.
- `organization_id` updates are rejected by an immutability trigger.
- Organization-scoped keys allow the same learner/course to exist independently
  in more than one restaurant without overwriting history.

## Access rules

- Learner: selected organization plus `user_id = auth.uid()` for private data.
- Manager/admin: selected organization plus an admin membership in that exact
  organization.
- Platform admin: no blanket table bypass; platform operations continue through
  explicit privileged RPCs.
- Anonymous browser roles have no access to operational training tables.

The old coworker leak is closed: ordinary organization membership is no longer
sufficient to read `course_progress` or `training_attempts`.

## Validation record

On 2026-09-24, migrations `008` through `012` plus
`test/sql/organization-ownership.integration.sql` were executed against the
separate ServeUp staging PostgreSQL project inside one outer transaction. The
transaction used a production-shaped fixture containing the three known V1
attempts, including the two owner-confirmed native test attempts. All row-count,
backfill, immutability, Restaurant A/B isolation, learner isolation, and spoof
rejection assertions passed, and the transaction was rolled back.

The staging-only bootstrap exposes different OUT columns for
`get_my_training_access()` and `get_training_learners()` than the inspected
production functions. The two bootstrap functions were therefore dropped only
inside the outer rollback transaction before migration `009` recreated the
production signatures. A read-only check after rollback confirmed the original
staging functions and all pre-existing V1 row counts were restored.
