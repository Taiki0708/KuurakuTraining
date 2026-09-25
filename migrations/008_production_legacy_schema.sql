-- Production legacy schema baseline captured from the ServeUp production
-- PostgreSQL catalogs on 2026-09-24. This migration is intentionally
-- non-destructive and preserves the legacy model exactly as inspected.
--
-- Do not use this migration to redesign tenancy. In particular, nullable
-- organization_id columns and the four-course CHECK constraints are retained
-- because they describe the current production database.
begin;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'trial'::text
    check (plan = any (array['trial'::text, 'starter'::text, 'standard'::text, 'pro'::text])),
  status text not null default 'active'::text
    check (status = any (array['active'::text, 'paused'::text, 'cancelled'::text])),
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'admin'::text
    check (role = any (array['admin'::text, 'learner'::text])),
  primary key (organization_id, user_id)
);

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'learner'::text
    check (role = any (array['learner'::text, 'admin'::text])),
  created_at timestamptz not null default now()
);

-- These helpers must exist before tables that use current_organization_id()
-- as a column default are created.
create or replace function public.current_organization_id()
returns uuid
language sql stable security definer
set search_path = public
as $function$
  select organization_id
  from public.organization_members
  where user_id = auth.uid()
  order by organization_id
  limit 1;
$function$;

create or replace function public.is_organization_member(p_organization_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $function$
  select exists (
    select 1
    from public.organization_members
    where organization_id = p_organization_id
      and user_id = auth.uid()
  );
$function$;

create or replace function public.is_current_organization_admin()
returns boolean
language sql stable security definer
set search_path = public
as $function$
  select exists(
    select 1
    from public.organization_members m
    where m.user_id = auth.uid()
      and m.organization_id = public.current_organization_id()
      and m.role = 'admin'
  );
$function$;

create or replace function public.is_platform_admin()
returns boolean
language sql stable security definer
set search_path = public
as $function$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$function$;

create or replace function public.is_training_admin()
returns boolean
language sql stable security definer
set search_path = public
as $function$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$function$;

create table if not exists public.courses (
  id text primary key,
  sort_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.course_translations (
  course_id text not null references public.courses(id) on delete cascade,
  locale text not null check (locale = any (array['en'::text, 'ja'::text, 'hi'::text])),
  title text not null,
  description text not null,
  lesson_content text,
  primary key (course_id, locale)
);

create table if not exists public.course_questions (
  id uuid primary key default gen_random_uuid(),
  course_id text not null references public.courses(id) on delete cascade,
  locale text not null check (locale = any (array['en'::text, 'ja'::text, 'hi'::text])),
  question_text text not null,
  answers jsonb not null,
  correct_answer smallint not null check (correct_answer >= 0 and correct_answer <= 3),
  explanation text not null,
  sort_order integer not null,
  unique (course_id, locale, sort_order)
);

create table if not exists public.course_assignments (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null check (course_id = any (array[
    'customer-service'::text,
    'food-safety'::text,
    'japanese-hospitality'::text,
    'restaurant-basics'::text
  ])),
  due_date date,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  organization_id uuid default public.current_organization_id()
    references public.organizations(id),
  primary key (user_id, course_id)
);

create table if not exists public.course_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null check (course_id = any (array[
    'customer-service'::text,
    'food-safety'::text,
    'japanese-hospitality'::text,
    'restaurant-basics'::text
  ])),
  score smallint not null check (score >= 0 and score <= 100),
  completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  organization_id uuid default public.current_organization_id()
    references public.organizations(id),
  primary key (user_id, course_id)
);

create table if not exists public.training_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,
  score smallint not null check (score >= 0 and score <= 100),
  passed boolean not null,
  attempted_at timestamptz not null default now(),
  organization_id uuid default public.current_organization_id()
    references public.organizations(id)
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,
  certificate_number text not null unique,
  issued_at timestamptz not null default now(),
  organization_id uuid default public.current_organization_id()
    references public.organizations(id),
  unique (user_id, course_id)
);

create table if not exists public.learner_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  organization_id uuid default public.current_organization_id()
    references public.organizations(id)
);

create table if not exists public.group_memberships (
  group_id uuid not null references public.learner_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (group_id, user_id)
);

create table if not exists public.group_course_assignments (
  group_id uuid not null references public.learner_groups(id) on delete cascade,
  course_id text not null,
  due_date date,
  assigned_at timestamptz not null default now(),
  primary key (group_id, course_id)
);

create table if not exists public.training_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.user_roles enable row level security;
alter table public.courses enable row level security;
alter table public.course_translations enable row level security;
alter table public.course_questions enable row level security;
alter table public.course_assignments enable row level security;
alter table public.course_progress enable row level security;
alter table public.training_attempts enable row level security;
alter table public.certificates enable row level security;
alter table public.learner_groups enable row level security;
alter table public.group_memberships enable row level security;
alter table public.group_course_assignments enable row level security;
alter table public.training_announcements enable row level security;

-- Tables without policies are intentionally accessible only through the
-- SECURITY DEFINER RPC layer in the captured production architecture.
do $policies$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='courses' and policyname='Learners can read published courses') then
    create policy "Learners can read published courses" on public.courses
      for select to authenticated using (is_active = true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='course_translations' and policyname='Learners can read course translations') then
    create policy "Learners can read course translations" on public.course_translations
      for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='course_questions' and policyname='Learners can read course questions') then
    create policy "Learners can read course questions" on public.course_questions
      for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='course_assignments' and policyname='organization_assignment_access') then
    create policy organization_assignment_access on public.course_assignments
      for select to authenticated
      using (user_id = auth.uid() and public.is_organization_member(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='course_progress' and policyname='organization_progress_access') then
    create policy organization_progress_access on public.course_progress
      for select to authenticated
      using (public.is_organization_member(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='course_progress' and policyname='organization_progress_write') then
    create policy organization_progress_write on public.course_progress
      for insert to authenticated
      with check (user_id = auth.uid() and public.is_organization_member(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='course_progress' and policyname='organization_progress_update') then
    create policy organization_progress_update on public.course_progress
      for update to authenticated
      using (user_id = auth.uid() and public.is_organization_member(organization_id))
      with check (user_id = auth.uid() and public.is_organization_member(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='training_attempts' and policyname='organization_attempt_access') then
    create policy organization_attempt_access on public.training_attempts
      for select to authenticated
      using (public.is_organization_member(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='training_attempts' and policyname='organization_attempt_write') then
    create policy organization_attempt_write on public.training_attempts
      for insert to authenticated
      with check (user_id = auth.uid() and public.is_organization_member(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='certificates' and policyname='organization_certificate_access') then
    create policy organization_certificate_access on public.certificates
      for select to authenticated
      using (user_id = auth.uid() and public.is_organization_member(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='training_announcements' and policyname='Learners can read active announcements') then
    create policy "Learners can read active announcements" on public.training_announcements
      for select to authenticated using (is_active = true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_roles' and policyname='Users can read their own role') then
    create policy "Users can read their own role" on public.user_roles
      for select to authenticated using (auth.uid() = user_id);
  end if;
end;
$policies$;

-- Production currently has the standard Supabase table grants. RLS remains
-- the authorization boundary for browser roles.
grant all on table
  public.organizations,
  public.organization_members,
  public.user_roles,
  public.courses,
  public.course_translations,
  public.course_questions,
  public.course_assignments,
  public.course_progress,
  public.training_attempts,
  public.certificates,
  public.learner_groups,
  public.group_memberships,
  public.group_course_assignments,
  public.training_announcements
to anon, authenticated, service_role;

commit;
