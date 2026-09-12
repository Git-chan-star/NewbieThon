create extension if not exists pgcrypto;

create type public.app_role as enum ('student', 'employer', 'admin');
create type public.verification_status as enum ('unverified', 'pending', 'verified', 'rejected');
create type public.job_status as enum ('draft', 'published', 'paused', 'closed', 'filled');
create type public.application_status as enum ('submitted', 'viewed', 'chatting', 'interview', 'accepted', 'rejected', 'withdrawn');
create type public.offer_status as enum ('pending', 'accepted', 'declined', 'expired', 'canceled');
create type public.work_mode as enum ('remote', 'onsite', 'hybrid');
create type public.compensation_type as enum ('hourly', 'daily', 'fixed', 'monthly', 'negotiable');
create type public.skill_level as enum ('learning', 'basic', 'independent', 'advanced');
create type public.engagement_status as enum ('ready', 'in_progress', 'submitted', 'revision_requested', 'completed', 'canceled', 'disputed');
create type public.payment_status as enum ('not_recorded', 'scheduled', 'reported_paid');
create type public.message_type as enum ('text', 'file', 'system');
create type public.review_direction as enum ('employer_to_student', 'student_to_employer');
create type public.review_visibility as enum ('private', 'profile', 'anonymous_summary');
create type public.report_status as enum ('received', 'reviewing', 'resolved', 'dismissed');

create table public.users (
  id uuid primary key references auth.users(id) on delete restrict,
  role public.app_role not null,
  display_name text not null check (char_length(display_name) between 1 and 80),
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.student_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  school text,
  major text,
  school_year smallint check (school_year between 1 and 8),
  introduction text check (char_length(introduction) <= 1000),
  interests text[] not null default '{}',
  available_hours_per_week smallint check (available_hours_per_week between 0 and 80),
  available_from date,
  work_modes public.work_mode[] not null default '{}',
  discoverable boolean not null default false,
  verification_status public.verification_status not null default 'unverified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  organization_type text not null,
  industry text,
  introduction text check (char_length(introduction) <= 1500),
  logo_url text,
  verification_status public.verification_status not null default 'unverified',
  verification_note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  member_role text not null default 'recruiter' check (member_role in ('owner', 'manager', 'recruiter')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.employer_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  contact_name text not null,
  position text,
  work_email text not null,
  contact_hours text,
  verification_status public.verification_status not null default 'unverified',
  verification_document_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text generated always as (lower(trim(name))) stored unique,
  category text,
  created_at timestamptz not null default now()
);

create table public.student_skills (
  student_id uuid not null references public.student_profiles(user_id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete restrict,
  level public.skill_level not null default 'learning',
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (student_id, skill_id)
);

create table public.student_courses (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student_profiles(user_id) on delete cascade,
  name text not null,
  provider text,
  completed_at date,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.student_projects (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student_profiles(user_id) on delete cascade,
  source_engagement_id uuid,
  title text not null,
  description text,
  project_url text,
  skills text[] not null default '{}',
  project_type text not null default 'personal' check (project_type in ('personal', 'course', 'team', 'paid_work')),
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  employer_id uuid not null references public.employer_profiles(user_id) on delete restrict,
  title text not null default '' check (char_length(title) <= 150),
  category text,
  summary text check (char_length(summary) <= 500),
  tasks text[] not null default '{}',
  deliverables text[] not null default '{}',
  provided_resources text[] not null default '{}',
  difficulty public.skill_level not null default 'learning',
  no_specific_skill boolean not null default false,
  beginner_friendly boolean not null default true,
  feedback_provided boolean not null default false,
  work_mode public.work_mode,
  location text,
  starts_on date,
  ends_on date,
  estimated_total_hours smallint check (estimated_total_hours between 1 and 2000),
  weekly_hours smallint check (weekly_hours between 1 and 80),
  openings smallint not null default 1 check (openings between 1 and 100),
  apply_deadline timestamptz,
  compensation_type public.compensation_type,
  compensation_min integer check (compensation_min >= 0),
  compensation_max integer check (compensation_max >= 0),
  payment_timing text,
  status public.job_status not null default 'draft',
  published_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on),
  check (compensation_max is null or compensation_min is null or compensation_max >= compensation_min),
  check (work_mode not in ('onsite', 'hybrid') or nullif(trim(location), '') is not null)
);

create table public.job_skill_requirements (
  job_id uuid not null references public.jobs(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete restrict,
  minimum_level public.skill_level not null default 'learning',
  is_required boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (job_id, skill_id)
);

create table public.saved_jobs (
  student_id uuid not null references public.student_profiles(user_id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, job_id)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete restrict,
  student_id uuid not null references public.student_profiles(user_id) on delete restrict,
  message text check (char_length(message) <= 2000),
  profile_snapshot jsonb not null default '{}'::jsonb,
  status public.application_status not null default 'submitted',
  viewed_at timestamptz,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, student_id)
);

create table public.job_offers (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete restrict,
  employer_id uuid not null references public.employer_profiles(user_id) on delete restrict,
  student_id uuid not null references public.student_profiles(user_id) on delete restrict,
  reason text not null check (char_length(reason) between 1 and 1000),
  message text check (char_length(message) <= 2000),
  expires_at timestamptz not null,
  status public.offer_status not null default 'pending',
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, student_id)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete restrict,
  application_id uuid unique references public.applications(id) on delete restrict,
  offer_id uuid unique references public.job_offers(id) on delete restrict,
  last_message_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(application_id, offer_id) = 1)
);

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  last_read_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete restrict,
  message_type public.message_type not null default 'text',
  body text check (char_length(body) <= 4000),
  attachment_path text,
  client_message_id uuid not null,
  created_at timestamptz not null default now(),
  check (message_type = 'system' or nullif(trim(coalesce(body, '')), '') is not null or attachment_path is not null),
  unique (conversation_id, sender_id, client_message_id)
);

