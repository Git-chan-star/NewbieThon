import { useQuery } from '@tanstack/react-query';
import { studentKeys } from '@/lib/queryKeys';
import { mockStudentRepository } from '@/repositories/mock';

export function useMyProfile() {
  return useQuery({
    queryKey: studentKeys.profile(),
    queryFn: () => mockStudentRepository.getMyProfile(),
  });
}

export function useMySkills() {
  return useQuery({
    queryKey: studentKeys.skills(),
    queryFn: () => mockStudentRepository.listSkills(),
  });
}

export function useMyProjects() {
  return useQuery({
    queryKey: studentKeys.projects(),
    queryFn: () => mockStudentRepository.listProjects(),
  });
}

export function useMyCourses() {
  return useQuery({
    queryKey: studentKeys.courses(),
    queryFn: () => mockStudentRepository.listCourses(),
  });
}
