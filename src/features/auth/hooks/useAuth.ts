import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { SignInInput, SignUpInput, UserRole } from '@/domain/contracts/types';
import { mockAuthRepository } from '@/repositories/mock';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '../store/authStore';

export function useSessionBootstrap() {
  const setUser = useAuthStore((s) => s.setUser);
  const setChecking = useAuthStore((s) => s.setChecking);

  const query = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: () => mockAuthRepository.getSession(),
  });

  useEffect(() => {
    if (query.isPending) {
      setChecking();
    } else {
      setUser(query.data ?? null);
    }
  }, [query.isPending, query.data, setChecking, setUser]);
}

export function useSignUp() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (input: SignUpInput) => mockAuthRepository.signUp(input),
    onSuccess: (user) => setUser(user),
  });
}

export function useSignIn() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (input: SignInInput) => mockAuthRepository.signIn(input),
    onSuccess: (user) => setUser(user),
  });
}

export function useSignOut() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: () => mockAuthRepository.signOut(),
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
    },
  });
}

export function useSelectRole() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (role: Exclude<UserRole, 'admin'>) => mockAuthRepository.selectRole(role),
    onSuccess: (user) => setUser(user),
  });
}

export function useCompleteOnboarding() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: () => mockAuthRepository.completeOnboarding(),
    onSuccess: (user) => setUser(user),
  });
}
