-- Production legacy RPC baseline captured from pg_get_functiondef() on
-- 2026-09-24. Function bodies intentionally match production; known issues
-- are documented in migrations/PRODUCTION-BASELINE.md and are not corrected
-- in Task 1.
begin;

create or replace function public.get_my_training_access()
returns table(role text, platform_admin boolean, organization_id uuid, organization_name text)
language sql stable security definer
set search_path = public
as $function$
  select coalesce(m.role::text,'learner'), public.is_platform_admin(), o.id, o.name
  from (select public.current_organization_id() id) x
  left join public.organizations o on o.id = x.id
  left join public.organization_members m
    on m.organization_id = o.id and m.user_id = auth.uid();
$function$;

create or replace function public.get_training_learners()
returns table(user_id uuid, email text)
language sql security definer
set search_path = public, auth
as $function$
  select u.id, u.email::text
  from public.organization_members m
  join auth.users u on u.id = m.user_id
  where public.is_current_organization_admin()
    and m.organization_id = public.current_organization_id()
  order by u.email;
$function$;

create or replace function public.assign_training_course(
  p_user_id uuid,
  p_course_id text,
  p_due_date date default null::date
)
returns void
language plpgsql security definer
set search_path = public
as $function$
declare
  v_org uuid := public.current_organization_id();
begin
  if not public.is_current_organization_admin() then
    raise exception 'Organization administrator access required';
  end if;
  if not exists(
    select 1 from public.organization_members
    where organization_id = v_org and user_id = p_user_id
  ) then
    raise exception 'Learner is not in your organization';
  end if;
  insert into public.course_assignments(
    user_id, course_id, due_date, assigned_by, assigned_at, updated_at, organization_id
  ) values (
    p_user_id, p_course_id, p_due_date, auth.uid(), now(), now(), v_org
  )
  on conflict(user_id, course_id) do update set
    due_date = excluded.due_date,
    assigned_by = excluded.assigned_by,
    updated_at = now(),
    organization_id = excluded.organization_id;
end;
$function$;

create or replace function public.get_training_assignments()
returns table(user_id uuid, email text, course_id text, due_date date)
language sql security definer
set search_path = public, auth
as $function$
  select a.user_id, u.email::text, a.course_id, a.due_date
  from public.course_assignments a
  join auth.users u on u.id = a.user_id
  where public.is_current_organization_admin()
    and a.organization_id = public.current_organization_id()
  order by a.due_date nulls last, u.email;
$function$;

create or replace function public.get_training_report()
returns table(email text, course_id text, score smallint, completed_at timestamptz)
language sql security definer
set search_path = public, auth
as $function$
  select u.email::text, p.course_id, p.score, p.completed_at
  from public.course_progress p
  join auth.users u on u.id = p.user_id
  where public.is_current_organization_admin()
    and p.organization_id = public.current_organization_id()
  order by p.completed_at desc;
$function$;

create or replace function public.issue_training_certificate(p_course_id text)
returns table(certificate_number text, issued_at timestamptz)
language plpgsql security definer
set search_path = public
as $function$
begin
  if auth.uid() is null then
    raise exception 'Sign-in required';
  end if;
  if not exists (
    select 1 from public.course_progress
    where user_id = auth.uid() and course_id = p_course_id and score >= 80
  ) then
    raise exception 'A passed course is required';
  end if;

  insert into public.certificates (user_id, course_id, certificate_number)
  values (
    auth.uid(),
    p_course_id,
    'SUP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))
  )
  on conflict (user_id, course_id) do nothing;

  return query
  select c.certificate_number, c.issued_at
  from public.certificates c
  where c.user_id = auth.uid() and c.course_id = p_course_id;
end;
$function$;

create or replace function public.get_my_training_certificate(p_course_id text)
returns table(certificate_number text, issued_at timestamptz)
language sql stable security definer
set search_path = public
as $function$
  select c.certificate_number, c.issued_at
  from public.certificates c
  where c.user_id = auth.uid() and c.course_id = p_course_id;
$function$;

create or replace function public.get_course_translation(p_course_id text, p_locale text)
returns table(title text, description text)
language sql stable security definer
set search_path = public
as $function$
  select t.title, t.description
  from public.course_translations t
  join public.courses c on c.id = t.course_id
  where c.is_active
    and t.course_id = p_course_id
    and t.locale = p_locale;
$function$;

