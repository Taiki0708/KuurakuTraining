-- Task 2: make organization ownership explicit and immutable for operational
-- training data. This migration is deliberately atomic: if an existing row
-- cannot be assigned without guessing, the exception rolls back every change.
--
-- Review and run the read-only preflight in PRODUCTION-BASELINE.md before this
-- migration is applied to any environment. Never bypass the ambiguity checks.
begin;

-- A multi-organization user must select an organization explicitly. The
-- context row is only writable through set_current_organization(), which
-- verifies the caller's membership server-side.
create table if not exists public.user_organization_context (
  user_id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  updated_at timestamptz not null default now(),
  foreign key (organization_id, user_id)
    references public.organization_members(organization_id, user_id)
    on delete cascade
);
alter table public.user_organization_context enable row level security;
revoke all on table public.user_organization_context from anon, authenticated;

create or replace function public.current_organization_id()
returns uuid
language sql stable security definer
set search_path = public, pg_temp
as $function$
  select coalesce(
    (
      select context.organization_id
      from public.user_organization_context context
      join public.organization_members membership
        on membership.organization_id = context.organization_id
       and membership.user_id = context.user_id
      where context.user_id = auth.uid()
    ),
    (
      select case when count(*) = 1
        then (array_agg(membership.organization_id))[1]
        else null
      end
      from public.organization_members membership
      where membership.user_id = auth.uid()
    )
  );
$function$;

create or replace function public.require_current_organization_id()
returns uuid
language plpgsql stable security definer
set search_path = public, pg_temp
as $function$
declare
  v_organization_id uuid := public.current_organization_id();
begin
  if auth.uid() is null then
    raise exception 'Sign-in required';
  end if;
  if v_organization_id is null then
    raise exception 'Select an organization before accessing training data';
  end if;
  return v_organization_id;
end;
$function$;

create or replace function public.set_current_organization(p_organization_id uuid)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $function$
begin
  if auth.uid() is null then
    raise exception 'Sign-in required';
  end if;
  if not exists (
    select 1
    from public.organization_members membership
    where membership.organization_id = p_organization_id
      and membership.user_id = auth.uid()
  ) then
    raise exception 'Organization membership required';
  end if;

  insert into public.user_organization_context(user_id, organization_id, updated_at)
  values (auth.uid(), p_organization_id, now())
  on conflict (user_id) do update set
    organization_id = excluded.organization_id,
    updated_at = excluded.updated_at;
end;
$function$;

create or replace function public.get_my_organization_context()
returns table(organization_id uuid, organization_name text, role text, selected boolean)
language sql stable security definer
set search_path = public, pg_temp
as $function$
  select membership.organization_id,
         organization.name,
         membership.role::text,
         membership.organization_id = public.current_organization_id()
  from public.organization_members membership
  join public.organizations organization on organization.id = membership.organization_id
  where membership.user_id = auth.uid()
  order by organization.name, organization.id;
$function$;

create or replace function public.is_organization_admin(p_organization_id uuid)
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $function$
  select exists (
    select 1
    from public.organization_members membership
    where membership.organization_id = p_organization_id
      and membership.user_id = auth.uid()
      and membership.role = 'admin'
  );
$function$;

create or replace function public.is_current_organization_admin()
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $function$
  select public.is_organization_admin(public.current_organization_id());
$function$;

-- Add ownership columns before backfilling. Existing nullable legacy columns
-- are retained in place; only V1/group/announcement tables need new columns.
alter table public.group_memberships
  add column if not exists organization_id uuid references public.organizations(id);
alter table public.group_course_assignments
  add column if not exists organization_id uuid references public.organizations(id);
alter table public.training_announcements
  add column if not exists organization_id uuid references public.organizations(id);
alter table public.v1_quiz_sessions
  add column if not exists organization_id uuid references public.organizations(id);
alter table public.v1_quiz_attempts
  add column if not exists organization_id uuid references public.organizations(id);
alter table public.v1_practical_reviews
  add column if not exists organization_id uuid references public.organizations(id);
alter table public.v1_certificates
  add column if not exists organization_id uuid references public.organizations(id);

-- Historical ownership is never inferred from a user's current membership.
-- Explicit backfill rows are reviewed by an operator and kept as an audit log.
update public.course_assignments target
set organization_id = decision.organization_id
from public.organization_ownership_backfill decision
where target.organization_id is null
  and decision.record_table = 'course_assignments'
  and decision.record_key = target.user_id::text || '|' || target.course_id;

update public.course_progress target
set organization_id = decision.organization_id
from public.organization_ownership_backfill decision
where target.organization_id is null
  and decision.record_table = 'course_progress'
  and decision.record_key = target.user_id::text || '|' || target.course_id;

update public.training_attempts target
set organization_id = decision.organization_id
from public.organization_ownership_backfill decision
where target.organization_id is null
  and decision.record_table = 'training_attempts'
  and decision.record_key = target.id::text;

update public.certificates target
set organization_id = decision.organization_id
from public.organization_ownership_backfill decision
where target.organization_id is null
  and decision.record_table = 'certificates'
  and decision.record_key = target.id::text;

