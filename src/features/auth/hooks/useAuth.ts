import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { SignInInput, SignUpInput, UserRole } from '@/domain/contracts/types';
import { authRepository } from '@/repositories';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '../store/authStore';

export function useSessionBootstrap() {
  const setUser = useAuthStore((s) => s.setUser);
  const setChecking = useAuthStore((s) => s.setChecking);

  const query = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: () => authRepository.getSession(),
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
    mutationFn: (input: SignUpInput) => authRepository.signUp(input),
    onSuccess: (user) => setUser(user),
  });
}

export function useSignIn() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (input: SignInInput) => authRepository.signIn(input),
    onSuccess: (user) => setUser(user),
  });
}

export function useSignOut() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: () => authRepository.signOut(),
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
    },
  });
}

export function useSelectRole() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (role: Exclude<UserRole, 'admin'>) => authRepository.selectRole(role),
    onSuccess: (user) => setUser(user),
  });
}

export function useCompleteOnboarding() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: () => authRepository.completeOnboarding(),
    onSuccess: (user) => setUser(user),
  });
}
