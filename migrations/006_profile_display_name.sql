-- Adds an optional learner-facing name without changing authentication emails.
-- Existing profile rows remain valid and fall back to email until a name is saved.
begin;

alter table public.v1_profile_preferences
  add column if not exists display_name text not null default '';

do $migration$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.v1_profile_preferences'::regclass
      and conname = 'v1_profile_display_name_length'
  ) then
    alter table public.v1_profile_preferences
      add constraint v1_profile_display_name_length
      check (char_length(trim(display_name)) <= 80);
  end if;
end;
$migration$;

commit;