update public.learner_groups target
set organization_id = decision.organization_id
from public.organization_ownership_backfill decision
where target.organization_id is null
  and decision.record_table = 'learner_groups'
  and decision.record_key = target.id::text;

update public.group_memberships target
set organization_id = learner_group.organization_id
from public.learner_groups learner_group
where target.organization_id is null
  and target.group_id = learner_group.id
  and learner_group.organization_id is not null;

update public.group_course_assignments target
set organization_id = learner_group.organization_id
from public.learner_groups learner_group
where target.organization_id is null
  and target.group_id = learner_group.id
  and learner_group.organization_id is not null;

update public.v1_quiz_sessions target
set organization_id = decision.organization_id
from public.organization_ownership_backfill decision
where target.organization_id is null
  and decision.record_table = 'v1_quiz_sessions'
  and decision.record_key = target.user_id::text || '|' || target.course_id;

-- Seeded legacy attempts have a deterministic immutable link to the original
-- organization-owned course_progress row, so this is not a membership guess.
update public.v1_quiz_attempts target
set organization_id = progress.organization_id
from public.course_progress progress
join (values
  ('restaurant-basics','restaurant-orientation'),
  ('food-safety','hygiene-food-safety'),
  ('customer-service','guest-service-basics'),
  ('japanese-hospitality','guest-service-basics')
) mapping(legacy_course_id, v1_course_id)
  on mapping.legacy_course_id = progress.course_id
where target.organization_id is null
  and target.source = 'legacy'
  and target.id = md5('serveup-v1:' || progress.user_id::text || ':' || progress.course_id)::uuid
  and target.user_id = progress.user_id
  and target.course_id = mapping.v1_course_id;

update public.v1_quiz_attempts target
set organization_id = decision.organization_id
from public.organization_ownership_backfill decision
where target.organization_id is null
  and decision.record_table = 'v1_quiz_attempts'
  and decision.record_key = target.id::text;

-- A practical review or certificate can inherit ownership only when its exact
-- learner/course has passed attempts in one and only one organization.
with practical_candidates as (
  select review.user_id, review.course_id, review.item_id,
         (array_agg(distinct attempt.organization_id))[1] as organization_id
  from public.v1_practical_reviews review
  join public.v1_quiz_attempts attempt
    on attempt.user_id = review.user_id
   and attempt.course_id = review.course_id
   and attempt.passed
   and attempt.organization_id is not null
  where review.organization_id is null
  group by review.user_id, review.course_id, review.item_id
  having count(distinct attempt.organization_id) = 1
)
update public.v1_practical_reviews target
set organization_id = candidate.organization_id
from practical_candidates candidate
where target.organization_id is null
  and target.user_id = candidate.user_id
  and target.course_id = candidate.course_id
  and target.item_id = candidate.item_id;

update public.v1_practical_reviews target
set organization_id = decision.organization_id
from public.organization_ownership_backfill decision
where target.organization_id is null
  and decision.record_table = 'v1_practical_reviews'
  and decision.record_key = target.user_id::text || '|' || target.course_id || '|' || target.item_id;

with certificate_candidates as (
  select certificate.id,
         (array_agg(distinct attempt.organization_id))[1] as organization_id
  from public.v1_certificates certificate
  join public.v1_quiz_attempts attempt
    on attempt.user_id = certificate.user_id
   and attempt.course_id = certificate.course_id
   and attempt.passed
   and attempt.organization_id is not null
  where certificate.organization_id is null
  group by certificate.id
  having count(distinct attempt.organization_id) = 1
)
update public.v1_certificates target
set organization_id = candidate.organization_id
from certificate_candidates candidate
where target.organization_id is null and target.id = candidate.id;

update public.v1_certificates target
set organization_id = decision.organization_id
from public.organization_ownership_backfill decision
where target.organization_id is null
  and decision.record_table = 'v1_certificates'
  and decision.record_key = target.id::text;

-- Existing announcements intentionally remain global (organization_id null).
-- Any unresolved row in a required table makes ownership ambiguous and aborts
-- the entire transaction. This check reports counts only, never private data.
do $ownership_preflight$
declare
  v_unresolved jsonb;
begin
  select jsonb_agg(item) into v_unresolved
  from (
    select 'course_assignments' as table_name, count(*) as unresolved from public.course_assignments where organization_id is null
    union all select 'course_progress', count(*) from public.course_progress where organization_id is null
    union all select 'training_attempts', count(*) from public.training_attempts where organization_id is null
    union all select 'certificates', count(*) from public.certificates where organization_id is null
    union all select 'learner_groups', count(*) from public.learner_groups where organization_id is null
    union all select 'group_memberships', count(*) from public.group_memberships where organization_id is null
    union all select 'group_course_assignments', count(*) from public.group_course_assignments where organization_id is null
    union all select 'v1_quiz_sessions', count(*) from public.v1_quiz_sessions where organization_id is null
    union all select 'v1_quiz_attempts', count(*) from public.v1_quiz_attempts where organization_id is null
    union all select 'v1_practical_reviews', count(*) from public.v1_practical_reviews where organization_id is null
    union all select 'v1_certificates', count(*) from public.v1_certificates where organization_id is null
  ) item
  where item.unresolved > 0;

  if v_unresolved is not null then
    raise exception 'Ambiguous organization ownership; migration stopped: %', v_unresolved;
  end if;
