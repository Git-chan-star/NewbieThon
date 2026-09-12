import type { AdminReport, AdminVerification, Job } from '@/domain/contracts/types';
import type { AdminRepository } from '@/repositories/interfaces/AdminRepository';
import { MOCK_JOBS } from './data/jobs';
import { mockDb } from './db';
import { delay } from './storage';

let jobs: Job[] = MOCK_JOBS.map((job) => ({ ...job }));
let verifications: AdminVerification[] = [
  {
    userId: 'mock-employer',
    organizationId: 'mock-organization',
    organizationName: '캠퍼스랩',
    contactName: '김담당',
    workEmail: 'recruit@campuslab.example',
    status: 'pending',
    documentPath: 'mock-employer/business-registration.pdf',
    submittedAt: new Date().toISOString(),
  },
];
let reports: AdminReport[] = [
  {
    id: 'mock-report-1',
    reporterId: 'mock-student',
    targetType: 'job',
    targetId: 'job_02',
    reasonCode: 'misleading_information',
    detail: '공고 설명과 실제 업무 범위가 다른 것 같아요.',
    status: 'received',
    createdAt: new Date().toISOString(),
  },
];

export const mockAdminRepository: AdminRepository = {
  async getOverview() {
    await delay(120);
    const db = await mockDb.get();
    const users = Object.values(db.users);
    return {
      totalUsers: users.length,
      activeStudents: users.filter((user) => user.role === 'student' && (user as typeof user & { isActive?: boolean }).isActive !== false).length,
      activeEmployers: users.filter((user) => user.role === 'employer' && (user as typeof user & { isActive?: boolean }).isActive !== false).length,
      publishedJobs: jobs.filter((job) => job.status === 'published').length,
      pendingVerifications: verifications.filter((item) => item.status === 'pending').length,
      openReports: reports.filter((report) => report.status === 'received' || report.status === 'reviewing').length,
    };
  },

  async listUsers() {
    await delay(120);
    const db = await mockDb.get();
    return Object.values(db.users)
      .map((user) => ({
        id: user.id,
        displayName: user.displayName,
        role: user.role,
        isActive: (user as typeof user & { isActive?: boolean }).isActive !== false,
        createdAt: user.createdAt,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async setUserActive(userId, isActive) {
    await delay();
    const db = await mockDb.get();
    if (db.currentUserId === userId && !isActive) throw new Error('현재 관리자 계정은 정지할 수 없어요.');
    await mockDb.update((draft) => {
      const user = draft.users[userId];
      if (!user) throw new Error('회원을 찾을 수 없어요.');
      draft.users[userId] = { ...user, isActive, updatedAt: new Date().toISOString() } as typeof user;
    });
  },

  async listJobs() {
    await delay(120);
    return jobs;
  },

  async setJobStatus(jobId, status) {
    await delay();
    const found = jobs.find((job) => job.id === jobId);
    if (!found) throw new Error('공고를 찾을 수 없어요.');
    jobs = jobs.map((job) => job.id === jobId ? { ...job, status, updatedAt: new Date().toISOString() } : job);
  },

  async listVerifications() {
    await delay(120);
    return verifications;
  },

  async reviewVerification(userId, decision) {
    await delay();
    verifications = verifications.map((item) => item.userId === userId ? { ...item, status: decision } : item);
  },

  async listReports() {
    await delay(120);
    return reports;
  },

  async setReportStatus(reportId, status) {
    await delay();
    reports = reports.map((report) => report.id === reportId ? { ...report, status } : report);
  },
};
