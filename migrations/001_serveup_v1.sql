-- Review against the target Supabase project before applying. Non-destructive: no legacy table is changed.
-- Existing access-control functions are used when available. Fresh staging projects
-- remain learner-safe until the organization/manager access layer is installed.
begin;

create table if not exists public.v1_course_settings (
  course_id text primary key check (course_id in ('restaurant-orientation','hygiene-food-safety','guest-service-basics','workplace-communication','allergies-dietary','safety-emergency','order-serving-payment','complaints-difficult')),
  question_count integer not null default 10 check (question_count between 1 and 30),
  pass_score integer not null default 80 check (pass_score between 1 and 100),
  certificate_requirement text not null default 'quiz_only' check (certificate_requirement in ('quiz_only','quiz_and_practical'))
);
create table if not exists public.v1_question_keys (
  id text primary key, course_id text not null references public.v1_course_settings(course_id), correct_answer integer not null check (correct_answer between 0 and 3)
);
create table if not exists public.v1_practical_items (
  course_id text not null references public.v1_course_settings(course_id), item_id text not null,
  primary key (course_id, item_id)
);
create table if not exists public.v1_quiz_sessions (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null references public.v1_course_settings(course_id),
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id)
);
create table if not exists public.v1_quiz_attempts (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null references public.v1_course_settings(course_id),
  question_ids text[] not null,
  answers jsonb not null check (jsonb_typeof(answers) = 'object'),
  score integer not null check (score between 0 and 100),
  passed boolean not null,
  source text not null default 'v1' check (source in ('v1','legacy')),
  completed_at timestamptz not null default now()
);
create index if not exists v1_attempts_user_course_date on public.v1_quiz_attempts(user_id, course_id, completed_at desc);
create table if not exists public.v1_practical_reviews (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,
  item_id text not null,
  status text not null check (status in ('not_checked','practicing','independent','needs_review')),
  comment text not null default '' check (length(comment) <= 500),
  reviewer_id uuid not null references auth.users(id),
  reviewed_at timestamptz not null default now(),
  primary key (user_id, course_id, item_id),
  foreign key (course_id, item_id) references public.v1_practical_items(course_id, item_id)
);
create table if not exists public.v1_certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null references public.v1_course_settings(course_id),
  certificate_number text not null unique,
  issued_at timestamptz not null default now(),
  unique (user_id, course_id)
);
create table if not exists public.v1_profile_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  locale text not null check (locale in ('en','ja','hi')),
  display_name text not null default '' check (char_length(trim(display_name)) <= 80),
  updated_at timestamptz not null default now()
);

create or replace function public.v1_is_platform_admin() returns boolean
language plpgsql stable security invoker set search_path = public, pg_temp as $$
declare v_allowed boolean := false;
begin
  if to_regprocedure('public.get_my_training_access()') is null then return false; end if;
  execute 'select exists(select 1 from public.get_my_training_access() a where a.platform_admin = true)' into v_allowed;
  return coalesce(v_allowed, false);
end;
$$;
create or replace function public.v1_is_manager_of(p_user_id uuid) returns boolean
language plpgsql stable security invoker set search_path = public, pg_temp as $$
declare v_allowed boolean := false;
begin
  if to_regprocedure('public.get_my_training_access()') is null
     or to_regprocedure('public.get_training_learners()') is null then
    return false;
  end if;
  execute 'select exists(select 1 from public.get_my_training_access() a where a.role = ''admin'')
             and exists(select 1 from public.get_training_learners() l where l.user_id = $1)'
    into v_allowed using p_user_id;
  return coalesce(v_allowed, false);
end;
$$;

alter table public.v1_course_settings enable row level security;
alter table public.v1_question_keys enable row level security;
alter table public.v1_practical_items enable row level security;
alter table public.v1_quiz_sessions enable row level security;
alter table public.v1_quiz_attempts enable row level security;
alter table public.v1_practical_reviews enable row level security;
alter table public.v1_certificates enable row level security;
alter table public.v1_profile_preferences enable row level security;

create policy v1_settings_read on public.v1_course_settings for select to authenticated using (true);
create policy v1_settings_write on public.v1_course_settings for all to authenticated using (public.v1_is_platform_admin()) with check (public.v1_is_platform_admin());
create policy v1_items_read on public.v1_practical_items for select to authenticated using (true);
-- No client read or write policy for answer keys.
create policy v1_sessions_self on public.v1_quiz_sessions for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy v1_attempts_read on public.v1_quiz_attempts for select to authenticated using (user_id = (select auth.uid()) or public.v1_is_manager_of(user_id));
-- Attempts are immutable and can only be inserted by the server-side scoring function.
create policy v1_practical_read on public.v1_practical_reviews for select to authenticated using (user_id = (select auth.uid()) or public.v1_is_manager_of(user_id));
create policy v1_practical_insert on public.v1_practical_reviews for insert to authenticated with check (
  reviewer_id = (select auth.uid()) and public.v1_is_manager_of(user_id)
  and exists(select 1 from public.v1_quiz_attempts a where a.user_id = v1_practical_reviews.user_id and a.course_id = v1_practical_reviews.course_id and a.passed)
);
create policy v1_practical_update on public.v1_practical_reviews for update to authenticated using (public.v1_is_manager_of(user_id)) with check (
  reviewer_id = (select auth.uid()) and public.v1_is_manager_of(user_id)
  and exists(select 1 from public.v1_quiz_attempts a where a.user_id = v1_practical_reviews.user_id and a.course_id = v1_practical_reviews.course_id and a.passed)
);
create policy v1_certificates_read on public.v1_certificates for select to authenticated using (user_id = (select auth.uid()) or public.v1_is_manager_of(user_id));
create policy v1_profile_read on public.v1_profile_preferences for select to authenticated using (user_id = (select auth.uid()) or public.v1_is_manager_of(user_id));
create policy v1_profile_insert on public.v1_profile_preferences for insert to authenticated with check (user_id = (select auth.uid()));
create policy v1_profile_update on public.v1_profile_preferences for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select, insert, update on public.v1_course_settings to authenticated;
grant select on public.v1_practical_items to authenticated;
grant select, insert, update, delete on public.v1_quiz_sessions to authenticated;
grant select on public.v1_quiz_attempts to authenticated;
grant select, insert, update on public.v1_practical_reviews to authenticated;
grant select on public.v1_certificates to authenticated;
grant select, insert, update on public.v1_profile_preferences to authenticated;
revoke all on public.v1_question_keys from anon, authenticated;