create or replace function public.get_admin_courses()
returns table(id text, sort_order integer, is_active boolean, title text, description text)
language sql stable security definer
set search_path = public
as $function$
  select c.id, c.sort_order, c.is_active, t.title, t.description
  from public.courses c
  left join public.course_translations t
    on t.course_id = c.id and t.locale = 'en'
  where public.is_training_admin()
  order by c.sort_order, c.id;
$function$;

create or replace function public.save_training_course(
  p_id text,
  p_sort_order integer,
  p_is_active boolean,
  p_title text,
  p_description text
)
returns void
language plpgsql security definer
set search_path = public
as $function$
begin
  if not public.is_training_admin() then
    raise exception 'Administrator access required';
  end if;
  if p_id not in (
    'customer-service', 'food-safety', 'japanese-hospitality', 'restaurant-basics'
  ) then
    raise exception 'Unknown course';
  end if;
  if coalesce(trim(p_title), '') = '' or coalesce(trim(p_description), '') = '' then
    raise exception 'Title and description are required';
  end if;

  update public.courses
  set sort_order = greatest(1, p_sort_order), is_active = p_is_active
  where id = p_id;

  insert into public.course_translations(course_id, locale, title, description)
  values (p_id, 'en', trim(p_title), trim(p_description))
  on conflict (course_id, locale) do update set
    title = excluded.title,
    description = excluded.description;
end;
$function$;

create or replace function public.save_training_course_translation(
  p_course_id text,
  p_locale text,
  p_title text,
  p_description text
)
returns void
language plpgsql security definer
set search_path = public
as $function$
begin
  if not public.is_training_admin() then
    raise exception 'Administrator access required';
  end if;
  if p_locale not in ('en', 'ja', 'hi') then
    raise exception 'Unsupported locale';
  end if;
  insert into public.course_translations(course_id, locale, title, description)
  values (p_course_id, p_locale, trim(p_title), trim(p_description))
  on conflict(course_id, locale) do update set
    title = excluded.title,
    description = excluded.description;
end;
$function$;

create or replace function public.get_admin_course_questions(p_course_id text)
returns table(
  id uuid,
  course_id text,
  locale text,
  question_text text,
  answers jsonb,
  correct_answer smallint,
  explanation text,
  sort_order integer
)
language sql stable security definer
set search_path = public
as $function$
  select q.id, q.course_id, q.locale, q.question_text, q.answers,
         q.correct_answer, q.explanation, q.sort_order
  from public.course_questions q
  where public.is_training_admin()
    and q.course_id = p_course_id
    and q.locale = 'en'
  order by q.sort_order, q.id;
$function$;

create or replace function public.save_training_question(
  p_id uuid,
  p_course_id text,
  p_question_text text,
  p_answers jsonb,
  p_correct_answer smallint,
  p_explanation text,
  p_sort_order integer
)
returns uuid
language plpgsql security definer
set search_path = public
as $function$
declare
  v_id uuid;
begin
  if not public.is_training_admin() then
    raise exception 'Administrator access required';
  end if;
  if not exists (select 1 from public.courses where id = p_course_id) then
    raise exception 'Unknown course';
  end if;
  if coalesce(trim(p_question_text), '') = ''
     or jsonb_typeof(p_answers) <> 'array'
     or jsonb_array_length(p_answers) < 2
     or p_correct_answer < 0
     or p_correct_answer >= jsonb_array_length(p_answers) then
    raise exception 'Invalid question data';
  end if;

  if p_id is null then
    insert into public.course_questions(
      course_id, locale, question_text, answers, correct_answer, explanation, sort_order
    ) values (
      p_course_id, 'en', trim(p_question_text), p_answers, p_correct_answer,
      nullif(trim(p_explanation), ''), greatest(1, p_sort_order)
    ) returning id into v_id;
  else
    update public.course_questions
    set question_text = trim(p_question_text),
        answers = p_answers,
        correct_answer = p_correct_answer,
        explanation = nullif(trim(p_explanation), ''),
        sort_order = greatest(1, p_sort_order)
    where id = p_id and course_id = p_course_id and locale = 'en'
    returning id into v_id;
    if v_id is null then
      raise exception 'Question not found';
    end if;
  end if;
  return v_id;
end;
$function$;

create or replace function public.save_training_question_locale(
  p_id uuid,
  p_course_id text,
  p_locale text,
  p_question_text text,
  p_answers jsonb,
  p_correct_answer smallint,
  p_explanation text,
  p_sort_order integer
)
returns uuid
language plpgsql security definer
set search_path = public
as $function$
declare
  v_id uuid;
