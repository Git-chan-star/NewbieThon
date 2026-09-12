create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.guard_server_managed_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(current_setting('itgu.workflow', true), 'off') = 'on' then
    return new;
  end if;

  if tg_table_name in ('jobs', 'applications', 'job_offers', 'engagements')
     and old.status is distinct from new.status then
    raise exception 'status must be changed through a workflow RPC' using errcode = '42501';
  end if;
  if tg_table_name in ('employer_profiles', 'organizations')
     and old.verification_status is distinct from new.verification_status then
    raise exception 'verification status is server managed' using errcode = '42501';
  end if;
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'users', 'student_profiles', 'organizations', 'employer_profiles',
    'student_skills', 'student_courses', 'student_projects', 'jobs',
    'applications', 'job_offers', 'conversations', 'engagements', 'reports'
  ] loop
    execute format(
      'create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name,
      table_name
    );
  end loop;
end;
$$;

create trigger jobs_guard_server_fields before update on public.jobs
for each row execute function public.guard_server_managed_fields();
create trigger applications_guard_server_fields before update on public.applications
for each row execute function public.guard_server_managed_fields();
create trigger offers_guard_server_fields before update on public.job_offers
for each row execute function public.guard_server_managed_fields();
create trigger engagements_guard_server_fields before update on public.engagements
for each row execute function public.guard_server_managed_fields();
create trigger employer_profiles_guard_server_fields before update on public.employer_profiles
for each row execute function public.guard_server_managed_fields();
create trigger organizations_guard_server_fields before update on public.organizations
for each row execute function public.guard_server_managed_fields();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_role public.app_role;
  selected_name text;
begin
  selected_role := coalesce(new.raw_user_meta_data ->> 'role', '')::public.app_role;
  if selected_role = 'admin' then
    raise exception 'admin role cannot be selected during signup';
  end if;

  selected_name := nullif(trim(new.raw_user_meta_data ->> 'display_name'), '');
  if selected_name is null then
    raise exception 'display_name is required';
  end if;

  insert into public.users (id, role, display_name)
  values (new.id, selected_role, selected_name);

  if selected_role = 'student' then
    insert into public.student_profiles (user_id) values (new.id);
  end if;

  return new;
exception
  when invalid_text_representation then
    raise exception 'role must be student or employer';
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid() and is_active = true
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() = 'admin', false)
$$;

create or replace function public.is_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_organization_id
      and user_id = auth.uid()
  )
$$;

create or replace function public.organization_has_members(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members where organization_id = target_organization_id
  )
$$;

create or replace function public.is_employer_for_job(target_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.jobs j
    where j.id = target_job_id
      and (j.employer_id = auth.uid() or public.is_org_member(j.organization_id))
  )
$$;

create or replace function public.is_conversation_participant(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_participants
    where conversation_id = target_conversation_id
      and user_id = auth.uid()
  )
$$;

create or replace function public.is_engagement_party(target_engagement_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.engagements
    where id = target_engagement_id
      and auth.uid() in (student_id, employer_id)
  )
$$;

revoke all on function public.current_role() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.organization_has_members(uuid) from public;
revoke all on function public.is_employer_for_job(uuid) from public;
revoke all on function public.is_conversation_participant(uuid) from public;
revoke all on function public.is_engagement_party(uuid) from public;
grant execute on function public.current_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.organization_has_members(uuid) to authenticated;
grant execute on function public.is_employer_for_job(uuid) to authenticated;
grant execute on function public.is_conversation_participant(uuid) to authenticated;
grant execute on function public.is_engagement_party(uuid) to authenticated;

alter table public.users enable row level security;
alter table public.student_profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.employer_profiles enable row level security;
alter table public.skills enable row level security;
alter table public.student_skills enable row level security;
alter table public.student_courses enable row level security;
alter table public.student_projects enable row level security;
alter table public.jobs enable row level security;
alter table public.job_skill_requirements enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.applications enable row level security;
alter table public.job_offers enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.engagements enable row level security;
alter table public.engagement_deliverables enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.audit_events enable row level security;
alter table public.idempotency_records enable row level security;

create policy users_read_active on public.users
for select to authenticated
using (is_active = true or id = auth.uid() or public.is_admin());

create policy users_update_self on public.users
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role = public.current_role());

create policy student_profiles_read on public.student_profiles
for select to authenticated
using (user_id = auth.uid() or discoverable = true or public.is_admin());

create policy student_profiles_update_self on public.student_profiles
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy organizations_read_active on public.organizations
for select to authenticated
using (is_active = true or public.is_admin());

create policy organizations_create_employer on public.organizations
for insert to authenticated
with check (public.current_role() = 'employer');

create policy organizations_update_member on public.organizations
for update to authenticated
using (public.is_org_member(id) or public.is_admin())
with check (public.is_org_member(id) or public.is_admin());

create policy organization_members_read_related on public.organization_members
for select to authenticated
using (user_id = auth.uid() or public.is_org_member(organization_id) or public.is_admin());

