import { useQuery } from '@tanstack/react-query';
import { studentKeys } from '@/lib/queryKeys';
import { studentRepository } from '@/repositories';

export function useMyProfile() {
  return useQuery({
    queryKey: studentKeys.profile(),
    queryFn: () => studentRepository.getMyProfile(),
  });
}

export function useMySkills() {
  return useQuery({
    queryKey: studentKeys.skills(),
    queryFn: () => studentRepository.listSkills(),
  });
}

export function useMyProjects() {
  return useQuery({
    queryKey: studentKeys.projects(),
    queryFn: () => studentRepository.listProjects(),
  });
}

export function useMyCourses() {
  return useQuery({
    queryKey: studentKeys.courses(),
    queryFn: () => studentRepository.listCourses(),
  });
}
