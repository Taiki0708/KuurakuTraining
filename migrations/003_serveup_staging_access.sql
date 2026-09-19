-- Bootstrap only for an empty staging project.
-- Production already has its own organization/access layer; do not replace it.
begin;

create table if not exists public.serveup_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);

create table if not exists public.serveup_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.serveup_organizations(id) on delete cascade,
  role text not null check (role in ('learner','admin')),
  platform_admin boolean not null default false,
  store_name text not null default '' check (length(store_name) <= 120),
  job_role text not null default '' check (length(job_role) <= 120),
  created_at timestamptz not null default now()
);
create index if not exists serveup_memberships_organization on public.serveup_memberships(organization_id);

alter table public.serveup_organizations enable row level security;
alter table public.serveup_memberships enable row level security;
revoke all on public.serveup_organizations from anon, authenticated;
revoke all on public.serveup_memberships from anon, authenticated;

insert into public.serveup_organizations(id,name,slug)
values('00000000-0000-4000-8000-000000000001','Kuuraku Staging','kuuraku-staging')
on conflict (id) do update set name = excluded.name, slug = excluded.slug;

do $bootstrap$
begin
  if to_regprocedure('public.get_my_training_access()') is null then
    execute $function$
      create function public.get_my_training_access()
      returns table(organization_id uuid, organization_name text, role text, platform_admin boolean)
      language sql stable security definer set search_path = public, auth, pg_temp as $body$
        select membership.organization_id, organization.name, membership.role, membership.platform_admin
        from public.serveup_memberships membership
        join public.serveup_organizations organization on organization.id = membership.organization_id
        where membership.user_id = auth.uid()
        limit 1
      $body$;
      revoke all on function public.get_my_training_access() from public;
      grant execute on function public.get_my_training_access() to authenticated;
    $function$;
  end if;

  if to_regprocedure('public.get_training_learners()') is null then
    execute $function$
      create function public.get_training_learners()
      returns table(user_id uuid, email text, organization_name text, store_name text, job_role text, role text)
      language sql stable security definer set search_path = public, auth, pg_temp as $body$
        with current_access as (
          select membership.organization_id, membership.role, membership.platform_admin
          from public.serveup_memberships membership
          where membership.user_id = auth.uid()
        )
        select learner.user_id, account.email::text, organization.name,
               learner.store_name, learner.job_role, learner.role
        from current_access access
        join public.serveup_memberships learner
          on access.platform_admin or learner.organization_id = access.organization_id
        join public.serveup_organizations organization on organization.id = learner.organization_id
        join auth.users account on account.id = learner.user_id
        where (access.role = 'admin' or access.platform_admin)
          and learner.role = 'learner'
        order by account.email
      $body$;
      revoke all on function public.get_training_learners() from public;
      grant execute on function public.get_training_learners() to authenticated;
    $function$;
  end if;
end;
$bootstrap$;

commit;
