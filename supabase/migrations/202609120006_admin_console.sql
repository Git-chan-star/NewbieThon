create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and is_active = true
  )
$$;

revoke all on function public.is_active_user() from public;
grant execute on function public.is_active_user() to authenticated;

-- 계정 정지는 앱의 모든 공개 테이블 접근에 즉시 적용된다.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'users', 'student_profiles', 'organizations', 'organization_members',
    'employer_profiles', 'skills', 'student_skills', 'student_courses',
    'student_projects', 'jobs', 'job_skill_requirements', 'saved_jobs',
    'applications', 'job_offers', 'conversations', 'conversation_participants',
    'messages', 'engagements', 'engagement_deliverables', 'reviews',
    'notifications', 'reports', 'audit_events', 'idempotency_records',
    'competitions', 'competition_teams', 'team_role_openings', 'team_members',
    'team_applications'
  ]
  loop
    execute format(
      'create policy active_account_required on public.%I as restrictive for all to authenticated using (public.is_active_user()) with check (public.is_active_user())',
      table_name
    );
  end loop;
end;
$$;

create or replace function public.promote_user_to_admin(target_user_id uuid)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare result public.users;
begin
  update public.users
  set role = 'admin', onboarding_completed = true, is_active = true
  where id = target_user_id
  returning * into result;

  if result.id is null then
    raise exception 'user not found' using errcode = 'P0002';
  end if;

  -- 관리자 계정은 일반 학생으로 활동하지 않도록 프로필과 하위 데이터를 정리한다.
  delete from public.student_profiles where user_id = target_user_id;

  insert into public.audit_events (actor_id, entity_type, entity_id, event_type, next_state)
  values (null, 'user', result.id, 'user_promoted_to_admin', to_jsonb(result));
  return result;
end;
$$;

create or replace function public.admin_set_user_active(target_user_id uuid, active boolean)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_user public.users;
  result public.users;
begin
  if not public.is_admin() then raise exception 'admin required' using errcode = '42501'; end if;
  select * into previous_user from public.users where id = target_user_id for update;
  if previous_user.id is null then raise exception 'user not found' using errcode = 'P0002'; end if;
  if previous_user.role = 'admin' then raise exception 'admin accounts are managed by service role' using errcode = '42501'; end if;

  update public.users set is_active = active where id = target_user_id returning * into result;
  insert into public.audit_events (actor_id, entity_type, entity_id, event_type, previous_state, next_state)
  values (auth.uid(), 'user', result.id, case when active then 'user_activated' else 'user_suspended' end, to_jsonb(previous_user), to_jsonb(result));
  return result;
end;
$$;

create or replace function public.admin_set_job_status(target_job_id uuid, next_status public.job_status)
returns public.jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_job public.jobs;
  result public.jobs;
  validation jsonb;
begin
  if not public.is_admin() then raise exception 'admin required' using errcode = '42501'; end if;
  if next_status not in ('published', 'paused', 'closed') then raise exception 'unsupported admin status' using errcode = '22023'; end if;

  select * into previous_job from public.jobs where id = target_job_id for update;
  if previous_job.id is null then raise exception 'job not found' using errcode = 'P0002'; end if;
  if previous_job.status = next_status then return previous_job; end if;
  if not (
    (previous_job.status = 'published' and next_status in ('paused', 'closed'))
    or (previous_job.status = 'paused' and next_status in ('published', 'closed'))
  ) then raise exception 'invalid admin job status transition' using errcode = '22023'; end if;

  if next_status = 'published' then
    validation := public.validate_job_for_publish(target_job_id);
    if not (validation ->> 'valid')::boolean then
      raise exception 'job publish validation failed: %', validation -> 'errors' using errcode = '22023';
    end if;
  end if;

  perform set_config('itgu.workflow', 'on', true);
  update public.jobs
  set status = next_status,
      published_at = case when next_status = 'published' then coalesce(published_at, now()) else published_at end,
      closed_at = case when next_status = 'closed' then now() when next_status = 'published' then null else closed_at end
  where id = target_job_id
  returning * into result;

  if next_status = 'closed' then
    update public.job_offers set status = 'canceled' where job_id = target_job_id and status = 'pending';
  end if;
  insert into public.audit_events (actor_id, entity_type, entity_id, event_type, previous_state, next_state)
  values (auth.uid(), 'job', result.id, 'job_moderated', to_jsonb(previous_job), to_jsonb(result));
  return result;
end;
$$;

create or replace function public.admin_review_employer_verification(
  target_user_id uuid,
  decision public.verification_status,
  decision_note text default null
)
returns public.employer_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_profile public.employer_profiles;
  result public.employer_profiles;
begin
  if not public.is_admin() then raise exception 'admin required' using errcode = '42501'; end if;
  if decision not in ('verified', 'rejected') then raise exception 'invalid verification decision' using errcode = '22023'; end if;
  select * into previous_profile from public.employer_profiles where user_id = target_user_id for update;
  if previous_profile.user_id is null then raise exception 'employer not found' using errcode = 'P0002'; end if;

  perform set_config('itgu.workflow', 'on', true);
  update public.employer_profiles set verification_status = decision where user_id = target_user_id returning * into result;
  update public.organizations set verification_status = decision, verification_note = decision_note where id = result.organization_id;
  insert into public.audit_events (actor_id, entity_type, entity_id, event_type, previous_state, next_state, metadata)
  values (auth.uid(), 'employer_profile', result.user_id, 'employer_verification_reviewed', to_jsonb(previous_profile), to_jsonb(result), jsonb_build_object('note', decision_note));
  return result;
end;
$$;

create or replace function public.admin_set_report_status(target_report_id uuid, next_status public.report_status)
returns public.reports
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_report public.reports;
  result public.reports;
begin
  if not public.is_admin() then raise exception 'admin required' using errcode = '42501'; end if;
  if next_status not in ('reviewing', 'resolved', 'dismissed') then raise exception 'invalid report status' using errcode = '22023'; end if;
  select * into previous_report from public.reports where id = target_report_id for update;
  if previous_report.id is null then raise exception 'report not found' using errcode = 'P0002'; end if;

  update public.reports
  set status = next_status,
      assigned_admin_id = auth.uid(),
      resolved_at = case when next_status in ('resolved', 'dismissed') then now() else null end
  where id = target_report_id
  returning * into result;
  insert into public.audit_events (actor_id, entity_type, entity_id, event_type, previous_state, next_state)
  values (auth.uid(), 'report', result.id, 'report_status_changed', to_jsonb(previous_report), to_jsonb(result));
  return result;
end;
$$;

revoke all on function public.promote_user_to_admin(uuid) from public;
revoke all on function public.admin_set_user_active(uuid, boolean) from public;
revoke all on function public.admin_set_job_status(uuid, public.job_status) from public;
revoke all on function public.admin_review_employer_verification(uuid, public.verification_status, text) from public;
revoke all on function public.admin_set_report_status(uuid, public.report_status) from public;
grant execute on function public.promote_user_to_admin(uuid) to service_role;
grant execute on function public.admin_set_user_active(uuid, boolean) to authenticated;
grant execute on function public.admin_set_job_status(uuid, public.job_status) to authenticated;
grant execute on function public.admin_review_employer_verification(uuid, public.verification_status, text) to authenticated;
grant execute on function public.admin_set_report_status(uuid, public.report_status) to authenticated;