end;
$ownership_preflight$;

-- Required ownership is now enforceable. Defaults derive from validated
-- server-side context; RLS below still rejects any spoofed explicit value.
alter table public.course_assignments alter column organization_id set not null;
alter table public.course_progress alter column organization_id set not null;
alter table public.training_attempts alter column organization_id set not null;
alter table public.certificates alter column organization_id set not null;
alter table public.learner_groups alter column organization_id set not null;
alter table public.group_memberships alter column organization_id set not null;
alter table public.group_course_assignments alter column organization_id set not null;
alter table public.v1_quiz_sessions alter column organization_id set not null;
alter table public.v1_quiz_attempts alter column organization_id set not null;
alter table public.v1_practical_reviews alter column organization_id set not null;
alter table public.v1_certificates alter column organization_id set not null;

alter table public.course_assignments alter column organization_id set default public.require_current_organization_id();
alter table public.course_progress alter column organization_id set default public.require_current_organization_id();
alter table public.training_attempts alter column organization_id set default public.require_current_organization_id();
alter table public.certificates alter column organization_id set default public.require_current_organization_id();
alter table public.learner_groups alter column organization_id set default public.require_current_organization_id();
alter table public.group_memberships alter column organization_id set default public.require_current_organization_id();
alter table public.group_course_assignments alter column organization_id set default public.require_current_organization_id();
alter table public.v1_quiz_sessions alter column organization_id set default public.require_current_organization_id();
alter table public.v1_quiz_attempts alter column organization_id set default public.require_current_organization_id();
alter table public.v1_practical_reviews alter column organization_id set default public.require_current_organization_id();
alter table public.v1_certificates alter column organization_id set default public.require_current_organization_id();

-- Keys are organization-scoped so the same learner/course can have independent
-- history in different restaurants without moving or overwriting old records.
alter table public.course_assignments drop constraint if exists course_assignments_pkey;
alter table public.course_assignments add primary key (organization_id, user_id, course_id);
alter table public.course_progress drop constraint if exists course_progress_pkey;
alter table public.course_progress add primary key (organization_id, user_id, course_id);
alter table public.certificates drop constraint if exists certificates_user_id_course_id_key;
alter table public.certificates add unique (organization_id, user_id, course_id);

alter table public.learner_groups drop constraint if exists learner_groups_name_key;
alter table public.learner_groups add unique (organization_id, name);
alter table public.learner_groups add unique (id, organization_id);

alter table public.group_memberships drop constraint if exists group_memberships_pkey;
alter table public.group_memberships add primary key (organization_id, group_id, user_id);
alter table public.group_memberships add constraint group_memberships_group_organization_fkey
  foreign key (group_id, organization_id)
  references public.learner_groups(id, organization_id) on delete cascade;

alter table public.group_course_assignments drop constraint if exists group_course_assignments_pkey;
alter table public.group_course_assignments add primary key (organization_id, group_id, course_id);
alter table public.group_course_assignments add constraint group_course_assignments_group_organization_fkey
  foreign key (group_id, organization_id)
  references public.learner_groups(id, organization_id) on delete cascade;

alter table public.v1_quiz_sessions drop constraint if exists v1_quiz_sessions_pkey;
alter table public.v1_quiz_sessions add primary key (organization_id, user_id, course_id);
alter table public.v1_practical_reviews drop constraint if exists v1_practical_reviews_pkey;
alter table public.v1_practical_reviews add primary key (organization_id, user_id, course_id, item_id);
alter table public.v1_certificates drop constraint if exists v1_certificates_user_id_course_id_key;
alter table public.v1_certificates add unique (organization_id, user_id, course_id);

create index if not exists course_assignments_org_user_idx on public.course_assignments(organization_id, user_id);
create index if not exists course_progress_org_completed_idx on public.course_progress(organization_id, completed_at desc);
create index if not exists training_attempts_org_user_date_idx on public.training_attempts(organization_id, user_id, attempted_at desc);
create index if not exists certificates_org_user_idx on public.certificates(organization_id, user_id);
create index if not exists learner_groups_org_idx on public.learner_groups(organization_id);
create index if not exists group_memberships_org_user_idx on public.group_memberships(organization_id, user_id);
create index if not exists group_course_assignments_org_idx on public.group_course_assignments(organization_id, group_id);
create index if not exists training_announcements_org_active_idx on public.training_announcements(organization_id, is_active, created_at desc);
create index if not exists v1_sessions_org_user_idx on public.v1_quiz_sessions(organization_id, user_id);
create index if not exists v1_attempts_org_user_course_date_idx on public.v1_quiz_attempts(organization_id, user_id, course_id, completed_at desc);
create index if not exists v1_practical_org_user_course_idx on public.v1_practical_reviews(organization_id, user_id, course_id);
create index if not exists v1_certificates_org_user_idx on public.v1_certificates(organization_id, user_id);

