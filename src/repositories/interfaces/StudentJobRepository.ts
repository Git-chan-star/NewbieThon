import type { CursorPage, Job, JobDetail, JobRecommendation, JobSearchQuery } from '@/domain/contracts/types';

export interface StudentJobRepository {
  listRecommendedJobs(cursor?: string): Promise<CursorPage<JobRecommendation>>;
  searchJobs(query: JobSearchQuery): Promise<CursorPage<Job>>;
  getJob(jobId: string): Promise<JobDetail>;
  saveJob(jobId: string): Promise<void>;
  unsaveJob(jobId: string): Promise<void>;
  listSavedJobs(cursor?: string): Promise<CursorPage<Job>>;
}
