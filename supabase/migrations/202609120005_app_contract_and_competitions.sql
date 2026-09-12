create type public.competition_status as enum ('draft', 'published', 'closed');
create type public.team_status as enum ('recruiting', 'full', 'closed');
create type public.team_application_status as enum ('pending', 'accepted', 'rejected', 'withdrawn');

alter table public.users alter column role drop not null;
alter table public.users add column onboarding_completed boolean not null default false;

alter table public.student_profiles
  add column preferred_job_categories text[] not null default '{}',
  add column available_days text[] not null default '{}',
  add column profile_completion smallint not null default 0 check (profile_completion between 0 and 100);

alter table public.applications
  add column available_start_date date,
  add column availability_note text check (char_length(availability_note) <= 1000),
  add column short_answer text check (char_length(short_answer) <= 2000);

alter table public.student_projects
  drop constraint if exists student_projects_project_type_check,
  add column role_description text,
  add column repository_url text,
  add column image_urls text[] not null default '{}',
  add column starts_on date,
  add column ends_on date,
  add constraint student_projects_project_type_check
    check (project_type in ('class', 'personal', 'club', 'competition', 'paid_work')),
  add constraint student_projects_dates_check
    check (ends_on is null or starts_on is null or ends_on >= starts_on);

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.users(id) on delete set null,
  title text not null check (char_length(title) between 1 and 180),
  organizer_name text not null check (char_length(organizer_name) between 1 and 120),
  summary text not null check (char_length(summary) between 1 and 500),
  description text check (char_length(description) <= 5000),
  categories text[] not null default '{}',
  required_skills text[] not null default '{}',
  location text,
  starts_at timestamptz,
  ends_at timestamptz,
  application_deadline timestamptz,
  source_url text,
  status public.competition_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table public.competition_teams (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  leader_id uuid not null references public.student_profiles(user_id) on delete restrict,
  name text not null check (char_length(name) between 1 and 80),
  introduction text not null check (char_length(introduction) between 1 and 1500),
  status public.team_status not null default 'recruiting',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.team_role_openings (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.competition_teams(id) on delete cascade,
  role_name text not null check (char_length(role_name) between 1 and 80),
  description text check (char_length(description) <= 1000),
  skill_names text[] not null default '{}',
  headcount smallint not null default 1 check (headcount between 1 and 20),
  filled_count smallint not null default 0 check (filled_count >= 0 and filled_count <= headcount),
  created_at timestamptz not null default now()
);

create table public.team_members (
  team_id uuid not null references public.competition_teams(id) on delete cascade,
  student_id uuid not null references public.student_profiles(user_id) on delete restrict,
  opening_id uuid references public.team_role_openings(id) on delete set null,
  member_role text not null default 'member' check (member_role in ('leader', 'member')),
  joined_at timestamptz not null default now(),
  primary key (team_id, student_id)
);

create table public.team_applications (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.competition_teams(id) on delete cascade,
  opening_id uuid not null references public.team_role_openings(id) on delete restrict,
  student_id uuid not null references public.student_profiles(user_id) on delete restrict,
  message text not null check (char_length(message) between 1 and 1500),
  status public.team_application_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, student_id)
);

alter table public.conversations
  drop constraint if exists conversations_check,
  add column team_id uuid unique references public.competition_teams(id) on delete restrict,
  add constraint conversations_source_check check (num_nonnulls(application_id, offer_id, team_id) = 1);

create index competitions_discovery_idx on public.competitions(status, application_deadline, published_at desc);
create index competition_teams_discovery_idx on public.competition_teams(competition_id, status, created_at desc);
create index team_applications_team_idx on public.team_applications(team_id, status, created_at desc);

create trigger competitions_set_updated_at before update on public.competitions
for each row execute function public.set_updated_at();
create trigger competition_teams_set_updated_at before update on public.competition_teams
for each row execute function public.set_updated_at();
create trigger team_applications_set_updated_at before update on public.team_applications
for each row execute function public.set_updated_at();

create or replace function public.set_student_profile_completion()
returns trigger
language plpgsql
set search_path = public
as $$
declare score smallint := 0;
begin
  if nullif(trim(coalesce(new.school, '')), '') is not null and nullif(trim(coalesce(new.major, '')), '') is not null then score := score + 25; end if;
  if cardinality(new.interests) > 0 then score := score + 15; end if;
  if exists (select 1 from public.student_skills where student_id = new.user_id) then score := score + 25; end if;
  if cardinality(new.preferred_job_categories) > 0 and cardinality(new.work_modes) > 0 then score := score + 20; end if;
  if exists (select 1 from public.student_projects where student_id = new.user_id) then score := score + 15; end if;
  new.profile_completion := score;
  return new;
end;
$$;

create trigger student_profiles_calculate_completion before update on public.student_profiles
for each row execute function public.set_student_profile_completion();

create or replace function public.refresh_student_profile_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare target_student_id uuid;
begin
  target_student_id := case when tg_op = 'DELETE' then old.student_id else new.student_id end;
  update public.student_profiles set profile_completion = profile_completion where user_id = target_student_id;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger student_skills_refresh_completion after insert or update or delete on public.student_skills
