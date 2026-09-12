import type { EmployerProfile, Job } from '@/domain/contracts/types';
import type { EmployerRepository } from '@/repositories/interfaces/EmployerRepository';

let profile: EmployerProfile | null = null;
const jobs: Job[] = [];

export const mockEmployerRepository: EmployerRepository = {
  async getMyProfile() { return profile; },
  async onboard(input) {
    profile = {
      userId: 'mock-employer',
      organizationName: input.organizationName,
      organizationType: input.organizationType,
      industry: input.industry,
      introduction: input.introduction,
      verificationStatus: 'unverified',
    };
    return profile;
  },
  async listMyJobs() { return jobs; },
  async createAndPublishJob(input) {
    const now = new Date().toISOString();
    const job: Job = {
      id: `mock-job-${Date.now()}`,
      employerId: 'mock-employer',
      employerName: profile?.organizationName ?? '내 조직',
      employerVerified: false,
      title: input.title,
      category: input.category,
      summary: input.summary,
      responsibilities: input.responsibilities,
      deliverables: input.deliverables,
      requiredSkills: [],
      difficulty: 'beginner',
      beginnerFriendly: input.beginnerFriendly,
      educationOrFeedback: input.educationOrFeedback,
      workMode: input.workMode,
      locationText: input.locationText,
      hoursPerWeek: input.hoursPerWeek,
      startDate: input.startDate,
      endDate: input.endDate,
      compensationType: input.compensationType,
      compensationMin: input.compensationMin,
      currency: 'KRW',
      headcount: input.headcount,
      applicationDeadline: input.applicationDeadline,
      status: 'published',
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    jobs.unshift(job);
    return job;
  },
  async changeJobStatus(jobId, status) {
    const job = jobs.find((item) => item.id === jobId);
    if (job) job.status = status;
  },
  async listApplicants() { return []; },
  async changeApplicantStatus() {},
  async searchStudents() { return []; },
};