create table public.engagements (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete restrict,
  application_id uuid references public.applications(id) on delete restrict,
  offer_id uuid references public.job_offers(id) on delete restrict,
  employer_id uuid not null references public.employer_profiles(user_id) on delete restrict,
  student_id uuid not null references public.student_profiles(user_id) on delete restrict,
  status public.engagement_status not null default 'ready',
  agreed_scope text not null,
  agreed_deliverables text[] not null default '{}',
  agreed_start_date date,
  agreed_end_date date,
  agreed_compensation_type public.compensation_type not null,
  agreed_compensation_amount integer check (agreed_compensation_amount >= 0),
  payment_status public.payment_status not null default 'not_recorded',
  completed_at timestamptz,
  canceled_by uuid references public.users(id),
  cancellation_reason text,
  dispute_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(application_id, offer_id) = 1),
  check (agreed_end_date is null or agreed_start_date is null or agreed_end_date >= agreed_start_date)
);

create unique index engagements_application_unique on public.engagements(application_id) where application_id is not null;
create unique index engagements_offer_unique on public.engagements(offer_id) where offer_id is not null;

alter table public.student_projects
  add constraint student_projects_source_engagement_fk
  foreign key (source_engagement_id) references public.engagements(id) on delete set null;

create table public.engagement_deliverables (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.engagements(id) on delete cascade,
  submitted_by uuid not null references public.users(id) on delete restrict,
  title text not null,
  note text check (char_length(note) <= 3000),
  external_url text,
  file_path text,
  idempotency_key uuid not null,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (engagement_id, submitted_by, idempotency_key)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.engagements(id) on delete restrict,
  reviewer_id uuid not null references public.users(id) on delete restrict,
  reviewee_id uuid not null references public.users(id) on delete restrict,
  direction public.review_direction not null,
  rating smallint check (rating between 1 and 5),
  feedback text check (char_length(feedback) <= 2000),
  verified_skill_ids uuid[] not null default '{}',
  would_work_again boolean,
  visibility public.review_visibility not null default 'private',
  is_hidden boolean not null default false,
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  unique (engagement_id, direction),
  unique (reviewer_id, idempotency_key),
  check (reviewer_id <> reviewee_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  event_key text not null,
  notification_type text not null,
  title text not null,
  body text not null,
  deep_link text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, event_key)
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references public.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  event_type text not null,
  previous_state jsonb,
  next_state jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.idempotency_records (
  id bigint generated always as identity primary key,
  actor_id uuid not null references public.users(id) on delete cascade,
  operation text not null,
  idempotency_key uuid not null,
  resource_id uuid not null,
  created_at timestamptz not null default now(),
  unique (actor_id, operation, idempotency_key)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete restrict,
  target_type text not null check (target_type in ('user', 'job', 'message', 'engagement')),
  target_id uuid not null,
  reason_code text not null,
  detail text check (char_length(detail) <= 2000),
  selected_message_ids uuid[] not null default '{}',
  status public.report_status not null default 'received',
  assigned_admin_id uuid references public.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_discovery_idx on public.jobs(status, category, published_at desc);
create index jobs_employer_idx on public.jobs(employer_id, status, updated_at desc);
create index applications_job_idx on public.applications(job_id, status, submitted_at desc);
create index applications_student_idx on public.applications(student_id, submitted_at desc);
create index offers_student_idx on public.job_offers(student_id, status, created_at desc);
create index messages_conversation_idx on public.messages(conversation_id, created_at desc, id desc);
create index notifications_user_idx on public.notifications(user_id, read_at, created_at desc);
create index engagements_parties_idx on public.engagements(student_id, employer_id, status);
