import type {
  AdminOverview,
  AdminReport,
  AdminUserSummary,
  AdminVerification,
  Job,
  JobStatus,
  ReportStatus,
} from '@/domain/contracts/types';

export interface AdminRepository {
  getOverview(): Promise<AdminOverview>;
  listUsers(): Promise<AdminUserSummary[]>;
  setUserActive(userId: string, isActive: boolean): Promise<void>;
  listJobs(): Promise<Job[]>;
  setJobStatus(jobId: string, status: Extract<JobStatus, 'published' | 'paused' | 'closed'>): Promise<void>;
  listVerifications(): Promise<AdminVerification[]>;
  reviewVerification(userId: string, decision: 'verified' | 'rejected', note?: string): Promise<void>;
  listReports(): Promise<AdminReport[]>;
  setReportStatus(reportId: string, status: Extract<ReportStatus, 'reviewing' | 'resolved' | 'dismissed'>): Promise<void>;
}