-- Ownership can never be moved after insert, including by an UPDATE that tries
-- to exploit a later membership change.
create or replace function public.prevent_organization_ownership_change()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
begin
  if old.organization_id is distinct from new.organization_id then
    raise exception 'organization_id is immutable';
  end if;
  return new;
end;
$function$;

do $immutability_triggers$
declare
  v_table text;
begin
  foreach v_table in array array[
    'course_assignments', 'course_progress', 'training_attempts', 'certificates',
    'learner_groups', 'group_memberships', 'group_course_assignments',
    'training_announcements', 'v1_quiz_sessions', 'v1_quiz_attempts',
    'v1_practical_reviews', 'v1_certificates'
  ] loop
    execute format('drop trigger if exists immutable_organization_ownership on public.%I', v_table);
    execute format(
      'create trigger immutable_organization_ownership before update of organization_id on public.%I for each row execute function public.prevent_organization_ownership_change()',
      v_table
    );
  end loop;
end;
$immutability_triggers$;

-- Replace permissive legacy policies. Both learner and manager access are tied
-- to the selected organization; learners only see their own private records.
drop policy if exists organization_assignment_access on public.course_assignments;
create policy organization_assignment_access on public.course_assignments
  for select to authenticated using (
    organization_id = public.current_organization_id()
    and (user_id = auth.uid() or public.is_organization_admin(organization_id))
  );

drop policy if exists organization_progress_access on public.course_progress;
drop policy if exists organization_progress_write on public.course_progress;
drop policy if exists organization_progress_update on public.course_progress;
create policy organization_progress_access on public.course_progress
  for select to authenticated using (
    organization_id = public.current_organization_id()
    and (user_id = auth.uid() or public.is_organization_admin(organization_id))
  );

drop policy if exists organization_attempt_access on public.training_attempts;
drop policy if exists organization_attempt_write on public.training_attempts;
create policy organization_attempt_access on public.training_attempts
  for select to authenticated using (
    organization_id = public.current_organization_id()
    and (user_id = auth.uid() or public.is_organization_admin(organization_id))
  );

drop policy if exists organization_certificate_access on public.certificates;
create policy organization_certificate_access on public.certificates
  for select to authenticated using (
    organization_id = public.current_organization_id()
    and (user_id = auth.uid() or public.is_organization_admin(organization_id))
  );

create policy learner_groups_manager_access on public.learner_groups
  for select to authenticated using (
    organization_id = public.current_organization_id()
    and public.is_organization_admin(organization_id)
  );
create policy group_memberships_manager_access on public.group_memberships
  for select to authenticated using (
    organization_id = public.current_organization_id()
    and public.is_organization_admin(organization_id)
  );
create policy group_course_assignments_manager_access on public.group_course_assignments
  for select to authenticated using (
    organization_id = public.current_organization_id()
    and public.is_organization_admin(organization_id)
  );

drop policy if exists "Learners can read active announcements" on public.training_announcements;
create policy training_announcements_scoped_read on public.training_announcements
  for select to authenticated using (
    is_active = true
    and (organization_id is null or organization_id = public.current_organization_id())
  );

drop policy if exists v1_sessions_self on public.v1_quiz_sessions;
create policy v1_sessions_self on public.v1_quiz_sessions
  for all to authenticated
  using (organization_id = public.current_organization_id() and user_id = auth.uid())
  with check (organization_id = public.current_organization_id() and user_id = auth.uid());

drop policy if exists v1_attempts_read on public.v1_quiz_attempts;
create policy v1_attempts_read on public.v1_quiz_attempts
  for select to authenticated using (
    organization_id = public.current_organization_id()
    and (user_id = auth.uid() or public.is_organization_admin(organization_id))
  );

drop policy if exists v1_practical_read on public.v1_practical_reviews;
drop policy if exists v1_practical_insert on public.v1_practical_reviews;
drop policy if exists v1_practical_update on public.v1_practical_reviews;
create policy v1_practical_read on public.v1_practical_reviews
  for select to authenticated using (
    organization_id = public.current_organization_id()
    and (user_id = auth.uid() or public.is_organization_admin(organization_id))
  );
create policy v1_practical_insert on public.v1_practical_reviews
  for insert to authenticated with check (
    organization_id = public.current_organization_id()
    and reviewer_id = auth.uid()
    and public.is_organization_admin(organization_id)
    and exists (
      select 1 from public.v1_quiz_attempts attempt
      where attempt.organization_id = v1_practical_reviews.organization_id
        and attempt.user_id = v1_practical_reviews.user_id
        and attempt.course_id = v1_practical_reviews.course_id
        and attempt.passed
    )
  );
create policy v1_practical_update on public.v1_practical_reviews
  for update to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.is_organization_admin(organization_id)
  )
  with check (
    organization_id = public.current_organization_id()
    and reviewer_id = auth.uid()
    and public.is_organization_admin(organization_id)
    and exists (
      select 1 from public.v1_quiz_attempts attempt
      where attempt.organization_id = v1_practical_reviews.organization_id
        and attempt.user_id = v1_practical_reviews.user_id
        and attempt.course_id = v1_practical_reviews.course_id
        and attempt.passed
    )
  );

