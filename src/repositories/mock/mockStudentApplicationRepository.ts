import type { StudentApplicationRepository } from '@/repositories/interfaces/StudentApplicationRepository';
import type {
  Application,
  ApplicationDetail,
  ApplicationInput,
  ApplicationSummary,
  CursorPage,
  JobOffer,
} from '@/domain/contracts/types';
import { MOCK_JOBS } from './data/jobs';
import { mockDb } from './db';
import { delay, newId } from './storage';

const PAGE_SIZE = 10;

function paginate<T>(items: T[], cursor?: string): CursorPage<T> {
  const start = cursor ? Number(cursor) : 0;
  const slice = items.slice(start, start + PAGE_SIZE);
  const nextCursor = start + PAGE_SIZE < items.length ? String(start + PAGE_SIZE) : undefined;
  return { items: slice, nextCursor };
}

function toSummary(application: Application): ApplicationSummary {
  const job = MOCK_JOBS.find((j) => j.id === application.jobId);
  if (!job) throw new Error('연결된 공고를 찾을 수 없어요.');
  return {
    ...application,
    job: {
      id: job.id,
      title: job.title,
      employerName: job.employerName,
      category: job.category,
      compensationType: job.compensationType,
      compensationMin: job.compensationMin,
      compensationMax: job.compensationMax,
      currency: job.currency,
    },
  };
}

function toDetail(application: Application): ApplicationDetail {
  const job = MOCK_JOBS.find((j) => j.id === application.jobId);
  if (!job) throw new Error('연결된 공고를 찾을 수 없어요.');
  return { ...application, job };
}

async function requireUserId(): Promise<string> {
  const db = await mockDb.get();
  if (!db.currentUserId) throw new Error('로그인이 필요해요.');
  return db.currentUserId;
}

export const mockStudentApplicationRepository: StudentApplicationRepository = {
  async submitApplication(input: ApplicationInput): Promise<Application> {
    await delay(400);
    const userId = await requireUserId();
    const db = await mockDb.get();

    const duplicate = db.applications.find(
      (a) => a.jobId === input.jobId && a.studentId === userId && a.status !== 'withdrawn'
    );
    if (duplicate) {
      throw new Error('이미 지원한 공고예요. 지원 현황에서 확인해 주세요.');
    }

    const profile = db.studentProfiles[userId];
    const skills = db.studentSkills[userId] ?? [];
    const projects = db.studentProjects[userId] ?? [];

    const application: Application = {
      id: newId('application'),
      jobId: input.jobId,
      studentId: userId,
      status: 'submitted',
      availableStartDate: input.availableStartDate,
      availabilityNote: input.availabilityNote,
      shortAnswer: input.shortAnswer,
      submittedProfileSnapshot: { profile, skills, projects },
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await mockDb.update((d) => {
      d.applications.push(application);
    });

    return application;
  },

  async listMyApplications(cursor?: string): Promise<CursorPage<ApplicationSummary>> {
    await delay(250);
    const userId = await requireUserId();
    const db = await mockDb.get();
    const mine = db.applications
      .filter((a) => a.studentId === userId)
      .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));

    const page = paginate(mine, cursor);
    return { items: page.items.map(toSummary), nextCursor: page.nextCursor };
  },

  async getMyApplication(applicationId: string): Promise<ApplicationDetail> {
    await delay(200);
    const db = await mockDb.get();
    const application = db.applications.find((a) => a.id === applicationId);
    if (!application) throw new Error('지원 내역을 찾을 수 없어요.');
    return toDetail(application);
  },

  async withdrawApplication(applicationId: string): Promise<Application> {
    await delay(300);
    let updated!: Application;
    await mockDb.update((d) => {
      const index = d.applications.findIndex((a) => a.id === applicationId);
      if (index < 0) throw new Error('지원 내역을 찾을 수 없어요.');
      updated = { ...d.applications[index], status: 'withdrawn', updatedAt: new Date().toISOString() };
      d.applications[index] = updated;
    });
    return updated;
  },

  async listMyOffers(cursor?: string): Promise<CursorPage<JobOffer>> {
    await delay(250);
    const userId = await requireUserId();
    const db = await mockDb.get();
    const mine = db.offers
      .filter((o) => o.studentId === userId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return paginate(mine, cursor);
  },

  async respondToOffer(offerId: string, decision: 'accept' | 'decline'): Promise<JobOffer> {
    await delay(300);
    let updated!: JobOffer;
    await mockDb.update((d) => {
      const index = d.offers.findIndex((o) => o.id === offerId);
      if (index < 0) throw new Error('제안을 찾을 수 없어요.');
      updated = { ...d.offers[index], status: decision === 'accept' ? 'accepted' : 'declined' };
      d.offers[index] = updated;
    });
    return updated;
  },
};
