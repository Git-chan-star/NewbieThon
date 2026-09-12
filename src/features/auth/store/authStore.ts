import { create } from 'zustand';
import type { User } from '@/domain/contracts/types';

export type SessionStatus = 'checking' | 'signed-out' | 'signed-in';

interface AuthState {
  status: SessionStatus;
  user: User | null;
  setChecking: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'checking',
  user: null,
  setChecking: () => set({ status: 'checking' }),
  setUser: (user) => set({ status: user ? 'signed-in' : 'signed-out', user }),
}));
