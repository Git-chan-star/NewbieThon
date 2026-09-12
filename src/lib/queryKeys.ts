// 학생과 구인자 캐시가 섞이지 않도록 role prefix를 둔 query key factory.
export const studentKeys = {
  all: ['student'] as const,
  profile: () => [...studentKeys.all, 'profile'] as const,
  skills: () => [...studentKeys.all, 'skills'] as const,
  courses: () => [...studentKeys.all, 'courses'] as const,
  projects: () => [...studentKeys.all, 'projects'] as const,
  recommendedJobs: () => [...studentKeys.all, 'jobs', 'recommended'] as const,
  jobSearch: (queryKeyPart: unknown) => [...studentKeys.all, 'jobs', 'search', queryKeyPart] as const,
  jobDetail: (jobId: string) => [...studentKeys.all, 'jobs', 'detail', jobId] as const,
  savedJobs: () => [...studentKeys.all, 'jobs', 'saved'] as const,
  applications: () => [...studentKeys.all, 'applications'] as const,
  applicationDetail: (id: string) => [...studentKeys.all, 'applications', id] as const,
  offers: () => [...studentKeys.all, 'offers'] as const,
};
