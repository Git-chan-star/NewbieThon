import type {
  ApplicationStatus,
  EmployerApplicant,
  EmployerJobInput,
  EmployerOnboardingInput,
  EmployerProfile,
  Job,
  JobStatus,
  StudentProfile,
} from '@/domain/contracts/types';

export interface EmployerRepository {
  getMyProfile(): Promise<EmployerProfile | null>;
  onboard(input: EmployerOnboardingInput): Promise<EmployerProfile>;
  listMyJobs(): Promise<Job[]>;
  createAndPublishJob(input: EmployerJobInput): Promise<Job>;
  changeJobStatus(jobId: string, status: Extract<JobStatus, 'paused' | 'closed' | 'filled'>): Promise<void>;
  listApplicants(jobId: string): Promise<EmployerApplicant[]>;
  changeApplicantStatus(applicationId: string, status: Extract<ApplicationStatus, 'viewed' | 'chatting' | 'interview' | 'accepted' | 'rejected'>): Promise<void>;
  searchStudents(keyword: string): Promise<StudentProfile[]>;
}