create policy organization_members_create_owner on public.organization_members
for insert to authenticated
with check (
  public.is_admin()
  or (
    user_id = auth.uid()
    and public.current_role() = 'employer'
    and not public.organization_has_members(organization_id)
  )
);

create policy employer_profiles_read_self on public.employer_profiles
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy employer_profiles_create_self on public.employer_profiles
for insert to authenticated
with check (
  user_id = auth.uid()
  and public.current_role() = 'employer'
  and public.is_org_member(organization_id)
);

create policy employer_profiles_update_self on public.employer_profiles
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid() and public.is_org_member(organization_id));

create policy skills_read on public.skills for select to authenticated using (true);
create policy skills_admin_write on public.skills for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy student_skills_read on public.student_skills
for select to authenticated
using (
  student_id = auth.uid()
  or exists (select 1 from public.student_profiles p where p.user_id = student_id and p.discoverable = true)
  or public.is_admin()
);
create policy student_skills_write_self on public.student_skills
for all to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());

create policy student_courses_read on public.student_courses
for select to authenticated
using (
  student_id = auth.uid()
  or (is_public and exists (select 1 from public.student_profiles p where p.user_id = student_id and p.discoverable = true))
  or public.is_admin()
);
create policy student_courses_write_self on public.student_courses
for all to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());

create policy student_projects_read on public.student_projects
for select to authenticated
using (
  student_id = auth.uid()
  or (is_public and exists (select 1 from public.student_profiles p where p.user_id = student_id and p.discoverable = true))
  or public.is_admin()
);
create policy student_projects_write_self on public.student_projects
for all to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid() and project_type <> 'paid_work');

create policy jobs_read on public.jobs
for select to authenticated
using (
  (status = 'published' and apply_deadline > now())
  or employer_id = auth.uid()
  or public.is_org_member(organization_id)
  or public.is_admin()
  or exists (select 1 from public.applications a where a.job_id = id and a.student_id = auth.uid())
  or exists (select 1 from public.job_offers o where o.job_id = id and o.student_id = auth.uid())
);

create policy jobs_create_employer on public.jobs
for insert to authenticated
with check (
  employer_id = auth.uid()
  and public.current_role() = 'employer'
  and public.is_org_member(organization_id)
  and status = 'draft'
);

create policy jobs_update_owner on public.jobs
for update to authenticated
using ((employer_id = auth.uid() and status = 'draft') or public.is_admin())
with check ((employer_id = auth.uid() and status = 'draft') or public.is_admin());

create policy job_skills_read on public.job_skill_requirements
for select to authenticated
using (exists (select 1 from public.jobs j where j.id = job_id));

create policy job_skills_owner_write on public.job_skill_requirements
for all to authenticated
using (
  public.is_admin()
  or exists (select 1 from public.jobs j where j.id = job_id and j.employer_id = auth.uid() and j.status = 'draft')
)
with check (
  public.is_admin()
  or exists (select 1 from public.jobs j where j.id = job_id and j.employer_id = auth.uid() and j.status = 'draft')
);

create policy saved_jobs_self on public.saved_jobs
for all to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());

create policy applications_read_parties on public.applications
for select to authenticated
using (student_id = auth.uid() or public.is_employer_for_job(job_id) or public.is_admin());

create policy applications_create_student on public.applications
for insert to authenticated
with check (
  student_id = auth.uid()
  and public.current_role() = 'student'
  and exists (
    select 1 from public.jobs j
    where j.id = job_id
      and j.status = 'published'
      and j.apply_deadline > now()
      and j.employer_id <> auth.uid()
  )
);

create policy offers_read_parties on public.job_offers
for select to authenticated
using (student_id = auth.uid() or employer_id = auth.uid() or public.is_admin());

create policy conversations_read_participant on public.conversations
for select to authenticated
using (public.is_conversation_participant(id) or public.is_admin());

create policy conversation_participants_read on public.conversation_participants
for select to authenticated
using (public.is_conversation_participant(conversation_id) or public.is_admin());

create policy messages_read_participant on public.messages
for select to authenticated
using (public.is_conversation_participant(conversation_id) or public.is_admin());

create policy engagements_read_parties on public.engagements
for select to authenticated
using (student_id = auth.uid() or employer_id = auth.uid() or public.is_admin());

create policy deliverables_read_parties on public.engagement_deliverables
for select to authenticated
using (public.is_engagement_party(engagement_id) or public.is_admin());

create policy reviews_read on public.reviews
for select to authenticated
using (
  reviewer_id = auth.uid()
  or reviewee_id = auth.uid()
  or (visibility = 'profile' and is_hidden = false)
  or public.is_admin()
);

create policy notifications_self_read on public.notifications
for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy notifications_self_update on public.notifications
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy reports_create on public.reports
for insert to authenticated
with check (reporter_id = auth.uid());
create policy reports_read on public.reports
for select to authenticated
using (reporter_id = auth.uid() or public.is_admin());
create policy reports_admin_update on public.reports
for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy audit_admin_read on public.audit_events
for select to authenticated using (public.is_admin());

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant select, insert, update, delete on storage.objects to authenticated;
grant select on storage.buckets to authenticated;

revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;