drop policy if exists v1_certificates_read on public.v1_certificates;
create policy v1_certificates_read on public.v1_certificates
  for select to authenticated using (
    organization_id = public.current_organization_id()
    and (user_id = auth.uid() or public.is_organization_admin(organization_id))
  );

-- Reduce browser writes to the two tables that intentionally use checked RLS.
revoke all on table public.course_assignments, public.course_progress,
  public.training_attempts, public.certificates, public.learner_groups,
  public.group_memberships, public.group_course_assignments from anon, authenticated;
grant select on table public.course_assignments, public.course_progress,
  public.training_attempts, public.certificates, public.learner_groups,
  public.group_memberships, public.group_course_assignments to authenticated;
revoke all on table public.training_announcements from anon, authenticated;
grant select on table public.training_announcements to authenticated;
revoke all on table public.v1_quiz_sessions, public.v1_quiz_attempts,
  public.v1_practical_reviews, public.v1_certificates from anon, authenticated;
grant select, insert, update, delete on table public.v1_quiz_sessions to authenticated;
grant select on table public.v1_quiz_attempts, public.v1_certificates to authenticated;
grant select, insert, update on table public.v1_practical_reviews to authenticated;

-- Organization-aware helpers and manager relationships.
create or replace function public.v1_is_manager_of(p_user_id uuid)
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $function$
  select public.is_current_organization_admin()
    and exists (
      select 1
      from public.organization_members membership
      where membership.organization_id = public.current_organization_id()
        and membership.user_id = p_user_id
    );
$function$;

create or replace function public.get_my_training_access()
returns table(role text, platform_admin boolean, organization_id uuid, organization_name text)
language sql stable security definer
set search_path = public, pg_temp
as $function$
  select coalesce(membership.role::text, 'learner'),
         public.is_platform_admin(),
         organization.id,
         organization.name
  from (select public.current_organization_id() id) context
  left join public.organizations organization on organization.id = context.id
  left join public.organization_members membership
    on membership.organization_id = organization.id
   and membership.user_id = auth.uid();
$function$;

create or replace function public.get_training_learners()
returns table(user_id uuid, email text)
language sql security definer
set search_path = public, auth, pg_temp
as $function$
  select auth_user.id, auth_user.email::text
  from public.organization_members membership
  join auth.users auth_user on auth_user.id = membership.user_id
  where public.is_current_organization_admin()
    and membership.organization_id = public.current_organization_id()
    and membership.role = 'learner'
  order by auth_user.email;
$function$;

create or replace function public.assign_training_course(
  p_user_id uuid,
  p_course_id text,
  p_due_date date default null::date
)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $function$
declare
  v_organization_id uuid := public.require_current_organization_id();
begin
  if not public.is_organization_admin(v_organization_id) then
    raise exception 'Organization administrator access required';
  end if;
  if not exists (
    select 1 from public.organization_members membership
    where membership.organization_id = v_organization_id
      and membership.user_id = p_user_id
  ) then
    raise exception 'Learner is not in your organization';
  end if;

  insert into public.course_assignments(
    organization_id, user_id, course_id, due_date, assigned_by, assigned_at, updated_at
  ) values (
    v_organization_id, p_user_id, p_course_id, p_due_date, auth.uid(), now(), now()
  )
  on conflict (organization_id, user_id, course_id) do update set
    due_date = excluded.due_date,
    assigned_by = excluded.assigned_by,
    updated_at = now();
end;
$function$;

create or replace function public.get_training_assignments()
returns table(user_id uuid, email text, course_id text, due_date date)
language sql security definer
set search_path = public, auth, pg_temp
as $function$
  select assignment.user_id, auth_user.email::text, assignment.course_id, assignment.due_date
  from public.course_assignments assignment
  join auth.users auth_user on auth_user.id = assignment.user_id
  where public.is_current_organization_admin()
    and assignment.organization_id = public.current_organization_id()
  order by assignment.due_date nulls last, auth_user.email;
$function$;

create or replace function public.get_training_report()
returns table(email text, course_id text, score smallint, completed_at timestamptz)
language sql security definer
set search_path = public, auth, pg_temp
as $function$
  select auth_user.email::text, progress.course_id, progress.score, progress.completed_at
  from public.course_progress progress
  join auth.users auth_user on auth_user.id = progress.user_id
  where public.is_current_organization_admin()
    and progress.organization_id = public.current_organization_id()
  order by progress.completed_at desc;
$function$;

create or replace function public.record_training_attempt(p_course_id text, p_score smallint)
returns public.training_attempts
language plpgsql security definer
set search_path = public, pg_temp
as $function$
declare
  v_organization_id uuid := public.require_current_organization_id();
  v_row public.training_attempts;
begin
  if p_score < 0 or p_score > 100 then raise exception 'Invalid score'; end if;
  insert into public.training_attempts(organization_id, user_id, course_id, score, passed)
  values (v_organization_id, auth.uid(), p_course_id, p_score, p_score >= 80)
  returning * into v_row;
  return v_row;
