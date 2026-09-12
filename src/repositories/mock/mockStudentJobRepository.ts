import type { StudentJobRepository } from '@/repositories/interfaces/StudentJobRepository';
import type { CursorPage, Job, JobDetail, JobRecommendation, JobSearchQuery } from '@/domain/contracts/types';
import { MOCK_JOBS } from './data/jobs';
import { mockDb } from './db';
import { scoreJob } from './matching';
import { delay } from './storage';

const PAGE_SIZE = 5;

function paginate<T>(items: T[], cursor?: string): CursorPage<T> {
  const start = cursor ? Number(cursor) : 0;
  const slice = items.slice(start, start + PAGE_SIZE);
  const nextCursor = start + PAGE_SIZE < items.length ? String(start + PAGE_SIZE) : undefined;
  return { items: slice, nextCursor };
}

async function currentContext() {
  const db = await mockDb.get();
  const userId = db.currentUserId;
  const profile = userId ? db.studentProfiles[userId] ?? null : null;
  const skills = userId ? db.studentSkills[userId] ?? [] : [];
  const savedIds = userId ? db.savedJobIds[userId] ?? [] : [];
  const applications = userId ? db.applications.filter((a) => a.studentId === userId) : [];
  return { userId, profile, skills, savedIds, applications };
}

export const mockStudentJobRepository: StudentJobRepository = {
  async listRecommendedJobs(cursor?: string): Promise<CursorPage<JobRecommendation>> {
    await delay(300);
    const { profile, skills } = await currentContext();

    const published = MOCK_JOBS.filter((j) => j.status === 'published');
    const ranked = [...published].sort(
      (a, b) => scoreJob(b, profile, skills).totalScore - scoreJob(a, profile, skills).totalScore
    );

    const page = paginate(ranked, cursor);
    return {
      items: page.items.map((job) => ({ job, match: scoreJob(job, profile, skills) })),
      nextCursor: page.nextCursor,
    };
  },

  async searchJobs(query: JobSearchQuery): Promise<CursorPage<Job>> {
    await delay(250);
    let results = MOCK_JOBS.filter((j) => j.status === 'published');

    if (query.keyword) {
      const kw = query.keyword.trim().toLowerCase();
      if (kw) {
        results = results.filter(
          (j) => j.title.toLowerCase().includes(kw) || j.summary.toLowerCase().includes(kw)
        );
      }
    }
    if (query.category) {
      results = results.filter((j) => j.category === query.category);
    }
    if (query.difficulty) {
      results = results.filter((j) => j.difficulty === query.difficulty);
    }
    if (query.workMode) {
      results = results.filter((j) => j.workMode === query.workMode);
    }
    if (query.compensationType) {
      results = results.filter((j) => j.compensationType === query.compensationType);
    }
    if (query.beginnerFriendlyOnly) {
      results = results.filter((j) => j.beginnerFriendly);
    }

    return paginate(results, query.cursor);
  },

  async getJob(jobId: string): Promise<JobDetail> {
    await delay(200);
    const job = MOCK_JOBS.find((j) => j.id === jobId);
    if (!job) throw new Error('공고를 찾을 수 없어요.');

    const { userId, profile, skills, savedIds, applications } = await currentContext();
    const alreadyApplied = applications.some((a) => a.jobId === jobId && a.status !== 'withdrawn');

    return {
      ...job,
      match: userId ? scoreJob(job, profile, skills) : undefined,
      alreadyApplied,
      isOwnJob: false,
      isSaved: savedIds.includes(jobId),
    };
  },

  async saveJob(jobId: string): Promise<void> {
    await delay(150);
    const userId = (await mockDb.get()).currentUserId;
    if (!userId) throw new Error('로그인이 필요해요.');
    await mockDb.update((d) => {
      const list = d.savedJobIds[userId] ?? [];
      if (!list.includes(jobId)) {
        d.savedJobIds[userId] = [...list, jobId];
      }
    });
  },

  async unsaveJob(jobId: string): Promise<void> {
    await delay(150);
    const userId = (await mockDb.get()).currentUserId;
    if (!userId) throw new Error('로그인이 필요해요.');
    await mockDb.update((d) => {
      d.savedJobIds[userId] = (d.savedJobIds[userId] ?? []).filter((id) => id !== jobId);
    });
  },

  async listSavedJobs(cursor?: string): Promise<CursorPage<Job>> {
    await delay(200);
    const { savedIds } = await currentContext();
    const jobs = MOCK_JOBS.filter((j) => savedIds.includes(j.id));
    return paginate(jobs, cursor);
  },
};
