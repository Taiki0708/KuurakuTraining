-- Run only against a disposable/local Supabase database after migrations 001-012.
-- The transaction always rolls back fixture data.
begin;

create or replace function pg_temp.assert_true(p_condition boolean, p_message text)
returns void language plpgsql as $$
begin
  if not coalesce(p_condition, false) then raise exception 'assertion failed: %', p_message; end if;
end;
$$;

insert into auth.users(
  id, instance_id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','manager-a@integration.invalid','', '{}'::jsonb,'{}'::jsonb,now(),now()),
  ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','learner-a@integration.invalid','', '{}'::jsonb,'{}'::jsonb,now(),now()),
  ('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','coworker-a@integration.invalid','', '{}'::jsonb,'{}'::jsonb,now(),now()),
  ('10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','manager-b@integration.invalid','', '{}'::jsonb,'{}'::jsonb,now(),now()),
  ('10000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','learner-b@integration.invalid','', '{}'::jsonb,'{}'::jsonb,now(),now());

insert into public.organizations(id, name) values
  ('20000000-0000-0000-0000-000000000001','Integration Restaurant A'),
  ('20000000-0000-0000-0000-000000000002','Integration Restaurant B');

insert into public.organization_members(organization_id, user_id, role) values
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','admin'),
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','learner'),
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','learner'),
  ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000004','admin'),
  ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000005','learner');

insert into public.course_progress(organization_id,user_id,course_id,score) values
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','restaurant-basics',90),
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','restaurant-basics',85),
  ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000005','restaurant-basics',95);

-- Learner A: can read only their own Restaurant A row.
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select public.set_current_organization('20000000-0000-0000-0000-000000000001');
select pg_temp.assert_true(
  (select count(*) = 1 from public.course_progress),
  'Restaurant A learner must not read coworker or Restaurant B progress'
);
select pg_temp.assert_true(
  (select bool_and(user_id = '10000000-0000-0000-0000-000000000002') from public.course_progress),
  'learner result must be self-only'
);
reset role;

-- Restaurant A manager: can read both A learners, never Restaurant B.
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select public.set_current_organization('20000000-0000-0000-0000-000000000001');
select pg_temp.assert_true(
  (select count(*) = 2 from public.course_progress),
  'Restaurant A manager must see authorized A learner progress'
);
select pg_temp.assert_true(
  (select count(*) = 0 from public.course_progress where organization_id='20000000-0000-0000-0000-000000000002'),
  'Restaurant A manager must not read Restaurant B progress'
);
reset role;

-- Restaurant B manager cannot read Restaurant A.
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000004","role":"authenticated"}',true);
select public.set_current_organization('20000000-0000-0000-0000-000000000002');
select pg_temp.assert_true(
  (select count(*) = 1 from public.course_progress),
  'Restaurant B manager must see only Restaurant B progress'
);
reset role;

-- A later membership does not transfer Restaurant A history.
insert into public.organization_members(organization_id,user_id,role) values
  ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','learner');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select public.set_current_organization('20000000-0000-0000-0000-000000000002');
select pg_temp.assert_true(
  (select count(*) = 0 from public.course_progress),
  'joining Restaurant B must not move Restaurant A history into B'
);
select public.set_current_organization('20000000-0000-0000-0000-000000000001');
select pg_temp.assert_true(
  (select count(*) = 1 from public.course_progress),
  'switching back to Restaurant A must reveal unchanged A history'
);

-- Client-supplied Restaurant B ownership is rejected while A is selected.
do $$
begin
  begin
    insert into public.v1_quiz_sessions(organization_id,user_id,course_id,state)
    values (
      '20000000-0000-0000-0000-000000000002',
      '10000000-0000-0000-0000-000000000002',
      'restaurant-orientation',
      '{}'::jsonb
    );
    raise exception 'spoofed organization_id was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

-- Explicit context works for a multi-organization user.
select public.set_current_organization('20000000-0000-0000-0000-000000000002');
select pg_temp.assert_true(
  public.current_organization_id() = '20000000-0000-0000-0000-000000000002',
  'multi-organization context must select Restaurant B explicitly'
);
select public.set_current_organization('20000000-0000-0000-0000-000000000001');
select pg_temp.assert_true(
  public.current_organization_id() = '20000000-0000-0000-0000-000000000001',
  'multi-organization context must switch back to Restaurant A explicitly'
);
reset role;

-- The stored owner remains Restaurant A after membership expansion.
select pg_temp.assert_true(
  (select organization_id = '20000000-0000-0000-0000-000000000001'
   from public.course_progress
   where user_id='10000000-0000-0000-0000-000000000002'
     and course_id='restaurant-basics'),
  'historical organization ownership must remain immutable'
);

-- Even a privileged direct UPDATE cannot move an existing record. The
-- immutable-owner trigger is independent of membership and RLS.
do $$
begin
  begin
    update public.course_progress
    set organization_id = '20000000-0000-0000-0000-000000000002'
    where organization_id = '20000000-0000-0000-0000-000000000001'
      and user_id = '10000000-0000-0000-0000-000000000002'
      and course_id = 'restaurant-basics';
    raise exception 'immutable organization_id update was accepted';
  exception
    when raise_exception then
      if sqlerrm <> 'organization_id is immutable' then raise; end if;
  end;
end;
$$;

select pg_temp.assert_true(
  (select organization_id = '20000000-0000-0000-0000-000000000001'
   from public.course_progress
   where user_id='10000000-0000-0000-0000-000000000002'
     and course_id='restaurant-basics'),
  'failed owner-change attempt must leave Restaurant A ownership unchanged'
);

rollback;
