-- Fix ambiguous `id` references in submit_v1_attempt on existing V1 databases.
begin;

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
  select setting.question_count into v_count
  from public.v1_course_settings setting
  where setting.course_id = p_course_id;
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
    values(p_attempt_id,v_user,p_course_id,p_question_ids,p_answers,v_score,v_score >= (select setting.pass_score from public.v1_course_settings setting where setting.course_id = p_course_id))
    returning * into v_row;
  return v_row;
end;
$$;
revoke all on function public.submit_v1_attempt(uuid,text,text[],jsonb) from public;
grant execute on function public.submit_v1_attempt(uuid,text,text[],jsonb) to authenticated;

commit;