end;
$function$;

create or replace function public.save_training_completion(p_course_id text, p_score smallint)
returns public.course_progress
language plpgsql security definer
set search_path = public, pg_temp
as $function$
declare
  v_organization_id uuid := public.require_current_organization_id();
  v_row public.course_progress;
begin
  if p_score < 0 or p_score > 100 then raise exception 'Invalid score'; end if;
  insert into public.course_progress(
    organization_id, user_id, course_id, score, completed_at, updated_at
  ) values (
    v_organization_id, auth.uid(), p_course_id, p_score, now(), now()
  )
  on conflict (organization_id, user_id, course_id) do update set
    score = excluded.score,
    completed_at = excluded.completed_at,
    updated_at = excluded.updated_at
  returning * into v_row;
  return v_row;
end;
$function$;

create or replace function public.issue_training_certificate(p_course_id text)
returns table(certificate_number text, issued_at timestamptz)
language plpgsql security definer
set search_path = public, pg_temp
as $function$
declare
  v_organization_id uuid := public.require_current_organization_id();
begin
  if not exists (
    select 1 from public.course_progress progress
    where progress.organization_id = v_organization_id
      and progress.user_id = auth.uid()
      and progress.course_id = p_course_id
      and progress.score >= 80
  ) then
    raise exception 'A passed course is required';
  end if;

  insert into public.certificates(organization_id, user_id, course_id, certificate_number)
  values (
    v_organization_id, auth.uid(), p_course_id,
    'SUP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))
  )
  on conflict (organization_id, user_id, course_id) do nothing;

  return query
  select certificate.certificate_number, certificate.issued_at
  from public.certificates certificate
  where certificate.organization_id = v_organization_id
    and certificate.user_id = auth.uid()
    and certificate.course_id = p_course_id;
end;
$function$;

create or replace function public.get_my_training_certificate(p_course_id text)
returns table(certificate_number text, issued_at timestamptz)
language sql stable security definer
set search_path = public, pg_temp
as $function$
  select certificate.certificate_number, certificate.issued_at
  from public.certificates certificate
  where certificate.organization_id = public.require_current_organization_id()
    and certificate.user_id = auth.uid()
    and certificate.course_id = p_course_id;
$function$;

create or replace function public.get_training_groups()
returns table(id uuid, name text, description text, member_count bigint)
language sql stable security definer
set search_path = public, pg_temp
as $function$
  select learner_group.id, learner_group.name, learner_group.description, count(group_member.user_id)
  from public.learner_groups learner_group
  left join public.group_memberships group_member
    on group_member.group_id = learner_group.id
   and group_member.organization_id = learner_group.organization_id
  where public.is_current_organization_admin()
    and learner_group.organization_id = public.current_organization_id()
  group by learner_group.id, learner_group.name, learner_group.description
  order by learner_group.name;
$function$;

create or replace function public.create_training_group(p_name text, p_description text)
returns uuid
language plpgsql security definer
set search_path = public, pg_temp
as $function$
declare
  v_organization_id uuid := public.require_current_organization_id();
  v_id uuid;
begin
  if not public.is_organization_admin(v_organization_id) then
    raise exception 'Organization administrator access required';
  end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'Group name is required'; end if;
  insert into public.learner_groups(organization_id, name, description)
  values (v_organization_id, trim(p_name), nullif(trim(p_description), ''))
  returning id into v_id;
  return v_id;
end;
$function$;

create or replace function public.get_training_group_members(p_group_id uuid)
returns table(user_id uuid, email text)
language sql stable security definer
set search_path = public, auth, pg_temp
as $function$
  select group_member.user_id, auth_user.email::text
  from public.group_memberships group_member
  join auth.users auth_user on auth_user.id = group_member.user_id
  where public.is_current_organization_admin()
    and group_member.organization_id = public.current_organization_id()
    and group_member.group_id = p_group_id
  order by auth_user.email;
$function$;

create or replace function public.add_training_group_member(p_group_id uuid, p_user_id uuid)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $function$
declare
  v_organization_id uuid := public.require_current_organization_id();
begin
  if not public.is_organization_admin(v_organization_id) then
    raise exception 'Organization administrator access required';
  end if;
  if not exists (
    select 1 from public.learner_groups learner_group
    where learner_group.id = p_group_id
      and learner_group.organization_id = v_organization_id
  ) then raise exception 'Group not found'; end if;
  if not exists (
    select 1 from public.organization_members membership
    where membership.organization_id = v_organization_id
      and membership.user_id = p_user_id
  ) then raise exception 'Learner is not in your organization'; end if;

  insert into public.group_memberships(organization_id, group_id, user_id)
  values (v_organization_id, p_group_id, p_user_id)
  on conflict (organization_id, group_id, user_id) do nothing;
end;
$function$;

create or replace function public.assign_training_group_course(
  p_group_id uuid,
  p_course_id text,
  p_due_date date
)
returns integer
language plpgsql security definer
set search_path = public, pg_temp
as $function$
declare
  v_organization_id uuid := public.require_current_organization_id();
  v_count integer;
