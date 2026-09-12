import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const bootstrapSupabaseSchemas = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (
    id uuid primary key,
    raw_user_meta_data jsonb not null,
    created_at timestamptz not null default now()
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;

  create schema storage;
  create table storage.buckets (
    id text primary key,
    name text not null,
    public boolean not null default false,
    file_size_limit bigint,
    allowed_mime_types text[]
  );
  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text not null references storage.buckets(id),
    name text not null,
    owner_id text,
    metadata jsonb
  );
  create function storage.foldername(name text) returns text[] language sql immutable as $$
    select string_to_array(name, '/')
  $$;
`;

test("Supabase 마이그레이션이 PostgreSQL에서 순서대로 적용된다", async () => {
  const db = new PGlite();
  await db.waitReady;
  await db.exec(bootstrapSupabaseSchemas);

  const migrationDirectory = new URL("../supabase/migrations/", import.meta.url);
  const files = (await readdir(migrationDirectory))
    .filter((name) => name.endsWith(".sql"))
    .sort();
  assert.equal(files.length, 4);

  for (const file of files) {
    const sql = (await readFile(new URL(file, migrationDirectory), "utf8"))
      .replace("create extension if not exists pgcrypto;", "");
    await db.exec(sql);
  }

  const tables = await db.query(`
    select table_name from information_schema.tables
    where table_schema = 'public' order by table_name
  `);
  assert.ok(tables.rows.some((row) => row.table_name === "jobs"));
  assert.ok(tables.rows.some((row) => row.table_name === "engagements"));

  const functions = await db.query(`
    select routine_name from information_schema.routines
    where routine_schema = 'public'
  `);
  assert.ok(functions.rows.some((row) => row.routine_name === "publish_job"));
  assert.ok(functions.rows.some((row) => row.routine_name === "send_message"));

  const employerId = "00000000-0000-0000-0000-000000000001";
  const studentId = "00000000-0000-0000-0000-000000000002";
  await db.query(
    `insert into auth.users (id, raw_user_meta_data) values
      ($1, '{"role":"employer","display_name":"테스트 구인자"}'),
      ($2, '{"role":"student","display_name":"테스트 학생"}')`,
    [employerId, studentId],
  );

  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [employerId]);
  const onboarding = await db.query(`
    select (public.onboard_employer(
      '뉴비톤 테스트 조직', '스타트업', 'IT', '테스트 조직',
      '담당자', '대표', 'work@example.com', null
    )).organization_id as organization_id
  `);
  const organizationId = onboarding.rows[0].organization_id;
  const jobResult = await db.query(
    `insert into public.jobs (
      organization_id, employer_id, title, category, summary, tasks, deliverables,
      no_specific_skill, work_mode, starts_on, ends_on, apply_deadline,
      compensation_type, compensation_min
    ) values (
      $1, $2, 'Android 화면 수정', 'Android', '초보자도 가능한 화면 수정',
      array['Compose 화면 수정'], array['소스 코드'], true, 'remote',
      current_date + 1, current_date + 7, now() + interval '5 days', 'fixed', 150000
    ) returning id`,
    [organizationId, employerId],
  );
  const jobId = jobResult.rows[0].id;
  const published = await db.query(
    "select (public.publish_job($1, '10000000-0000-0000-0000-000000000001')).status as status",
    [jobId],
  );
  assert.equal(published.rows[0].status, "published");

  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [studentId]);
  const applicationResult = await db.query(
    "select (public.apply_to_job($1, '배우면서 책임감 있게 하겠습니다.', '20000000-0000-0000-0000-000000000001')).id as id",
    [jobId],
  );
  const applicationId = applicationResult.rows[0].id;

  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [employerId]);
  await db.query(
    "select public.change_application_status($1, 'viewed', '30000000-0000-0000-0000-000000000001')",
    [applicationId],
  );
  await db.query(
    "select public.change_application_status($1, 'chatting', '30000000-0000-0000-0000-000000000002')",
    [applicationId],
  );
  await db.query(
    "select public.change_application_status($1, 'accepted', '30000000-0000-0000-0000-000000000003')",
    [applicationId],
  );
  const conversationResult = await db.query(
    "select id from public.conversations where application_id = $1",
    [applicationId],
  );
  const conversationId = conversationResult.rows[0].id;
  const engagementResult = await db.query(
    `select (public.create_engagement(
      $1, null, 'Android 화면 1개 수정', array['소스 코드'], current_date + 1,
      current_date + 7, 'fixed', 150000, '40000000-0000-0000-0000-000000000001'
    )).id as id`,
    [applicationId],
  );
  const engagementId = engagementResult.rows[0].id;
  await db.query("select public.start_engagement($1)", [engagementId]);

  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [studentId]);
  const message = await db.query(
    `select (public.send_message(
      $1, 'text', '업무 확인했습니다.', null,
      '70000000-0000-0000-0000-000000000001'
    )).body as body`,
    [conversationId],
  );
  assert.equal(message.rows[0].body, "업무 확인했습니다.");
  await db.query(
    `select public.submit_deliverable(
      $1, '완성 소스', null, 'https://example.com/result', null,
      '50000000-0000-0000-0000-000000000001'
    )`,
    [engagementId],
  );

  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [employerId]);
  const completed = await db.query(
    "select (public.complete_engagement($1, '60000000-0000-0000-0000-000000000001')).status as status",
    [engagementId],
  );
  assert.equal(completed.rows[0].status, "completed");
  const review = await db.query(
    `select (public.create_review(
      $1, 5::smallint, '책임감 있게 완료했습니다.', array[]::uuid[], true, 'profile',
      '80000000-0000-0000-0000-000000000001'
    )).direction as direction`,
    [engagementId],
  );
  assert.equal(review.rows[0].direction, "employer_to_student");
  const experienceCount = await db.query(
    "select count(*)::int as count from public.student_projects where source_engagement_id = $1",
    [engagementId],
  );
  assert.equal(experienceCount.rows[0].count, 1);

  await db.query("set role authenticated");
  const privateProfile = await db.query(
    "select count(*)::int as count from public.student_profiles where user_id = $1",
    [studentId],
  );
  assert.equal(privateProfile.rows[0].count, 0);
  await db.query("reset role");

  const outsiderId = "00000000-0000-0000-0000-000000000003";
  await db.query(
    `insert into auth.users (id, raw_user_meta_data)
     values ($1, '{"role":"student","display_name":"외부 학생"}')`,
    [outsiderId],
  );
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [outsiderId]);
  await db.query("set role authenticated");
  const hiddenConversation = await db.query(
    "select count(*)::int as count from public.conversations where id = $1",
    [conversationId],
  );
  assert.equal(hiddenConversation.rows[0].count, 0);
  await assert.rejects(
    db.query(
      `insert into public.messages (
        conversation_id, sender_id, message_type, body, client_message_id
      ) values ($1, $2, 'text', '권한 없는 메시지', '90000000-0000-0000-0000-000000000001')`,
      [conversationId, outsiderId],
    ),
    /row-level security policy/,
  );
  await db.query("reset role");
  await db.close();
});
