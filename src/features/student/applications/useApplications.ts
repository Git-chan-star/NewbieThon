import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApplicationInput } from '@/domain/contracts/types';
import { studentKeys } from '@/lib/queryKeys';
import { studentApplicationRepository } from '@/repositories';

export function useMyApplications() {
  return useInfiniteQuery({
    queryKey: studentKeys.applications(),
    queryFn: ({ pageParam }) => studentApplicationRepository.listMyApplications(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useApplicationDetail(applicationId: string) {
  return useQuery({
    queryKey: studentKeys.applicationDetail(applicationId),
    queryFn: () => studentApplicationRepository.getMyApplication(applicationId),
    enabled: Boolean(applicationId),
  });
}

export function useSubmitApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ApplicationInput) => studentApplicationRepository.submitApplication(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.applications() });
      queryClient.invalidateQueries({ queryKey: studentKeys.jobDetail(variables.jobId) });
      queryClient.invalidateQueries({ queryKey: studentKeys.recommendedJobs() });
    },
  });
}

export function useWithdrawApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: string) => studentApplicationRepository.withdrawApplication(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.applications() });
    },
  });
}

export function useMyOffers() {
  return useInfiniteQuery({
    queryKey: studentKeys.offers(),
    queryFn: ({ pageParam }) => studentApplicationRepository.listMyOffers(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useRespondToOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ offerId, decision }: { offerId: string; decision: 'accept' | 'decline' }) =>
      studentApplicationRepository.respondToOffer(offerId, decision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.offers() });
    },
  });
}
