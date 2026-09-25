-- Production ACL snapshot captured on 2026-09-24.
--
-- This reproduces the current grants; it does not claim that every grant is a
-- recommended least-privilege setting. RLS and function-internal checks are
-- the current authorization boundary. Tightening privileges belongs in a
-- separately reviewed security migration, not this architecture baseline.
begin;

grant all on table
  public.certificates,
  public.course_assignments,
  public.course_progress,
  public.course_questions,
  public.course_translations,
  public.courses,
  public.group_course_assignments,
  public.group_memberships,
  public.learner_groups,
  public.organization_members,
  public.organizations,
  public.training_announcements,
  public.training_attempts,
  public.user_roles,
  public.v1_certificates,
  public.v1_course_settings,
  public.v1_practical_items,
  public.v1_practical_reviews,
  public.v1_profile_preferences,
  public.v1_quiz_attempts,
  public.v1_quiz_sessions
to anon, authenticated, service_role;

revoke all on table public.v1_question_keys from anon, authenticated;
grant all on table public.v1_question_keys to service_role;

-- Every inspected RPC has explicit execute privileges for Supabase API roles.
grant execute on function public.add_platform_organization_member(uuid,text,text) to anon, authenticated, service_role;
grant execute on function public.add_training_group_member(uuid,uuid) to anon, authenticated, service_role;
grant execute on function public.assign_training_course(uuid,text,date) to anon, authenticated, service_role;
grant execute on function public.assign_training_group_course(uuid,text,date) to anon, authenticated, service_role;
grant execute on function public.create_platform_organization(text,text) to anon, authenticated, service_role;
grant execute on function public.create_training_group(text,text) to anon, authenticated, service_role;
grant execute on function public.current_organization_id() to anon, authenticated, service_role;
grant execute on function public.delete_training_question(uuid,text) to anon, authenticated, service_role;
grant execute on function public.get_admin_course_questions(text) to anon, authenticated, service_role;
grant execute on function public.get_admin_courses() to anon, authenticated, service_role;
grant execute on function public.get_course_translation(text,text) to anon, authenticated, service_role;
grant execute on function public.get_my_training_access() to anon, authenticated, service_role;
grant execute on function public.get_my_training_certificate(text) to anon, authenticated, service_role;
grant execute on function public.get_platform_organization_members(uuid) to anon, authenticated, service_role;
grant execute on function public.get_platform_organizations() to anon, authenticated, service_role;
grant execute on function public.get_training_announcements() to anon, authenticated, service_role;
grant execute on function public.get_training_assignments() to anon, authenticated, service_role;
grant execute on function public.get_training_group_members(uuid) to anon, authenticated, service_role;
grant execute on function public.get_training_groups() to anon, authenticated, service_role;
grant execute on function public.get_training_learners() to anon, authenticated, service_role;
grant execute on function public.get_training_report() to anon, authenticated, service_role;
grant execute on function public.is_current_organization_admin() to anon, authenticated, service_role;
grant execute on function public.is_organization_member(uuid) to anon, authenticated, service_role;
grant execute on function public.is_platform_admin() to anon, authenticated, service_role;
grant execute on function public.is_training_admin() to anon, authenticated, service_role;
grant execute on function public.issue_training_certificate(text) to anon, authenticated, service_role;
grant execute on function public.issue_v1_certificate(text) to anon, authenticated, service_role;
grant execute on function public.save_training_announcement(uuid,text,text,boolean) to anon, authenticated, service_role;
grant execute on function public.save_training_course(text,integer,boolean,text,text) to anon, authenticated, service_role;
grant execute on function public.save_training_course_translation(text,text,text,text) to anon, authenticated, service_role;
grant execute on function public.save_training_question(uuid,text,text,jsonb,smallint,text,integer) to anon, authenticated, service_role;
grant execute on function public.save_training_question_locale(uuid,text,text,text,jsonb,smallint,text,integer) to anon, authenticated, service_role;
grant execute on function public.submit_v1_attempt(uuid,text,text[],jsonb) to anon, authenticated, service_role;
grant execute on function public.update_platform_organization(uuid,text,text,text) to anon, authenticated, service_role;
grant execute on function public.v1_is_manager_of(uuid) to anon, authenticated, service_role;
grant execute on function public.v1_is_platform_admin() to anon, authenticated, service_role;
grant execute on function public.v1_issue_certificate_after_practical() to anon, authenticated, service_role;

-- Functions that currently retain PostgreSQL's PUBLIC execute grant.
grant execute on function public.add_platform_organization_member(uuid,text,text) to public;
grant execute on function public.add_training_group_member(uuid,uuid) to public;
grant execute on function public.assign_training_group_course(uuid,text,date) to public;
grant execute on function public.create_platform_organization(text,text) to public;
grant execute on function public.create_training_group(text,text) to public;
grant execute on function public.current_organization_id() to public;
grant execute on function public.delete_training_question(uuid,text) to public;
grant execute on function public.get_admin_course_questions(text) to public;
grant execute on function public.get_admin_courses() to public;
grant execute on function public.get_course_translation(text,text) to public;
grant execute on function public.get_my_training_access() to public;
grant execute on function public.get_my_training_certificate(text) to public;
grant execute on function public.get_platform_organization_members(uuid) to public;
grant execute on function public.get_platform_organizations() to public;
grant execute on function public.get_training_announcements() to public;
grant execute on function public.get_training_group_members(uuid) to public;
grant execute on function public.get_training_groups() to public;
grant execute on function public.is_current_organization_admin() to public;
grant execute on function public.is_organization_member(uuid) to public;
grant execute on function public.is_platform_admin() to public;
grant execute on function public.issue_training_certificate(text) to public;
grant execute on function public.save_training_announcement(uuid,text,text,boolean) to public;
grant execute on function public.save_training_course(text,integer,boolean,text,text) to public;
grant execute on function public.save_training_course_translation(text,text,text,text) to public;
grant execute on function public.save_training_question(uuid,text,text,jsonb,smallint,text,integer) to public;
grant execute on function public.save_training_question_locale(uuid,text,text,text,jsonb,smallint,text,integer) to public;
grant execute on function public.update_platform_organization(uuid,text,text,text) to public;
grant execute on function public.v1_is_manager_of(uuid) to public;
grant execute on function public.v1_is_platform_admin() to public;

-- Functions whose production ACL explicitly removes PUBLIC execute.
revoke all on function public.assign_training_course(uuid,text,date) from public;
revoke all on function public.get_training_assignments() from public;
revoke all on function public.get_training_learners() from public;
revoke all on function public.get_training_report() from public;
revoke all on function public.is_training_admin() from public;
revoke all on function public.issue_v1_certificate(text) from public;
revoke all on function public.submit_v1_attempt(uuid,text,text[],jsonb) from public;
revoke all on function public.v1_issue_certificate_after_practical() from public;

commit;
