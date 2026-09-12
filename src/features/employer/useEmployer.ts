import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApplicationStatus, EmployerJobInput, EmployerOnboardingInput, JobStatus } from '@/domain/contracts/types';
import { employerRepository } from '@/repositories';

export const employerKeys = {
  all: ['employer'] as const,
  profile: () => ['employer', 'profile'] as const,
  jobs: () => ['employer', 'jobs'] as const,
  applicants: (jobId: string) => ['employer', 'jobs', jobId, 'applicants'] as const,
  students: (keyword: string) => ['employer', 'students', keyword] as const,
};

export function useEmployerProfile() {
  return useQuery({ queryKey: employerKeys.profile(), queryFn: () => employerRepository.getMyProfile() });
}

export function useEmployerOnboarding() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: EmployerOnboardingInput) => employerRepository.onboard(input),
    onSuccess: () => client.invalidateQueries({ queryKey: employerKeys.profile() }),
  });
}

export function useEmployerJobs() {
  return useQuery({ queryKey: employerKeys.jobs(), queryFn: () => employerRepository.listMyJobs() });
}

export function useCreateJob() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: EmployerJobInput) => employerRepository.createAndPublishJob(input),
    onSuccess: () => client.invalidateQueries({ queryKey: employerKeys.jobs() }),
  });
}

export function useChangeJobStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, status }: { jobId: string; status: Extract<JobStatus, 'paused' | 'closed' | 'filled'> }) =>
      employerRepository.changeJobStatus(jobId, status),
    onSuccess: () => client.invalidateQueries({ queryKey: employerKeys.jobs() }),
  });
}

export function useApplicants(jobId: string) {
  return useQuery({ queryKey: employerKeys.applicants(jobId), queryFn: () => employerRepository.listApplicants(jobId), enabled: Boolean(jobId) });
}

export function useChangeApplicantStatus(jobId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, status }: { applicationId: string; status: Extract<ApplicationStatus, 'viewed' | 'chatting' | 'interview' | 'accepted' | 'rejected'> }) =>
      employerRepository.changeApplicantStatus(applicationId, status),
    onSuccess: () => client.invalidateQueries({ queryKey: employerKeys.applicants(jobId) }),
  });
}

export function useStudentSearch(keyword: string) {
  return useQuery({
    queryKey: employerKeys.students(keyword),
    queryFn: () => employerRepository.searchStudents(keyword),
    enabled: keyword.trim().length >= 2,
  });
}