for each row execute function public.refresh_student_profile_completion();
create trigger student_projects_refresh_completion after insert or update or delete on public.student_projects
for each row execute function public.refresh_student_profile_completion();

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
  selected_name := nullif(trim(new.raw_user_meta_data ->> 'display_name'), '');
  if selected_name is null then
    raise exception 'display_name is required';
  end if;

  if nullif(new.raw_user_meta_data ->> 'role', '') is not null then
    selected_role := (new.raw_user_meta_data ->> 'role')::public.app_role;
    if selected_role = 'admin' then
      raise exception 'admin role cannot be selected during signup';
    end if;
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

create or replace function public.select_role(selected_role public.app_role)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare result public.users;
begin
  if selected_role = 'admin' then
    raise exception 'admin role cannot be selected' using errcode = '42501';
  end if;
  update public.users set role = selected_role
  where id = auth.uid() and role is null
  returning * into result;
  if result.id is null then
    raise exception 'role is already selected or user not found' using errcode = '22023';
  end if;
  if selected_role = 'student' then
    insert into public.student_profiles (user_id) values (auth.uid()) on conflict do nothing;
  end if;
  return result;
end;
$$;

create or replace function public.complete_onboarding()
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare result public.users;
begin
  update public.users set onboarding_completed = true
  where id = auth.uid() and role is not null
  returning * into result;
  if result.id is null then raise exception 'user not found' using errcode = 'P0002'; end if;
  return result;
end;
$$;

create or replace function public.create_competition_team(
  target_competition_id uuid,
  team_name text,
  team_introduction text,
  role_openings jsonb
)
returns public.competition_teams
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.competition_teams;
  opening jsonb;
  conversation_id uuid;
begin
  if public.current_role() <> 'student' then raise exception 'student role required' using errcode = '42501'; end if;
  if not exists (
    select 1 from public.competitions
    where id = target_competition_id and status = 'published'
      and (application_deadline is null or application_deadline > now())
  ) then raise exception 'competition is not recruiting' using errcode = '22023'; end if;
  if jsonb_array_length(role_openings) = 0 then raise exception 'at least one opening is required' using errcode = '22023'; end if;

  insert into public.competition_teams (competition_id, leader_id, name, introduction)
  values (target_competition_id, auth.uid(), trim(team_name), trim(team_introduction)) returning * into result;
  insert into public.team_members (team_id, student_id, member_role) values (result.id, auth.uid(), 'leader');

  for opening in select * from jsonb_array_elements(role_openings) loop
    insert into public.team_role_openings (team_id, role_name, description, skill_names, headcount)
    values (
      result.id,
      opening ->> 'roleName',
      opening ->> 'description',
      coalesce(array(select jsonb_array_elements_text(opening -> 'skillNames')), '{}'),
      coalesce((opening ->> 'headcount')::smallint, 1)
    );
  end loop;

  insert into public.conversations (team_id) values (result.id) returning id into conversation_id;
  insert into public.conversation_participants (conversation_id, user_id) values (conversation_id, auth.uid());
  return result;
end;
$$;

create or replace function public.apply_to_team(target_opening_id uuid, application_message text)
returns public.team_applications
language plpgsql
security definer
set search_path = public
as $$
declare opening public.team_role_openings; team public.competition_teams; result public.team_applications;
begin
  if public.current_role() <> 'student' then raise exception 'student role required' using errcode = '42501'; end if;
  select * into opening from public.team_role_openings where id = target_opening_id;
  select * into team from public.competition_teams where id = opening.team_id;
  if team.id is null or team.status <> 'recruiting' or opening.filled_count >= opening.headcount then
    raise exception 'opening is not recruiting' using errcode = '22023';
  end if;
  if team.leader_id = auth.uid() then raise exception 'leader cannot apply' using errcode = '22023'; end if;
  insert into public.team_applications (team_id, opening_id, student_id, message)
  values (team.id, opening.id, auth.uid(), trim(application_message)) returning * into result;
  perform public.notify_once(team.leader_id, 'team_application:' || result.id, 'new_team_application',
    '새 팀 지원자가 있어요', team.name || ' 팀 지원을 확인해 주세요.', '/student/team/' || team.id || '/applications');
  return result;
end;
$$;

create or replace function public.apply_to_job_v2(
  target_job_id uuid,
  application_available_start date,
  application_availability_note text,
  application_short_answer text,
  idempotency_key uuid
)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare result public.applications;
begin
  result := public.apply_to_job(target_job_id, application_short_answer, idempotency_key);
  update public.applications
  set available_start_date = application_available_start,
      availability_note = application_availability_note,
      short_answer = application_short_answer
  where id = result.id returning * into result;
  return result;
end;
$$;

create or replace function public.withdraw_application(target_application_id uuid)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare result public.applications;
begin
  perform set_config('newbiethon.workflow', 'on', true);
  update public.applications set status = 'withdrawn'
  where id = target_application_id and student_id = auth.uid()
    and status in ('submitted', 'viewed', 'chatting', 'interview')
  returning * into result;
  if result.id is null then raise exception 'application cannot be withdrawn' using errcode = '22023'; end if;
  return result;
