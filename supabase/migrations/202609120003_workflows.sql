create or replace function public.lock_idempotency(operation_name text, key_value uuid)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  select pg_advisory_xact_lock(hashtextextended(auth.uid()::text || ':' || operation_name || ':' || key_value::text, 0))
$$;

create or replace function public.notify_once(
  target_user_id uuid,
  target_event_key text,
  target_type text,
  target_title text,
  target_body text,
  target_deep_link text default null
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.notifications (user_id, event_key, notification_type, title, body, deep_link)
  values (target_user_id, target_event_key, target_type, target_title, target_body, target_deep_link)
  on conflict (user_id, event_key) do nothing
$$;

create or replace function public.onboard_employer(
  organization_name text,
  organization_type text,
  organization_industry text,
  organization_introduction text,
  contact_name text,
  contact_position text,
  contact_work_email text,
  contact_hours text default null
)
returns public.employer_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  created_organization_id uuid;
  result public.employer_profiles;
begin
  if public.current_role() <> 'employer' then
    raise exception 'employer role required' using errcode = '42501';
  end if;
  if exists (select 1 from public.employer_profiles where user_id = auth.uid()) then
    raise exception 'employer onboarding already completed' using errcode = '23505';
  end if;
  if nullif(trim(organization_name), '') is null or nullif(trim(contact_name), '') is null then
    raise exception 'organization and contact name are required' using errcode = '22023';
  end if;
  if contact_work_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'valid work email is required' using errcode = '22023';
  end if;

  insert into public.organizations (name, organization_type, industry, introduction)
  values (trim(organization_name), organization_type, organization_industry, organization_introduction)
  returning id into created_organization_id;

  insert into public.organization_members (organization_id, user_id, member_role)
  values (created_organization_id, auth.uid(), 'owner');

  insert into public.employer_profiles (
    user_id, organization_id, contact_name, position, work_email, contact_hours
  ) values (
    auth.uid(), created_organization_id, trim(contact_name), contact_position,
    lower(trim(contact_work_email)), contact_hours
  ) returning * into result;

  insert into public.audit_events (actor_id, entity_type, entity_id, event_type, next_state)
  values (auth.uid(), 'organization', created_organization_id, 'employer_onboarding_completed', to_jsonb(result));

  return result;
end;
$$;

create or replace function public.submit_employer_verification(document_path text)
returns public.employer_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.employer_profiles;
begin
  if nullif(trim(document_path), '') is null or split_part(document_path, '/', 1) <> auth.uid()::text then
    raise exception 'invalid verification document path' using errcode = '22023';
  end if;

  perform set_config('itgu.workflow', 'on', true);
  update public.employer_profiles
  set verification_status = 'pending', verification_document_path = document_path
  where user_id = auth.uid()
  returning * into result;

  if result.user_id is null then
    raise exception 'employer profile not found' using errcode = 'P0002';
  end if;

  insert into public.audit_events (actor_id, entity_type, entity_id, event_type, next_state)
  values (auth.uid(), 'employer_profile', auth.uid(), 'employer_verification_submitted', to_jsonb(result));
  return result;
end;
$$;

create or replace function public.validate_job_for_publish(target_job_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  job_row public.jobs;
  errors text[] := '{}';
  employer_verification public.verification_status;
begin
  select * into job_row from public.jobs where id = target_job_id;
  if job_row.id is null or (job_row.employer_id <> auth.uid() and not public.is_admin()) then
    raise exception 'job not found' using errcode = 'P0002';
  end if;

  select verification_status into employer_verification
  from public.employer_profiles where user_id = job_row.employer_id;

  if nullif(trim(job_row.title), '') is null then errors := array_append(errors, 'title_required'); end if;
  if nullif(trim(coalesce(job_row.summary, '')), '') is null then errors := array_append(errors, 'summary_required'); end if;
  if cardinality(job_row.tasks) = 0 then errors := array_append(errors, 'tasks_required'); end if;
  if cardinality(job_row.deliverables) = 0 then errors := array_append(errors, 'deliverables_required'); end if;
  if job_row.work_mode is null then errors := array_append(errors, 'work_mode_required'); end if;
  if job_row.starts_on is null or job_row.ends_on is null then errors := array_append(errors, 'schedule_required'); end if;
  if job_row.apply_deadline is null or job_row.apply_deadline <= now() then errors := array_append(errors, 'future_deadline_required'); end if;
  if job_row.compensation_type is null then errors := array_append(errors, 'compensation_type_required'); end if;
  if job_row.compensation_type <> 'negotiable' and job_row.compensation_min is null then errors := array_append(errors, 'compensation_amount_required'); end if;
  if not job_row.no_specific_skill and not exists (
    select 1 from public.job_skill_requirements where job_id = target_job_id
  ) then errors := array_append(errors, 'skill_required'); end if;

  return jsonb_build_object(
    'valid', cardinality(errors) = 0,
    'errors', to_jsonb(errors),
    'employerVerification', employer_verification,
    'showsUnverifiedBadge', employer_verification <> 'verified'
  );
end;
$$;

create or replace function public.publish_job(target_job_id uuid, idempotency_key uuid)
returns public.jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  validation jsonb;
  previous_job public.jobs;
  result public.jobs;
  existing_resource uuid;
begin
  perform public.lock_idempotency('publish_job', idempotency_key);
  select resource_id into existing_resource
  from public.idempotency_records
  where actor_id = auth.uid() and operation = 'publish_job' and idempotency_records.idempotency_key = publish_job.idempotency_key;
  if existing_resource is not null then
    select * into result from public.jobs where id = existing_resource;
    return result;
  end if;

  select * into previous_job from public.jobs where id = target_job_id for update;
  if previous_job.id is null or previous_job.employer_id <> auth.uid() then
    raise exception 'job not found' using errcode = 'P0002';
  end if;
  if previous_job.status not in ('draft', 'paused') then
    raise exception 'job cannot be published from current status' using errcode = '22023';
  end if;

  validation := public.validate_job_for_publish(target_job_id);
  if not (validation ->> 'valid')::boolean then
    raise exception 'job publish validation failed: %', validation -> 'errors' using errcode = '22023';
  end if;

  perform set_config('itgu.workflow', 'on', true);
  update public.jobs
  set status = 'published', published_at = coalesce(published_at, now()), closed_at = null
  where id = target_job_id returning * into result;

  insert into public.idempotency_records (actor_id, operation, idempotency_key, resource_id)
  values (auth.uid(), 'publish_job', idempotency_key, result.id);
  insert into public.audit_events (actor_id, entity_type, entity_id, event_type, previous_state, next_state)
  values (auth.uid(), 'job', result.id, 'job_published', to_jsonb(previous_job), to_jsonb(result));
  return result;
end;
$$;

create or replace function public.change_job_status(target_job_id uuid, next_status public.job_status)
returns public.jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_job public.jobs;
  result public.jobs;
begin
  select * into previous_job from public.jobs where id = target_job_id for update;
  if previous_job.id is null or previous_job.employer_id <> auth.uid() then
    raise exception 'job not found' using errcode = 'P0002';
  end if;
  if not (
    (previous_job.status = 'published' and next_status in ('paused', 'closed', 'filled'))
    or (previous_job.status = 'paused' and next_status = 'closed')
  ) then
    raise exception 'invalid job status transition' using errcode = '22023';
  end if;

  perform set_config('itgu.workflow', 'on', true);
  update public.jobs
  set status = next_status,
      closed_at = case when next_status in ('closed', 'filled') then now() else closed_at end
  where id = target_job_id returning * into result;

  if next_status in ('closed', 'filled') then
    update public.job_offers set status = 'canceled'
    where job_id = target_job_id and status = 'pending';
  end if;
  insert into public.audit_events (actor_id, entity_type, entity_id, event_type, previous_state, next_state)
  values (auth.uid(), 'job', result.id, 'job_status_changed', to_jsonb(previous_job), to_jsonb(result));
  return result;
end;
$$;

drop policy applications_create_student on public.applications;

create or replace function public.apply_to_job(target_job_id uuid, application_message text, idempotency_key uuid)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  job_row public.jobs;
  result public.applications;
  snapshot jsonb;
  existing_resource uuid;
begin
  if public.current_role() <> 'student' then
    raise exception 'student role required' using errcode = '42501';
  end if;
  perform public.lock_idempotency('apply_to_job', idempotency_key);
  select resource_id into existing_resource from public.idempotency_records
  where actor_id = auth.uid() and operation = 'apply_to_job' and idempotency_records.idempotency_key = apply_to_job.idempotency_key;
  if existing_resource is not null then
    select * into result from public.applications where id = existing_resource;
    return result;
  end if;

  select * into job_row from public.jobs where id = target_job_id for update;
  if job_row.id is null or job_row.status <> 'published' or job_row.apply_deadline <= now() then
    raise exception 'job is not accepting applications' using errcode = '22023';
  end if;
  if job_row.employer_id = auth.uid() then
    raise exception 'cannot apply to own job' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'displayName', u.display_name,
    'school', sp.school,
    'major', sp.major,
    'schoolYear', sp.school_year,
    'verificationStatus', sp.verification_status,
    'skills', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'level', ss.level))
      from public.student_skills ss join public.skills s on s.id = ss.skill_id
      where ss.student_id = auth.uid()
    ), '[]'::jsonb),
    'projects', coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'title', p.title, 'description', p.description, 'skills', p.skills))
      from public.student_projects p where p.student_id = auth.uid() and p.is_public = true
    ), '[]'::jsonb)
  ) into snapshot
  from public.users u join public.student_profiles sp on sp.user_id = u.id
  where u.id = auth.uid();

  insert into public.applications (job_id, student_id, message, profile_snapshot)
  values (target_job_id, auth.uid(), application_message, snapshot)
  returning * into result;

  insert into public.idempotency_records (actor_id, operation, idempotency_key, resource_id)
  values (auth.uid(), 'apply_to_job', idempotency_key, result.id);
  perform public.notify_once(
    job_row.employer_id,
    'application:' || result.id,
    'new_application',
    '새 지원자가 있어요',
    '공고에 새로운 지원이 도착했습니다.',
    '/employer/applications/' || result.id
  );
  insert into public.audit_events (actor_id, entity_type, entity_id, event_type, next_state)
  values (auth.uid(), 'application', result.id, 'application_submitted', to_jsonb(result));
  return result;
