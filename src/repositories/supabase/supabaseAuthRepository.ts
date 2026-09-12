import type { SignInInput, SignUpInput, User, UserRole } from '@/domain/contracts/types';
import { requireSupabase } from '@/lib/supabase';
import type { AuthRepository } from '@/repositories/interfaces/AuthRepository';

type UserRow = {
  id: string;
  role: UserRole | null;
  display_name: string;
  avatar_url: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    role: row.role,
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? undefined,
    onboardingCompleted: row.onboarding_completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchCurrentUser(): Promise<User | null> {
  const client = requireSupabase();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw new Error(sessionError.message);
  if (!sessionData.session) return null;

  const { data, error } = await client.from('users').select('*').eq('id', sessionData.session.user.id).single();
  if (error) throw new Error(error.message);
  return mapUser(data as UserRow);
}

export const supabaseAuthRepository: AuthRepository = {
  async signUp(input: SignUpInput): Promise<User> {
    const client = requireSupabase();
    const { data, error } = await client.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { display_name: input.displayName } },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('회원가입 결과를 확인할 수 없어요.');
    if (!data.session) {
      const { error: signInError } = await client.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
      if (signInError) {
        throw new Error('회원가입은 완료됐지만 로그인에 실패했어요. 다시 로그인해 주세요.');
      }
    }
    return (await fetchCurrentUser())!;
  },

  async signIn(input: SignInInput): Promise<User> {
    const client = requireSupabase();
    const { error } = await client.auth.signInWithPassword(input);
    if (error) throw new Error(error.message);
    const user = await fetchCurrentUser();
    if (!user) throw new Error('로그인 세션을 불러오지 못했어요.');
    return user;
  },

  async signOut(): Promise<void> {
    const { error } = await requireSupabase().auth.signOut();
    if (error) throw new Error(error.message);
  },

  getSession: fetchCurrentUser,

  async selectRole(role: Exclude<UserRole, 'admin'>): Promise<User> {
    const { data, error } = await requireSupabase().rpc('select_role', { selected_role: role });
    if (error) throw new Error(error.message);
    return mapUser(data as UserRow);
  },

  async completeOnboarding(): Promise<User> {
    const { data, error } = await requireSupabase().rpc('complete_onboarding');
    if (error) throw new Error(error.message);
    return mapUser(data as UserRow);
  },
};
