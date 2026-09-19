-- Staging-only test identities. Passwords are never stored in SQL or Git.
begin;

insert into public.serveup_memberships(user_id,organization_id,role,platform_admin,store_name,job_role)
select id, '00000000-0000-4000-8000-000000000001', 'admin', true, 'Kuuraku Staging', 'Manager'
from auth.users where email = 'manager@serveup-staging.test'
on conflict (user_id) do update set
  organization_id = excluded.organization_id,
  role = excluded.role,
  platform_admin = excluded.platform_admin,
  store_name = excluded.store_name,
  job_role = excluded.job_role;

insert into public.serveup_memberships(user_id,organization_id,role,platform_admin,store_name,job_role)
select id, '00000000-0000-4000-8000-000000000001', 'learner', false, 'Kuuraku Staging', 'New staff'
from auth.users where email = 'learner@serveup-staging.test'
on conflict (user_id) do update set
  organization_id = excluded.organization_id,
  role = excluded.role,
  platform_admin = excluded.platform_admin,
  store_name = excluded.store_name,
  job_role = excluded.job_role;

do $verify$
begin
  if (select count(*) from public.serveup_memberships membership
      join auth.users account on account.id = membership.user_id
      where account.email in ('manager@serveup-staging.test','learner@serveup-staging.test')) <> 2 then
    raise exception 'Both staging test users must exist before assigning memberships';
  end if;
end;
$verify$;

commit;