end;
$$;

create or replace function public.get_or_create_application_conversation(target_application_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  application_row public.applications;
  job_row public.jobs;
  conversation_id uuid;
begin
  select * into application_row from public.applications where id = target_application_id;
  if application_row.id is null then
    raise exception 'application not found' using errcode = 'P0002';
  end if;
  select * into job_row from public.jobs where id = application_row.job_id;
  if auth.uid() not in (application_row.student_id, job_row.employer_id) and not public.is_admin() then
    raise exception 'conversation access denied' using errcode = '42501';
  end if;

  insert into public.conversations (job_id, application_id)
  values (application_row.job_id, application_row.id)
  on conflict (application_id) do update set updated_at = public.conversations.updated_at
  returning id into conversation_id;

  insert into public.conversation_participants (conversation_id, user_id)
  values (conversation_id, application_row.student_id), (conversation_id, job_row.employer_id)
  on conflict do nothing;
  return conversation_id;
end;
$$;

create or replace function public.change_application_status(
  target_application_id uuid,
  next_status public.application_status,
  idempotency_key uuid
)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_application public.applications;
  result public.applications;
  allowed boolean := false;
  existing_resource uuid;
begin
  perform public.lock_idempotency('change_application_status', idempotency_key);
  select resource_id into existing_resource from public.idempotency_records
  where actor_id = auth.uid() and operation = 'change_application_status' and idempotency_records.idempotency_key = change_application_status.idempotency_key;
  if existing_resource is not null then
    select * into result from public.applications where id = existing_resource;
    return result;
  end if;

  select * into previous_application from public.applications where id = target_application_id for update;
  if previous_application.id is null or not public.is_employer_for_job(previous_application.job_id) then
    raise exception 'application not found' using errcode = 'P0002';
  end if;

  allowed := case previous_application.status
    when 'submitted' then next_status = 'viewed'
    when 'viewed' then next_status in ('chatting', 'interview', 'accepted', 'rejected')
    when 'chatting' then next_status in ('interview', 'accepted', 'rejected')
    when 'interview' then next_status in ('chatting', 'accepted', 'rejected')
    when 'rejected' then next_status = 'viewed'
    else false
  end;
  if not allowed then
    raise exception 'invalid application status transition' using errcode = '22023';
  end if;

  perform set_config('itgu.workflow', 'on', true);
  update public.applications
  set status = next_status,
      viewed_at = case when next_status = 'viewed' then coalesce(viewed_at, now()) else viewed_at end
  where id = target_application_id returning * into result;

  if next_status = 'chatting' then
    perform public.get_or_create_application_conversation(target_application_id);
  end if;
  perform public.notify_once(
    result.student_id,
    'application_status:' || result.id || ':' || next_status::text,
    'application_status_changed',
    '지원 상태가 변경됐어요',
    '지원한 공고의 진행 상태를 확인해 주세요.',
    '/student/applications/' || result.id
  );
  insert into public.idempotency_records (actor_id, operation, idempotency_key, resource_id)
  values (auth.uid(), 'change_application_status', idempotency_key, result.id);
  insert into public.audit_events (actor_id, entity_type, entity_id, event_type, previous_state, next_state)
  values (auth.uid(), 'application', result.id, 'application_status_changed', to_jsonb(previous_application), to_jsonb(result));
  return result;
end;
$$;

create or replace function public.send_job_offer(
  target_job_id uuid,
  target_student_id uuid,
  offer_reason text,
  offer_message text,
  offer_expires_at timestamptz,
  idempotency_key uuid
)
returns public.job_offers
language plpgsql
security definer
set search_path = public
as $$
declare
  job_row public.jobs;
  result public.job_offers;
  existing_resource uuid;
begin
  perform public.lock_idempotency('send_job_offer', idempotency_key);
  select resource_id into existing_resource from public.idempotency_records
  where actor_id = auth.uid() and operation = 'send_job_offer' and idempotency_records.idempotency_key = send_job_offer.idempotency_key;
  if existing_resource is not null then
    select * into result from public.job_offers where id = existing_resource;
    return result;
  end if;

  select * into job_row from public.jobs where id = target_job_id for update;
  if job_row.id is null or job_row.employer_id <> auth.uid() or job_row.status <> 'published' or job_row.apply_deadline <= now() then
    raise exception 'job is not available for offers' using errcode = '22023';
  end if;
  if not exists (select 1 from public.student_profiles where user_id = target_student_id and discoverable = true) then
    raise exception 'student is not discoverable' using errcode = '42501';
  end if;
  if offer_expires_at <= now() then
    raise exception 'offer expiration must be in the future' using errcode = '22023';
  end if;

  insert into public.job_offers (job_id, employer_id, student_id, reason, message, expires_at)
  values (target_job_id, auth.uid(), target_student_id, offer_reason, offer_message, offer_expires_at)
  returning * into result;
  insert into public.idempotency_records (actor_id, operation, idempotency_key, resource_id)
  values (auth.uid(), 'send_job_offer', idempotency_key, result.id);
  perform public.notify_once(
    target_student_id,
    'offer:' || result.id,
    'new_job_offer',
    '새 업무 제안이 도착했어요',
    '업무 범위와 보수를 확인한 뒤 답변해 주세요.',
    '/student/offers/' || result.id
  );
  insert into public.audit_events (actor_id, entity_type, entity_id, event_type, next_state)
  values (auth.uid(), 'job_offer', result.id, 'offer_sent', to_jsonb(result));
  return result;
end;
$$;

create or replace function public.respond_to_offer(offer_id uuid, accept boolean, idempotency_key uuid)
returns public.job_offers
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_offer public.job_offers;
  result public.job_offers;
  conversation_id uuid;
  existing_resource uuid;
begin
  perform public.lock_idempotency('respond_to_offer', idempotency_key);
  select resource_id into existing_resource from public.idempotency_records
  where actor_id = auth.uid() and operation = 'respond_to_offer' and idempotency_records.idempotency_key = respond_to_offer.idempotency_key;
  if existing_resource is not null then
    select * into result from public.job_offers where id = existing_resource;
    return result;
  end if;

  select * into previous_offer from public.job_offers where id = offer_id for update;
  if previous_offer.id is null or previous_offer.student_id <> auth.uid() then
    raise exception 'offer not found' using errcode = 'P0002';
  end if;
  if previous_offer.status <> 'pending' or previous_offer.expires_at <= now() then
    raise exception 'offer is no longer pending' using errcode = '22023';
  end if;

  perform set_config('itgu.workflow', 'on', true);
  update public.job_offers
  set status = case when accept then 'accepted' else 'declined' end,
      responded_at = now()
  where id = offer_id returning * into result;

  if accept then
    insert into public.conversations (job_id, offer_id)
    values (result.job_id, result.id)
    on conflict (offer_id) do update set updated_at = public.conversations.updated_at
    returning id into conversation_id;
    insert into public.conversation_participants (conversation_id, user_id)
    values (conversation_id, result.student_id), (conversation_id, result.employer_id)
    on conflict do nothing;
  end if;

  insert into public.idempotency_records (actor_id, operation, idempotency_key, resource_id)
  values (auth.uid(), 'respond_to_offer', idempotency_key, result.id);
  perform public.notify_once(
    result.employer_id,
    'offer_response:' || result.id,
    'offer_response',
    case when accept then '학생이 제안을 수락했어요' else '학생이 제안을 거절했어요' end,
    '업무 제안 응답을 확인해 주세요.',
    '/employer/offers/' || result.id
  );
  insert into public.audit_events (actor_id, entity_type, entity_id, event_type, previous_state, next_state)
  values (auth.uid(), 'job_offer', result.id, 'offer_responded', to_jsonb(previous_offer), to_jsonb(result));
  return result;
end;
$$;

create or replace function public.create_engagement(
  source_application_id uuid,
  source_offer_id uuid,
  agreed_scope text,
  agreed_deliverables text[],
  agreed_start_date date,
  agreed_end_date date,
  agreed_compensation_type public.compensation_type,
  agreed_compensation_amount integer,
  idempotency_key uuid
)
returns public.engagements
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.engagements;
  application_row public.applications;
  offer_row public.job_offers;
  job_row public.jobs;
  selected_job_id uuid;
  selected_student_id uuid;
  selected_employer_id uuid;
  existing_resource uuid;
begin
  if num_nonnulls(source_application_id, source_offer_id) <> 1 then
    raise exception 'exactly one accepted source is required' using errcode = '22023';
  end if;
  perform public.lock_idempotency('create_engagement', idempotency_key);
  select resource_id into existing_resource from public.idempotency_records
  where actor_id = auth.uid() and operation = 'create_engagement' and idempotency_records.idempotency_key = create_engagement.idempotency_key;
  if existing_resource is not null then
    select * into result from public.engagements where id = existing_resource;
    return result;
  end if;

  if source_application_id is not null then
    select * into application_row from public.applications where id = source_application_id for update;
    select * into job_row from public.jobs where id = application_row.job_id;
    if application_row.status <> 'accepted' then raise exception 'application must be accepted' using errcode = '22023'; end if;
    selected_job_id := application_row.job_id;
    selected_student_id := application_row.student_id;
    selected_employer_id := job_row.employer_id;
  else
    select * into offer_row from public.job_offers where id = source_offer_id for update;
    if offer_row.status <> 'accepted' then raise exception 'offer must be accepted' using errcode = '22023'; end if;
    selected_job_id := offer_row.job_id;
    selected_student_id := offer_row.student_id;
    selected_employer_id := offer_row.employer_id;
  end if;
  if auth.uid() <> selected_employer_id then
    raise exception 'only the employer can confirm engagement terms' using errcode = '42501';
  end if;
  if nullif(trim(agreed_scope), '') is null or cardinality(agreed_deliverables) = 0 then
    raise exception 'scope and deliverables are required' using errcode = '22023';
  end if;

  insert into public.engagements (
    job_id, application_id, offer_id, employer_id, student_id, agreed_scope,
    agreed_deliverables, agreed_start_date, agreed_end_date,
    agreed_compensation_type, agreed_compensation_amount
  ) values (
    selected_job_id, source_application_id, source_offer_id, selected_employer_id,
    selected_student_id, agreed_scope, agreed_deliverables, agreed_start_date,
    agreed_end_date, agreed_compensation_type, agreed_compensation_amount
  ) returning * into result;

  perform set_config('itgu.workflow', 'on', true);
  update public.jobs j
  set status = case
        when (select count(*) from public.engagements e where e.job_id = selected_job_id) >= j.openings
          then 'filled'::public.job_status
        else j.status
      end,
      closed_at = case
        when (select count(*) from public.engagements e where e.job_id = selected_job_id) >= j.openings
          then now()
        else j.closed_at
      end
  where j.id = selected_job_id;
  update public.job_offers o
  set status = 'canceled'
  where o.job_id = selected_job_id
    and o.status = 'pending'
    and exists (select 1 from public.jobs j where j.id = selected_job_id and j.status = 'filled');
  insert into public.idempotency_records (actor_id, operation, idempotency_key, resource_id)
  values (auth.uid(), 'create_engagement', idempotency_key, result.id);
  perform public.notify_once(selected_student_id, 'engagement:' || result.id, 'engagement_created', '업무 조건을 확인해 주세요', '합의된 범위와 보수를 확인해 주세요.', '/student/engagements/' || result.id);
  insert into public.audit_events (actor_id, entity_type, entity_id, event_type, next_state)
  values (auth.uid(), 'engagement', result.id, 'engagement_created', to_jsonb(result));
  return result;
end;
$$;

create or replace function public.start_engagement(engagement_id uuid)
returns public.engagements
language plpgsql
security definer
set search_path = public
as $$
declare result public.engagements;
begin
  perform set_config('itgu.workflow', 'on', true);
  update public.engagements
  set status = 'in_progress'
  where id = engagement_id and employer_id = auth.uid() and status = 'ready'
  returning * into result;
  if result.id is null then raise exception 'engagement cannot be started' using errcode = '22023'; end if;
  perform public.notify_once(result.student_id, 'engagement_started:' || result.id, 'engagement_started', '업무가 시작됐어요', '합의된 일정과 결과물을 확인해 주세요.', '/student/engagements/' || result.id);
  insert into public.audit_events (actor_id, entity_type, entity_id, event_type, next_state)
  values (auth.uid(), 'engagement', result.id, 'engagement_started', to_jsonb(result));
  return result;
end;
$$;

create or replace function public.submit_deliverable(
  target_engagement_id uuid,
  target_title text,
  target_note text,
  target_external_url text,
  target_file_path text,
  request_idempotency_key uuid
)
returns public.engagements
language plpgsql
security definer
set search_path = public
as $$
declare result public.engagements;
begin
  perform public.lock_idempotency('submit_deliverable', request_idempotency_key);
  if exists (
    select 1 from public.engagement_deliverables d
    where d.engagement_id = target_engagement_id
      and d.submitted_by = auth.uid()
      and d.idempotency_key = request_idempotency_key
  ) then
    select * into result from public.engagements where id = target_engagement_id;
    return result;
  end if;
  select * into result from public.engagements where id = target_engagement_id for update;
  if result.student_id <> auth.uid() or result.status not in ('in_progress', 'revision_requested') then
    raise exception 'deliverable cannot be submitted' using errcode = '22023';
  end if;
  if nullif(trim(target_title), '') is null or (target_external_url is null and target_file_path is null) then
    raise exception 'title and deliverable link or file are required' using errcode = '22023';
  end if;
  if target_file_path is not null and split_part(target_file_path, '/', 1) <> auth.uid()::text then
    raise exception 'invalid deliverable path' using errcode = '22023';
  end if;

  insert into public.engagement_deliverables (
    engagement_id, submitted_by, title, note, external_url, file_path, idempotency_key
  ) values (
    target_engagement_id, auth.uid(), target_title, target_note, target_external_url, target_file_path, request_idempotency_key
  ) on conflict (engagement_id, submitted_by, idempotency_key) do nothing;
  perform set_config('itgu.workflow', 'on', true);
  update public.engagements set status = 'submitted' where id = target_engagement_id returning * into result;
  perform public.notify_once(result.employer_id, 'deliverable:' || target_engagement_id || ':' || request_idempotency_key, 'deliverable_submitted', '결과물이 도착했어요', '결과물을 확인하고 완료하거나 수정을 요청해 주세요.', '/employer/engagements/' || result.id);
  insert into public.audit_events (actor_id, entity_type, entity_id, event_type, next_state)
  values (auth.uid(), 'engagement', result.id, 'deliverable_submitted', to_jsonb(result));
  return result;
end;
$$;

create or replace function public.request_revision(engagement_id uuid, revision_note text)
returns public.engagements
language plpgsql
security definer
set search_path = public
as $$
declare result public.engagements;
begin
  if nullif(trim(revision_note), '') is null then raise exception 'revision note required' using errcode = '22023'; end if;
  perform set_config('itgu.workflow', 'on', true);
  update public.engagements set status = 'revision_requested'
  where id = engagement_id and employer_id = auth.uid() and status = 'submitted'
  returning * into result;
  if result.id is null then raise exception 'revision cannot be requested' using errcode = '22023'; end if;
  perform public.notify_once(result.student_id, 'revision:' || result.id || ':' || extract(epoch from result.updated_at)::bigint, 'revision_requested', '수정 요청이 도착했어요', revision_note, '/student/engagements/' || result.id);
  insert into public.audit_events (actor_id, entity_type, entity_id, event_type, metadata, next_state)
  values (auth.uid(), 'engagement', result.id, 'revision_requested', jsonb_build_object('note', revision_note), to_jsonb(result));
  return result;
end;
$$;

create or replace function public.complete_engagement(engagement_id uuid, idempotency_key uuid)
returns public.engagements
language plpgsql
security definer
set search_path = public
as $$
declare result public.engagements;
declare existing_resource uuid;
begin
  perform public.lock_idempotency('complete_engagement', idempotency_key);
  select resource_id into existing_resource from public.idempotency_records
  where actor_id = auth.uid() and operation = 'complete_engagement' and idempotency_records.idempotency_key = complete_engagement.idempotency_key;
  if existing_resource is not null then select * into result from public.engagements where id = existing_resource; return result; end if;

  perform set_config('itgu.workflow', 'on', true);
  update public.engagements set status = 'completed', completed_at = now()
  where id = engagement_id and employer_id = auth.uid() and status = 'submitted'
  returning * into result;
  if result.id is null then raise exception 'engagement cannot be completed' using errcode = '22023'; end if;

  insert into public.student_projects (student_id, source_engagement_id, title, description, skills, project_type, is_public)
  select result.student_id, result.id, j.title, result.agreed_scope,
         coalesce(array_agg(s.name) filter (where s.id is not null), '{}'), 'paid_work', true
  from public.jobs j
  left join public.job_skill_requirements r on r.job_id = j.id
  left join public.skills s on s.id = r.skill_id
  where j.id = result.job_id
  group by j.id, j.title;

  insert into public.idempotency_records (actor_id, operation, idempotency_key, resource_id)
  values (auth.uid(), 'complete_engagement', idempotency_key, result.id);
  perform public.notify_once(result.student_id, 'engagement_completed:' || result.id, 'engagement_completed', '업무가 완료됐어요', '완료 경험이 프로필에 추가됐습니다.', '/student/engagements/' || result.id);
  insert into public.audit_events (actor_id, entity_type, entity_id, event_type, next_state)
  values (auth.uid(), 'engagement', result.id, 'engagement_completed', to_jsonb(result));
  return result;
end;
$$;

create or replace function public.send_message(
  target_conversation_id uuid,
  target_message_type public.message_type,
  target_message_body text,
  target_attachment_path text,
  target_client_message_id uuid
)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare result public.messages;
begin
  if not public.is_conversation_participant(target_conversation_id) then
    raise exception 'conversation access denied' using errcode = '42501';
  end if;
  if exists (select 1 from public.conversations where id = target_conversation_id and closed_at is not null) then
    raise exception 'conversation is closed' using errcode = '22023';
  end if;
  if target_message_type = 'system' then raise exception 'system messages are server only' using errcode = '42501'; end if;
  if target_attachment_path is not null and split_part(target_attachment_path, '/', 1) <> auth.uid()::text then
    raise exception 'invalid attachment path' using errcode = '22023';
  end if;

  insert into public.messages (conversation_id, sender_id, message_type, body, attachment_path, client_message_id)
  values (target_conversation_id, auth.uid(), target_message_type, target_message_body, target_attachment_path, target_client_message_id)
  on conflict (conversation_id, sender_id, client_message_id) do update set body = public.messages.body
  returning * into result;
  update public.conversations set last_message_at = result.created_at where id = target_conversation_id;
  insert into public.notifications (user_id, event_key, notification_type, title, body, deep_link)
  select p.user_id, 'message:' || result.id, 'new_message', '새 메시지가 도착했어요', '대화 내용을 확인해 주세요.', '/messages/' || target_conversation_id
  from public.conversation_participants p
  where p.conversation_id = target_conversation_id and p.user_id <> auth.uid()
  on conflict (user_id, event_key) do nothing;
  return result;
end;
$$;

create or replace function public.create_review(
  target_engagement_id uuid,
  target_rating smallint,
  target_feedback text,
  target_verified_skill_ids uuid[],
  target_would_work_again boolean,
  target_visibility public.review_visibility,
  request_idempotency_key uuid
)
returns public.reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  engagement_row public.engagements;
  review_direction public.review_direction;
  target_user uuid;
  result public.reviews;
  existing_resource uuid;
begin
  perform public.lock_idempotency('create_review', request_idempotency_key);
  select resource_id into existing_resource from public.idempotency_records
  where actor_id = auth.uid() and operation = 'create_review' and idempotency_records.idempotency_key = request_idempotency_key;
  if existing_resource is not null then select * into result from public.reviews where id = existing_resource; return result; end if;

  select * into engagement_row from public.engagements where id = target_engagement_id;
  if engagement_row.status <> 'completed' then raise exception 'completed engagement required' using errcode = '22023'; end if;
  if auth.uid() = engagement_row.employer_id then
    review_direction := 'employer_to_student'; target_user := engagement_row.student_id;
  elsif auth.uid() = engagement_row.student_id then
    review_direction := 'student_to_employer'; target_user := engagement_row.employer_id;
  else
    raise exception 'review access denied' using errcode = '42501';
  end if;

  insert into public.reviews (
    engagement_id, reviewer_id, reviewee_id, direction, rating, feedback,
    verified_skill_ids, would_work_again, visibility, idempotency_key
  ) values (
    target_engagement_id, auth.uid(), target_user, review_direction, target_rating, target_feedback,
    coalesce(target_verified_skill_ids, '{}'), target_would_work_again, target_visibility, request_idempotency_key
  ) returning * into result;

  insert into public.idempotency_records (actor_id, operation, idempotency_key, resource_id)
  values (auth.uid(), 'create_review', request_idempotency_key, result.id);
  perform public.notify_once(target_user, 'review:' || result.id, 'review_created', '새 평가가 등록됐어요', '완료한 업무의 평가를 확인해 주세요.', '/reviews/' || result.id);
  return result;
end;
$$;

revoke all on function public.lock_idempotency(text, uuid) from public;
revoke all on function public.notify_once(uuid, text, text, text, text, text) from public;
revoke all on function public.onboard_employer(text, text, text, text, text, text, text, text) from public;
revoke all on function public.submit_employer_verification(text) from public;
revoke all on function public.validate_job_for_publish(uuid) from public;
revoke all on function public.publish_job(uuid, uuid) from public;
revoke all on function public.change_job_status(uuid, public.job_status) from public;
revoke all on function public.apply_to_job(uuid, text, uuid) from public;
revoke all on function public.get_or_create_application_conversation(uuid) from public;
revoke all on function public.change_application_status(uuid, public.application_status, uuid) from public;
revoke all on function public.send_job_offer(uuid, uuid, text, text, timestamptz, uuid) from public;
revoke all on function public.respond_to_offer(uuid, boolean, uuid) from public;
revoke all on function public.create_engagement(uuid, uuid, text, text[], date, date, public.compensation_type, integer, uuid) from public;
revoke all on function public.start_engagement(uuid) from public;
revoke all on function public.submit_deliverable(uuid, text, text, text, text, uuid) from public;
revoke all on function public.request_revision(uuid, text) from public;
revoke all on function public.complete_engagement(uuid, uuid) from public;
revoke all on function public.send_message(uuid, public.message_type, text, text, uuid) from public;
revoke all on function public.create_review(uuid, smallint, text, uuid[], boolean, public.review_visibility, uuid) from public;

grant execute on function public.onboard_employer(text, text, text, text, text, text, text, text) to authenticated;
grant execute on function public.submit_employer_verification(text) to authenticated;
grant execute on function public.validate_job_for_publish(uuid) to authenticated;
grant execute on function public.publish_job(uuid, uuid) to authenticated;
grant execute on function public.change_job_status(uuid, public.job_status) to authenticated;
grant execute on function public.apply_to_job(uuid, text, uuid) to authenticated;
grant execute on function public.change_application_status(uuid, public.application_status, uuid) to authenticated;
grant execute on function public.send_job_offer(uuid, uuid, text, text, timestamptz, uuid) to authenticated;
grant execute on function public.respond_to_offer(uuid, boolean, uuid) to authenticated;
grant execute on function public.create_engagement(uuid, uuid, text, text[], date, date, public.compensation_type, integer, uuid) to authenticated;
grant execute on function public.start_engagement(uuid) to authenticated;
grant execute on function public.submit_deliverable(uuid, text, text, text, text, uuid) to authenticated;
grant execute on function public.request_revision(uuid, text) to authenticated;
grant execute on function public.complete_engagement(uuid, uuid) to authenticated;
grant execute on function public.send_message(uuid, public.message_type, text, text, uuid) to authenticated;
grant execute on function public.create_review(uuid, smallint, text, uuid[], boolean, public.review_visibility, uuid) to authenticated;