end;
$$;

create or replace function public.respond_to_team_application(target_application_id uuid, accept_application boolean)
returns public.team_applications
language plpgsql
security definer
set search_path = public
as $$
declare application public.team_applications; team public.competition_teams; opening public.team_role_openings;
  result public.team_applications; conversation_id uuid;
begin
  select * into application from public.team_applications where id = target_application_id for update;
  select * into team from public.competition_teams where id = application.team_id;
  select * into opening from public.team_role_openings where id = application.opening_id for update;
  if team.leader_id <> auth.uid() then raise exception 'team leader required' using errcode = '42501'; end if;
  if application.status <> 'pending' then raise exception 'application already processed' using errcode = '22023'; end if;
  if accept_application and opening.filled_count >= opening.headcount then raise exception 'opening is full' using errcode = '22023'; end if;

  update public.team_applications set status = (case when accept_application then 'accepted' else 'rejected' end)::public.team_application_status
  where id = target_application_id returning * into result;
  if accept_application then
    insert into public.team_members (team_id, student_id, opening_id) values (team.id, application.student_id, opening.id);
    update public.team_role_openings set filled_count = filled_count + 1 where id = opening.id;
    select id into conversation_id from public.conversations where team_id = team.id;
    insert into public.conversation_participants (conversation_id, user_id) values (conversation_id, application.student_id) on conflict do nothing;
    if not exists (select 1 from public.team_role_openings where team_id = team.id and filled_count < headcount) then
      update public.competition_teams set status = 'full' where id = team.id;
    end if;
  end if;
  perform public.notify_once(application.student_id, 'team_application_result:' || application.id,
    'team_application_result', '팀 지원 결과가 도착했어요', team.name || ' 팀에서 결과를 확인해 주세요.', '/student/team/' || team.id);
  return result;
end;
$$;

create or replace function public.accept_application_and_create_engagement(
  target_application_id uuid,
  application_status_key uuid,
  engagement_key uuid
)
returns public.engagements
language plpgsql
security definer
set search_path = public
as $$
declare application_row public.applications; job_row public.jobs; result public.engagements;
begin
  select * into application_row from public.applications where id = target_application_id;
  select * into job_row from public.jobs where id = application_row.job_id;
  perform public.change_application_status(target_application_id, 'accepted', application_status_key);
  select * into result from public.create_engagement(
    target_application_id,
    null,
    coalesce(job_row.summary, job_row.title),
    job_row.deliverables,
    job_row.starts_on,
    job_row.ends_on,
    coalesce(job_row.compensation_type, 'negotiable'),
    job_row.compensation_min,
    engagement_key
  );
  return result;
end;
$$;

alter table public.competitions enable row level security;
alter table public.competition_teams enable row level security;
alter table public.team_role_openings enable row level security;
alter table public.team_members enable row level security;
alter table public.team_applications enable row level security;

grant select, insert, update, delete on public.competitions, public.competition_teams,
  public.team_role_openings, public.team_members, public.team_applications to authenticated;

create policy competitions_read on public.competitions for select to authenticated
using (status = 'published' or created_by = auth.uid() or public.is_admin());
create policy competitions_create on public.competitions for insert to authenticated
with check (created_by = auth.uid() and public.current_role() = 'employer' or public.is_admin());
create policy competitions_update on public.competitions for update to authenticated
using (created_by = auth.uid() or public.is_admin()) with check (created_by = auth.uid() or public.is_admin());
create policy competition_teams_read on public.competition_teams for select to authenticated using (true);
create policy team_openings_read on public.team_role_openings for select to authenticated using (true);
create policy team_members_read on public.team_members for select to authenticated using (true);
create policy team_applications_read on public.team_applications for select to authenticated
using (student_id = auth.uid() or exists (select 1 from public.competition_teams t where t.id = team_id and t.leader_id = auth.uid()) or public.is_admin());

revoke all on function public.select_role(public.app_role) from public;
revoke all on function public.complete_onboarding() from public;
revoke all on function public.create_competition_team(uuid, text, text, jsonb) from public;
revoke all on function public.apply_to_team(uuid, text) from public;
revoke all on function public.respond_to_team_application(uuid, boolean) from public;
revoke all on function public.accept_application_and_create_engagement(uuid, uuid, uuid) from public;
revoke all on function public.apply_to_job_v2(uuid, date, text, text, uuid) from public;
revoke all on function public.withdraw_application(uuid) from public;
grant execute on function public.select_role(public.app_role) to authenticated;
grant execute on function public.complete_onboarding() to authenticated;
grant execute on function public.create_competition_team(uuid, text, text, jsonb) to authenticated;
grant execute on function public.apply_to_team(uuid, text) to authenticated;
grant execute on function public.respond_to_team_application(uuid, boolean) to authenticated;
grant execute on function public.accept_application_and_create_engagement(uuid, uuid, uuid) to authenticated;
grant execute on function public.apply_to_job_v2(uuid, date, text, text, uuid) to authenticated;
grant execute on function public.withdraw_application(uuid) to authenticated;