begin
  if not public.is_organization_admin(v_organization_id) then
    raise exception 'Organization administrator access required';
  end if;
  if not exists (
    select 1 from public.learner_groups learner_group
    where learner_group.id = p_group_id
      and learner_group.organization_id = v_organization_id
  ) then raise exception 'Group not found'; end if;

  insert into public.group_course_assignments(organization_id, group_id, course_id, due_date)
  values (v_organization_id, p_group_id, p_course_id, p_due_date)
  on conflict (organization_id, group_id, course_id) do update set
    due_date = excluded.due_date,
    assigned_at = now();

  insert into public.course_assignments(organization_id, user_id, course_id, due_date)
  select v_organization_id, group_member.user_id, p_course_id, p_due_date
  from public.group_memberships group_member
  join public.organization_members membership
    on membership.user_id = group_member.user_id
   and membership.organization_id = v_organization_id
  where group_member.organization_id = v_organization_id
    and group_member.group_id = p_group_id
  on conflict (organization_id, user_id, course_id) do update set
    due_date = excluded.due_date,
    updated_at = now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

-- V1 server-side scoring and certificates always derive organization ownership.
create or replace function public.submit_v1_attempt(
  p_attempt_id uuid,
  p_course_id text,
  p_question_ids text[],
  p_answers jsonb
)
returns public.v1_quiz_attempts
language plpgsql security definer
set search_path = public, pg_temp
as $function$
declare
  v_user_id uuid := auth.uid();
  v_organization_id uuid := public.require_current_organization_id();
  v_count integer;
  v_correct integer;
  v_score integer;
  v_row public.v1_quiz_attempts;
begin
  select attempt.* into v_row
  from public.v1_quiz_attempts attempt
  where attempt.id = p_attempt_id;
  if found then
    if v_row.user_id <> v_user_id or v_row.organization_id <> v_organization_id then
      raise exception 'Attempt ID belongs to another user or organization';
    end if;
    return v_row;
  end if;

  select setting.question_count into v_count
  from public.v1_course_settings setting
  where setting.course_id = p_course_id;
  if v_count is null or p_question_ids is null
     or cardinality(p_question_ids) <> v_count or p_answers is null then
    raise exception 'Invalid attempt size';
  end if;
  if exists (
    select 1 from unnest(p_question_ids) selected(question_id)
    group by selected.question_id having count(*) > 1
  ) then raise exception 'Duplicate question'; end if;
  if (
    select count(*)
    from unnest(p_question_ids) selected(question_id)
    join public.v1_question_keys question_key
      on question_key.id = selected.question_id
     and question_key.course_id = p_course_id
  ) <> v_count then raise exception 'Unknown question'; end if;

  select count(*) into v_correct
  from unnest(p_question_ids) selected(question_id)
  join public.v1_question_keys question_key on question_key.id = selected.question_id
  where p_answers ? selected.question_id
    and (p_answers ->> selected.question_id) ~ '^[0-3]$'
    and (p_answers ->> selected.question_id)::integer = question_key.correct_answer;
  v_score := round(100.0 * v_correct / v_count)::integer;

  insert into public.v1_quiz_attempts(
    id, organization_id, user_id, course_id, question_ids, answers, score, passed
  ) values (
    p_attempt_id, v_organization_id, v_user_id, p_course_id, p_question_ids,
    p_answers, v_score,
    v_score >= (select setting.pass_score from public.v1_course_settings setting where setting.course_id = p_course_id)
  ) returning * into v_row;
  return v_row;
end;
$function$;

create or replace function public.issue_v1_certificate(p_course_id text)
returns public.v1_certificates
language plpgsql security definer
set search_path = public, pg_temp
as $function$
declare
  v_user_id uuid := auth.uid();
  v_organization_id uuid := public.require_current_organization_id();
  v_requirement text;
  v_row public.v1_certificates;
begin
  select certificate.* into v_row
  from public.v1_certificates certificate
  where certificate.organization_id = v_organization_id
    and certificate.user_id = v_user_id
    and certificate.course_id = p_course_id;
  if found then return v_row; end if;

  select setting.certificate_requirement into v_requirement
  from public.v1_course_settings setting where setting.course_id = p_course_id;
  if v_requirement is null then raise exception 'Unknown course'; end if;
  if not exists (
    select 1 from public.v1_quiz_attempts attempt
    where attempt.organization_id = v_organization_id
      and attempt.user_id = v_user_id
      and attempt.course_id = p_course_id
      and attempt.passed
  ) then raise exception 'Quiz not passed'; end if;
  if v_requirement = 'quiz_and_practical' and exists (
    select 1 from public.v1_practical_items item
    where item.course_id = p_course_id
      and not exists (
        select 1 from public.v1_practical_reviews review
        where review.organization_id = v_organization_id
          and review.user_id = v_user_id
          and review.course_id = item.course_id
          and review.item_id = item.item_id
          and review.status = 'independent'
      )
  ) then raise exception 'Practical check not complete'; end if;

  insert into public.v1_certificates(organization_id, user_id, course_id, certificate_number)
  values (
    v_organization_id, v_user_id, p_course_id,
    'SU-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16))
  )
  on conflict (organization_id, user_id, course_id) do nothing;

  select certificate.* into v_row
  from public.v1_certificates certificate
  where certificate.organization_id = v_organization_id
    and certificate.user_id = v_user_id
    and certificate.course_id = p_course_id;
  return v_row;
