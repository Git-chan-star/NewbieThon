import type { CursorPage, Job, JobDetail, JobRecommendation, JobSearchQuery } from '@/domain/contracts/types';
import { requireSupabase } from '@/lib/supabase';
import type { StudentJobRepository } from '@/repositories/interfaces/StudentJobRepository';
import { scoreJob } from '@/repositories/mock/matching';
import { mapJob, mapProfile, mapSkill, jobSelect, type DbRow } from './mappers';

const PAGE_SIZE = 12;

async function context() {
  const client = requireSupabase();
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) throw new Error('로그인이 필요해요.');
  const [{ data: profile }, { data: skills }] = await Promise.all([
    client.from('student_profiles').select('*').eq('user_id', auth.user.id).maybeSingle(),
    client.from('student_skills').select('*, skills(name)').eq('student_id', auth.user.id),
  ]);
  return {
    userId: auth.user.id,
    profile: profile ? mapProfile(profile as DbRow) : null,
    skills: ((skills ?? []) as DbRow[]).map(mapSkill),
  };
}

function nextCursor(rows: DbRow[]): string | undefined {
  return rows.length === PAGE_SIZE ? rows[rows.length - 1]?.published_at : undefined;
}

async function search(query: JobSearchQuery): Promise<{ rows: DbRow[]; next?: string }> {
  const client = requireSupabase();
  let request = client
    .from('jobs')
    .select(jobSelect)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(PAGE_SIZE);
  if (query.cursor) request = request.lt('published_at', query.cursor);
  if (query.keyword?.trim()) {
    const escaped = query.keyword.trim().replaceAll('%', '\\%').replaceAll('_', '\\_').replaceAll(',', ' ');
    request = request.or(`title.ilike.%${escaped}%,summary.ilike.%${escaped}%`);
  }
  if (query.category) request = request.eq('category', query.category);
  if (query.workMode) request = request.eq('work_mode', query.workMode);
  if (query.compensationType) request = request.eq('compensation_type', query.compensationType);
  if (query.beginnerFriendlyOnly) request = request.eq('beginner_friendly', true);
  if (query.difficulty === 'beginner') request = request.eq('difficulty', 'learning');
  if (query.difficulty === 'basic') request = request.eq('difficulty', 'basic');
  if (query.difficulty === 'intermediate') request = request.in('difficulty', ['independent', 'advanced']);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as DbRow[];
  return { rows, next: nextCursor(rows) };
}

export const supabaseStudentJobRepository: StudentJobRepository = {
  async listRecommendedJobs(cursor?: string): Promise<CursorPage<JobRecommendation>> {
    const [{ rows, next }, student] = await Promise.all([search({ cursor }), context()]);
    const items = rows.map(mapJob).map((job) => ({ job, match: scoreJob(job, student.profile, student.skills) }));
    items.sort((a, b) => b.match.totalScore - a.match.totalScore);
    return { items, nextCursor: next };
  },
  async searchJobs(query: JobSearchQuery): Promise<CursorPage<Job>> {
    const { rows, next } = await search(query);
    return { items: rows.map(mapJob), nextCursor: next };
  },
  async getJob(jobId: string): Promise<JobDetail> {
    const client = requireSupabase();
    const student = await context();
    const [{ data: row, error }, { data: saved }, { data: application }] = await Promise.all([
      client.from('jobs').select(jobSelect).eq('id', jobId).single(),
      client.from('saved_jobs').select('job_id').eq('student_id', student.userId).eq('job_id', jobId).maybeSingle(),
      client.from('applications').select('id').eq('student_id', student.userId).eq('job_id', jobId).neq('status', 'withdrawn').maybeSingle(),
    ]);
    if (error) throw new Error(error.message);
    const job = mapJob(row as DbRow);
    return {
      ...job,
      match: scoreJob(job, student.profile, student.skills),
      alreadyApplied: Boolean(application),
      isOwnJob: job.employerId === student.userId,
      isSaved: Boolean(saved),
    };
  },
  async saveJob(jobId: string): Promise<void> {
    const { userId } = await context();
    const { error } = await requireSupabase().from('saved_jobs').upsert({ student_id: userId, job_id: jobId });
    if (error) throw new Error(error.message);
  },
  async unsaveJob(jobId: string): Promise<void> {
    const { userId } = await context();
    const { error } = await requireSupabase().from('saved_jobs').delete().eq('student_id', userId).eq('job_id', jobId);
    if (error) throw new Error(error.message);
  },
  async listSavedJobs(cursor?: string): Promise<CursorPage<Job>> {
    const { userId } = await context();
    let request = requireSupabase()
      .from('saved_jobs')
      .select(`created_at, jobs(${jobSelect})`)
      .eq('student_id', userId)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);
    if (cursor) request = request.lt('created_at', cursor);
    const { data, error } = await request;
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as DbRow[];
    return {
      items: rows.map((row) => mapJob(Array.isArray(row.jobs) ? row.jobs[0] : row.jobs)),
      nextCursor: rows.length === PAGE_SIZE ? rows[rows.length - 1]?.created_at : undefined,
    };
  },
};