begin
  if not public.is_training_admin() then
    raise exception 'Administrator access required';
  end if;
  if p_locale not in ('en','ja','hi') then
    raise exception 'Unsupported locale';
  end if;
  if p_id is null then
    insert into public.course_questions(
      course_id, locale, question_text, answers, correct_answer, explanation, sort_order
    ) values (
      p_course_id, p_locale, trim(p_question_text), p_answers, p_correct_answer,
      nullif(trim(p_explanation), ''), p_sort_order
    ) returning id into v_id;
  else
    update public.course_questions
    set question_text = trim(p_question_text),
        answers = p_answers,
        correct_answer = p_correct_answer,
        explanation = nullif(trim(p_explanation), ''),
        sort_order = p_sort_order
    where id = p_id and course_id = p_course_id and locale = p_locale
    returning id into v_id;
  end if;
  return v_id;
end;
$function$;

create or replace function public.delete_training_question(p_id uuid, p_course_id text)
returns void
language plpgsql security definer
set search_path = public
as $function$
begin
  if not public.is_training_admin() then
    raise exception 'Administrator access required';
  end if;
  delete from public.course_questions
  where id = p_id and course_id = p_course_id and locale = 'en';
end;
$function$;

create or replace function public.get_training_groups()
returns table(id uuid, name text, description text, member_count bigint)
language sql stable security definer
set search_path = public
as $function$
  select g.id, g.name, g.description, count(m.user_id)
  from public.learner_groups g
  left join public.group_memberships m on m.group_id = g.id
  where public.is_current_organization_admin()
    and g.organization_id = public.current_organization_id()
  group by g.id, g.name, g.description
  order by g.name;
$function$;

create or replace function public.create_training_group(p_name text, p_description text)
returns uuid
language plpgsql security definer
set search_path = public
as $function$
declare
  v_id uuid;
begin
  if not public.is_current_organization_admin() then
    raise exception 'Organization administrator access required';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Group name is required';
  end if;
  insert into public.learner_groups(name, description, organization_id)
  values (trim(p_name), nullif(trim(p_description), ''), public.current_organization_id())
  returning id into v_id;
  return v_id;
end;
$function$;

create or replace function public.get_training_group_members(p_group_id uuid)
returns table(user_id uuid, email text)
language sql stable security definer
set search_path = public, auth
as $function$
  select m.user_id, u.email::text
  from public.group_memberships m
  join auth.users u on u.id = m.user_id
  join public.learner_groups g on g.id = m.group_id
  where public.is_current_organization_admin()
    and m.group_id = p_group_id
    and g.organization_id = public.current_organization_id()
  order by u.email;
$function$;