end;
$function$;

create or replace function public.v1_issue_certificate_after_practical()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $function$
begin
  if new.status <> 'independent' then return new; end if;
  if not exists (
    select 1 from public.v1_course_settings setting
    where setting.course_id = new.course_id
      and setting.certificate_requirement = 'quiz_and_practical'
  ) then return new; end if;
  if not exists (
    select 1 from public.v1_quiz_attempts attempt
    where attempt.organization_id = new.organization_id
      and attempt.user_id = new.user_id
      and attempt.course_id = new.course_id
      and attempt.passed
  ) then return new; end if;
  if exists (
    select 1 from public.v1_practical_items item
    where item.course_id = new.course_id
      and not exists (
        select 1 from public.v1_practical_reviews review
        where review.organization_id = new.organization_id
          and review.user_id = new.user_id
          and review.course_id = item.course_id
          and review.item_id = item.item_id
          and review.status = 'independent'
      )
  ) then return new; end if;

  insert into public.v1_certificates(organization_id, user_id, course_id, certificate_number)
  values (
    new.organization_id, new.user_id, new.course_id,
    'SU-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16))
  )
  on conflict (organization_id, user_id, course_id) do nothing;
  return new;
end;
$function$;

-- Explicitly expose only the browser-callable functions. Trigger helpers and
-- ownership guards keep PUBLIC/anon execute revoked.
revoke all on function public.require_current_organization_id() from public, anon;
revoke all on function public.current_organization_id() from public, anon;
revoke all on function public.set_current_organization(uuid) from public, anon;
revoke all on function public.get_my_organization_context() from public, anon;
revoke all on function public.is_organization_admin(uuid) from public, anon;
revoke all on function public.is_current_organization_admin() from public, anon;
revoke all on function public.is_organization_member(uuid) from public, anon;
revoke all on function public.v1_is_manager_of(uuid) from public, anon;
revoke all on function public.get_my_training_access() from public, anon;
revoke all on function public.get_training_learners() from public, anon;
revoke all on function public.assign_training_course(uuid,text,date) from public, anon;
revoke all on function public.get_training_assignments() from public, anon;
revoke all on function public.get_training_report() from public, anon;
revoke all on function public.issue_training_certificate(text) from public, anon;
revoke all on function public.get_my_training_certificate(text) from public, anon;
revoke all on function public.get_training_groups() from public, anon;
revoke all on function public.create_training_group(text,text) from public, anon;
revoke all on function public.get_training_group_members(uuid) from public, anon;
revoke all on function public.add_training_group_member(uuid,uuid) from public, anon;
revoke all on function public.assign_training_group_course(uuid,text,date) from public, anon;
revoke all on function public.record_training_attempt(text,smallint) from public, anon;
revoke all on function public.save_training_completion(text,smallint) from public, anon;
revoke all on function public.prevent_organization_ownership_change() from public, anon, authenticated;
revoke all on function public.v1_issue_certificate_after_practical() from public, anon, authenticated;
revoke all on function public.submit_v1_attempt(uuid,text,text[],jsonb) from public, anon;
revoke all on function public.issue_v1_certificate(text) from public, anon;

grant execute on function public.current_organization_id() to authenticated;
grant execute on function public.require_current_organization_id() to authenticated;
grant execute on function public.set_current_organization(uuid) to authenticated;
grant execute on function public.get_my_organization_context() to authenticated;
grant execute on function public.is_organization_admin(uuid) to authenticated;
grant execute on function public.is_current_organization_admin() to authenticated;
grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.v1_is_manager_of(uuid) to authenticated;
grant execute on function public.get_my_training_access() to authenticated;
grant execute on function public.get_training_learners() to authenticated;
grant execute on function public.assign_training_course(uuid,text,date) to authenticated;
grant execute on function public.get_training_assignments() to authenticated;
grant execute on function public.get_training_report() to authenticated;
grant execute on function public.issue_training_certificate(text) to authenticated;
grant execute on function public.get_my_training_certificate(text) to authenticated;
grant execute on function public.get_training_groups() to authenticated;
grant execute on function public.create_training_group(text,text) to authenticated;
grant execute on function public.get_training_group_members(uuid) to authenticated;
grant execute on function public.add_training_group_member(uuid,uuid) to authenticated;
grant execute on function public.assign_training_group_course(uuid,text,date) to authenticated;
grant execute on function public.record_training_attempt(text,smallint) to authenticated;
grant execute on function public.save_training_completion(text,smallint) to authenticated;
grant execute on function public.submit_v1_attempt(uuid,text,text[],jsonb) to authenticated;
grant execute on function public.issue_v1_certificate(text) to authenticated;

commit;
