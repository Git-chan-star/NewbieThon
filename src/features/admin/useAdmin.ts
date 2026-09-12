import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { JobStatus, ReportStatus } from '@/domain/contracts/types';
import { adminRepository } from '@/repositories';

export const adminKeys = {
  all: ['admin'] as const,
  overview: () => ['admin', 'overview'] as const,
  users: () => ['admin', 'users'] as const,
  jobs: () => ['admin', 'jobs'] as const,
  verifications: () => ['admin', 'verifications'] as const,
  reports: () => ['admin', 'reports'] as const,
};

export function useAdminOverview() {
  return useQuery({ queryKey: adminKeys.overview(), queryFn: () => adminRepository.getOverview() });
}

export function useAdminUsers() {
  return useQuery({ queryKey: adminKeys.users(), queryFn: () => adminRepository.listUsers() });
}

export function useSetUserActive() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) => adminRepository.setUserActive(userId, isActive),
    onSuccess: () => client.invalidateQueries({ queryKey: adminKeys.all }),
  });
}

export function useAdminJobs() {
  return useQuery({ queryKey: adminKeys.jobs(), queryFn: () => adminRepository.listJobs() });
}

export function useAdminSetJobStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, status }: { jobId: string; status: Extract<JobStatus, 'published' | 'paused' | 'closed'> }) =>
      adminRepository.setJobStatus(jobId, status),
    onSuccess: () => client.invalidateQueries({ queryKey: adminKeys.all }),
  });
}

export function useAdminVerifications() {
  return useQuery({ queryKey: adminKeys.verifications(), queryFn: () => adminRepository.listVerifications() });
}

export function useReviewVerification() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, decision, note }: { userId: string; decision: 'verified' | 'rejected'; note?: string }) =>
      adminRepository.reviewVerification(userId, decision, note),
    onSuccess: () => client.invalidateQueries({ queryKey: adminKeys.all }),
  });
}

export function useAdminReports() {
  return useQuery({ queryKey: adminKeys.reports(), queryFn: () => adminRepository.listReports() });
}

export function useAdminSetReportStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, status }: { reportId: string; status: Extract<ReportStatus, 'reviewing' | 'resolved' | 'dismissed'> }) =>
      adminRepository.setReportStatus(reportId, status),
    onSuccess: () => client.invalidateQueries({ queryKey: adminKeys.all }),
  });
}
