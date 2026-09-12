import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { JobDetail, JobSearchQuery } from '@/domain/contracts/types';
import { studentKeys } from '@/lib/queryKeys';
import { studentJobRepository } from '@/repositories';

export function useRecommendedJobs() {
  return useInfiniteQuery({
    queryKey: studentKeys.recommendedJobs(),
    queryFn: ({ pageParam }) => studentJobRepository.listRecommendedJobs(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useSearchJobs(query: Omit<JobSearchQuery, 'cursor'>) {
  return useInfiniteQuery({
    queryKey: studentKeys.jobSearch(query),
    queryFn: ({ pageParam }) => studentJobRepository.searchJobs({ ...query, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useJobDetail(jobId: string) {
  return useQuery({
    queryKey: studentKeys.jobDetail(jobId),
    queryFn: () => studentJobRepository.getJob(jobId),
    enabled: Boolean(jobId),
  });
}

export function useSavedJobs() {
  return useInfiniteQuery({
    queryKey: studentKeys.savedJobs(),
    queryFn: ({ pageParam }) => studentJobRepository.listSavedJobs(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useToggleSaveJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, saved }: { jobId: string; saved: boolean }) => {
      if (saved) {
        await studentJobRepository.unsaveJob(jobId);
      } else {
        await studentJobRepository.saveJob(jobId);
      }
    },
    onMutate: async ({ jobId, saved }) => {
      await queryClient.cancelQueries({ queryKey: studentKeys.jobDetail(jobId) });
      const previous = queryClient.getQueryData<JobDetail>(studentKeys.jobDetail(jobId));
      queryClient.setQueryData<JobDetail>(studentKeys.jobDetail(jobId), (old) =>
        old ? { ...old, isSaved: !saved } : old
      );
      return { previous, jobId };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(studentKeys.jobDetail(context.jobId), context.previous);
      }
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.jobDetail(vars.jobId) });
      queryClient.invalidateQueries({ queryKey: studentKeys.savedJobs() });
      queryClient.invalidateQueries({ queryKey: studentKeys.recommendedJobs() });
    },
  });
}