create or replace function public.submit_v1_attempt(p_attempt_id uuid, p_course_id text, p_question_ids text[], p_answers jsonb)
returns public.v1_quiz_attempts language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user uuid := auth.uid(); v_count integer; v_correct integer; v_score integer; v_row public.v1_quiz_attempts;
begin
  if v_user is null then raise exception 'Sign-in required'; end if;
  select attempt.* into v_row
  from public.v1_quiz_attempts attempt
  where attempt.id = p_attempt_id;
  if found then
    if v_row.user_id <> v_user then raise exception 'Attempt ID belongs to another user'; end if;
    return v_row;
  end if;
  select question_count into v_count from public.v1_course_settings where course_id = p_course_id;
  if v_count is null or p_question_ids is null or cardinality(p_question_ids) <> v_count or p_answers is null then raise exception 'Invalid attempt size'; end if;
  if exists(
    select 1
    from unnest(p_question_ids) as selected(question_id)
    group by selected.question_id
    having count(*) > 1
  ) then raise exception 'Duplicate question'; end if;
  if (
    select count(*)
    from unnest(p_question_ids) as selected(question_id)
    join public.v1_question_keys question_key
      on question_key.id = selected.question_id
     and question_key.course_id = p_course_id
  ) <> v_count then raise exception 'Unknown question'; end if;
  select count(*) into v_correct
  from unnest(p_question_ids) as selected(question_id)
  join public.v1_question_keys question_key on question_key.id = selected.question_id
  where p_answers ? selected.question_id
    and (p_answers ->> selected.question_id) ~ '^[0-3]$'
    and (p_answers ->> selected.question_id)::integer = question_key.correct_answer;
  v_score := round(100.0 * v_correct / v_count)::integer;
  insert into public.v1_quiz_attempts(id,user_id,course_id,question_ids,answers,score,passed)
    values(p_attempt_id,v_user,p_course_id,p_question_ids,p_answers,v_score,v_score >= (select pass_score from public.v1_course_settings where course_id = p_course_id))
    returning * into v_row;
  return v_row;
end;
$$;
revoke all on function public.submit_v1_attempt(uuid,text,text[],jsonb) from public;
grant execute on function public.submit_v1_attempt(uuid,text,text[],jsonb) to authenticated;

create or replace function public.issue_v1_certificate(p_course_id text)
returns public.v1_certificates language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user uuid := auth.uid(); v_requirement text; v_row public.v1_certificates;
begin
  if v_user is null then raise exception 'Sign-in required'; end if;
  select * into v_row from public.v1_certificates where user_id = v_user and course_id = p_course_id;
  if found then return v_row; end if;
  select certificate_requirement into v_requirement from public.v1_course_settings where course_id = p_course_id;
  if v_requirement is null then raise exception 'Unknown course'; end if;
  if not exists(select 1 from public.v1_quiz_attempts where user_id = v_user and course_id = p_course_id and passed) then raise exception 'Quiz not passed'; end if;
  if v_requirement = 'quiz_and_practical' and exists(
    select 1 from public.v1_practical_items item where item.course_id = p_course_id
      and not exists(select 1 from public.v1_practical_reviews review where review.user_id = v_user and review.course_id = item.course_id and review.item_id = item.item_id and review.status = 'independent')
  ) then raise exception 'Practical check not complete'; end if;
  insert into public.v1_certificates(user_id,course_id,certificate_number)
    values(v_user,p_course_id,'SU-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,16)))
    on conflict (user_id,course_id) do nothing;
  select * into v_row from public.v1_certificates where user_id = v_user and course_id = p_course_id;
  return v_row;
end;
$$;
revoke all on function public.issue_v1_certificate(text) from public;
grant execute on function public.issue_v1_certificate(text) to authenticated;

create or replace function public.v1_issue_certificate_after_practical()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.status <> 'independent' then return new; end if;
  if not exists(select 1 from public.v1_course_settings where course_id = new.course_id and certificate_requirement = 'quiz_and_practical') then return new; end if;
  if not exists(select 1 from public.v1_quiz_attempts where user_id = new.user_id and course_id = new.course_id and passed) then return new; end if;
  if exists(
    select 1 from public.v1_practical_items item where item.course_id = new.course_id
      and not exists(select 1 from public.v1_practical_reviews review where review.user_id = new.user_id and review.course_id = item.course_id and review.item_id = item.item_id and review.status = 'independent')
  ) then return new; end if;
  insert into public.v1_certificates(user_id,course_id,certificate_number)
    values(new.user_id,new.course_id,'SU-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,16)))
    on conflict (user_id,course_id) do nothing;
  return new;
end;
$$;
drop trigger if exists v1_practical_certificate on public.v1_practical_reviews;
create trigger v1_practical_certificate after insert or update of status on public.v1_practical_reviews
for each row execute function public.v1_issue_certificate_after_practical();
revoke all on function public.v1_issue_certificate_after_practical() from public;

commit;
