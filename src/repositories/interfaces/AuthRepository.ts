import type { SignInInput, SignUpInput, User, UserRole } from '@/domain/contracts/types';

export interface AuthRepository {
  signUp(input: SignUpInput): Promise<User>;
  signIn(input: SignInInput): Promise<User>;
  signOut(): Promise<void>;
  getSession(): Promise<User | null>;
  selectRole(role: Exclude<UserRole, 'admin'>): Promise<User>;
  completeOnboarding(): Promise<User>;
}