create or replace function public.add_training_group_member(p_group_id uuid, p_user_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $function$
declare
  v_org uuid := public.current_organization_id();
begin
  if not public.is_current_organization_admin() then
    raise exception 'Organization administrator access required';
  end if;
  if not exists(
    select 1 from public.learner_groups
    where id = p_group_id and organization_id = v_org
  ) then
    raise exception 'Group not found';
  end if;
  if not exists(
    select 1 from public.organization_members
    where organization_id = v_org and user_id = p_user_id
  ) then
    raise exception 'Learner is not in your organization';
  end if;
  insert into public.group_memberships(group_id, user_id)
  values (p_group_id, p_user_id)
  on conflict(group_id, user_id) do nothing;
end;
$function$;

create or replace function public.assign_training_group_course(
  p_group_id uuid,
  p_course_id text,
  p_due_date date
)
returns integer
language plpgsql security definer
set search_path = public
as $function$
declare
  v_count integer;
  v_org uuid := public.current_organization_id();
begin
  if not public.is_current_organization_admin() then
    raise exception 'Organization administrator access required';
  end if;
  if not exists(
    select 1 from public.learner_groups
    where id = p_group_id and organization_id = v_org
  ) then
    raise exception 'Group not found';
  end if;
  insert into public.group_course_assignments(group_id, course_id, due_date)
  values (p_group_id, p_course_id, p_due_date)
  on conflict(group_id, course_id) do update set
    due_date = excluded.due_date,
    assigned_at = now();

  insert into public.course_assignments(user_id, course_id, due_date, organization_id)
  select m.user_id, p_course_id, p_due_date, v_org
  from public.group_memberships m
  join public.organization_members om
    on om.user_id = m.user_id and om.organization_id = v_org
  where m.group_id = p_group_id
  on conflict(user_id, course_id) do update set
    due_date = excluded.due_date,
    organization_id = excluded.organization_id;
  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

create or replace function public.get_training_announcements()
returns setof public.training_announcements
language sql stable security definer
set search_path = public
as $function$
  select *
  from public.training_announcements
  where public.is_training_admin()
  order by created_at desc;
$function$;

create or replace function public.save_training_announcement(
  p_id uuid,
  p_title text,
  p_message text,
  p_is_active boolean
)
returns uuid
language plpgsql security definer
set search_path = public
as $function$
declare
  v uuid;
begin
  if not public.is_training_admin() then
    raise exception 'Administrator access required';
  end if;
  if p_id is null then
    insert into public.training_announcements(title, message, is_active)
    values (trim(p_title), trim(p_message), p_is_active)
    returning id into v;
  else
    update public.training_announcements
    set title = trim(p_title), message = trim(p_message), is_active = p_is_active
    where id = p_id
    returning id into v;
  end if;
  return v;
end;
$function$;

create or replace function public.get_platform_organizations()
returns table(
  id uuid,
  name text,
  plan text,
  status text,
  created_at timestamptz,
  administrator_count bigint,
  learner_count bigint
)
language plpgsql stable security definer
set search_path = public
as $function$
begin
  if not public.is_platform_admin() then
    raise exception 'Platform administrator access required';
  end if;
  return query
  select o.id, o.name, o.plan::text, o.status::text, o.created_at,
    count(*) filter (where m.role = 'admin')::bigint,
    count(*) filter (where m.role = 'learner')::bigint
  from public.organizations o
  left join public.organization_members m on m.organization_id = o.id
  group by o.id, o.name, o.plan, o.status, o.created_at
  order by o.created_at desc;
end;
$function$;

create or replace function public.create_platform_organization(
  p_name text,
  p_plan text default 'trial'::text
)
returns uuid
language plpgsql security definer
set search_path = public
as $function$
declare
  new_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'Platform administrator access required';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Organization name is required';
  end if;
  if p_plan not in ('trial', 'starter', 'standard', 'pro') then
    raise exception 'Invalid plan';
  end if;
  insert into public.organizations(name, plan)
  values (trim(p_name), p_plan::public.organization_plan)
  returning id into new_id;
  insert into public.organization_members(organization_id, user_id, role)
  values (new_id, auth.uid(), 'admin');
  return new_id;
end;
$function$;

create or replace function public.update_platform_organization(
  p_id uuid,
  p_name text,
  p_plan text,
  p_status text
)
returns void
language plpgsql security definer
set search_path = public
as $function$
begin
  if not public.is_platform_admin() then
    raise exception 'Platform administrator access required';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Organization name is required';
  end if;
  if p_plan not in ('trial', 'starter', 'standard', 'pro') then
    raise exception 'Invalid plan';
  end if;
  if p_status not in ('active', 'paused', 'cancelled') then
    raise exception 'Invalid status';
  end if;
  update public.organizations
  set name = trim(p_name),
      plan = p_plan::public.organization_plan,
      status = p_status::public.organization_status
  where id = p_id;
  if not found then
    raise exception 'Organization not found';
  end if;
end;
$function$;

create or replace function public.get_platform_organization_members(p_organization_id uuid)
returns table(user_id uuid, email text, role text)
language plpgsql stable security definer
set search_path = public, auth
as $function$
begin
  if not public.is_platform_admin() then
    raise exception 'Platform administrator access required';
  end if;
  return query
  select m.user_id, u.email::text, m.role::text
  from public.organization_members m
  join auth.users u on u.id = m.user_id
  where m.organization_id = p_organization_id
  order by m.role, u.email;
end;
$function$;

create or replace function public.add_platform_organization_member(
  p_organization_id uuid,
  p_email text,
  p_role text default 'learner'::text
)
returns void
language plpgsql security definer
set search_path = public, auth
as $function$
declare
  target_user_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'Platform administrator access required';
  end if;
  if p_role not in ('admin', 'learner') then
    raise exception 'Invalid member role';
  end if;
  select id into target_user_id
  from auth.users
  where lower(email) = lower(trim(p_email))
  limit 1;
  if target_user_id is null then
    raise exception 'No registered user found for this email. Ask them to create an account first.';
  end if;
  insert into public.organization_members(organization_id, user_id, role)
  values (p_organization_id, target_user_id, p_role::public.organization_member_role)
  on conflict (organization_id, user_id)
  do update set role = excluded.role;
end;
$function$;

commit;
