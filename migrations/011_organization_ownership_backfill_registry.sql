-- Task 2 preparation: an audit-only registry for ownership decisions that
-- cannot be reconstructed from immutable database relationships.
--
-- This table is not writable from the browser. A production operator must add
-- reviewed mappings with a SQL administrator before migration 012 is applied.
begin;

create table if not exists public.organization_ownership_backfill (
  record_table text not null check (record_table in (
    'course_assignments', 'course_progress', 'training_attempts', 'certificates',
    'learner_groups', 'v1_quiz_sessions', 'v1_quiz_attempts',
    'v1_practical_reviews', 'v1_certificates'
  )),
  record_key text not null check (char_length(record_key) > 0),
  organization_id uuid not null references public.organizations(id),
  reason text not null check (char_length(trim(reason)) > 0),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (record_table, record_key)
);

alter table public.organization_ownership_backfill enable row level security;
revoke all on table public.organization_ownership_backfill from anon, authenticated;
grant all on table public.organization_ownership_backfill to service_role;

-- Explicit owner/operator confirmation received on 2026-09-24. These two
-- records were created for ServeUp development/testing, not employee
-- training. Their ownership is intentionally recorded here rather than
-- inferred from the user's current organization membership.
insert into public.organization_ownership_backfill(
  record_table, record_key, organization_id, reason, created_by
)
values
  (
    'v1_quiz_attempts',
    '621da588-202d-4019-9c63-d2504255326c',
    '943108b8-61f0-44cb-ab66-0fb529afc300',
    'Manual owner/operator confirmation on 2026-09-24: ServeUp development/test record, not employee training; approved for Existing organization. No membership inference.',
    '11be6c36-3a3c-4e49-b7d3-1fb1d35ba812'
  ),
  (
    'v1_quiz_attempts',
    'ff5c405e-477e-4a9c-a8f5-6de99c46be62',
    '943108b8-61f0-44cb-ab66-0fb529afc300',
    'Manual owner/operator confirmation on 2026-09-24: ServeUp development/test record, not employee training; approved for Existing organization. No membership inference.',
    '11be6c36-3a3c-4e49-b7d3-1fb1d35ba812'
  )
on conflict (record_table, record_key) do nothing;

-- Never silently accept a pre-existing conflicting decision. A conflict must
-- be reviewed explicitly before migration 012 can consume the registry.
do $confirmed_backfill$
begin
  if (
    select count(*)
    from public.organization_ownership_backfill decision
    where decision.record_table = 'v1_quiz_attempts'
      and decision.record_key in (
        '621da588-202d-4019-9c63-d2504255326c',
        'ff5c405e-477e-4a9c-a8f5-6de99c46be62'
      )
      and decision.organization_id = '943108b8-61f0-44cb-ab66-0fb529afc300'
      and decision.reason = 'Manual owner/operator confirmation on 2026-09-24: ServeUp development/test record, not employee training; approved for Existing organization. No membership inference.'
      and decision.created_by = '11be6c36-3a3c-4e49-b7d3-1fb1d35ba812'
  ) <> 2 then
    raise exception 'Confirmed Task 2 ownership decisions are missing or conflict with the owner/operator confirmation';
  end if;
end;
$confirmed_backfill$;

commit;
