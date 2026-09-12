import type { AuthRepository } from '@/repositories/interfaces/AuthRepository';
import type { SignInInput, SignUpInput, User, UserRole } from '@/domain/contracts/types';
import { mockDb } from './db';
import { delay, newId } from './storage';

function nowIso(): string {
  return new Date().toISOString();
}

const demoAdminEmail = process.env.EXPO_PUBLIC_ADMIN_EMAIL ?? 'admin@itgu.local';

function isDemoAdmin(input: SignInInput): boolean {
  if (!__DEV__) return false;
  const configuredPassword = process.env.EXPO_PUBLIC_DEMO_ADMIN_PASSWORD;
  return Boolean(configuredPassword) && input.email.toLowerCase() === demoAdminEmail.toLowerCase() && input.password === configuredPassword;
}

export const mockAuthRepository: AuthRepository = {
  async signUp(input: SignUpInput): Promise<User> {
    await delay();
    const db = await mockDb.get();
    const existing = Object.values(db.users).find(
      (u) => (u as User & { email?: string }).email === input.email
    );
    if (existing) {
      throw new Error('이미 가입된 이메일이에요. 로그인을 시도해 주세요.');
    }

    const user: User = {
      id: newId('user'),
      role: null,
      displayName: input.displayName,
      onboardingCompleted: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    await mockDb.update((d) => {
      d.users[user.id] = { ...user, email: input.email, password: input.password } as User & { email: string; password: string };
      d.currentUserId = user.id;
    });

    return user;
  },

  async signIn(input: SignInInput): Promise<User> {
    await delay();

    if (isDemoAdmin(input)) {
      const admin: User = {
        id: 'mock-admin',
        role: 'admin',
        displayName: '잇구 관리자',
        onboardingCompleted: true,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      await mockDb.update((d) => {
        d.users[admin.id] = { ...admin, email: demoAdminEmail, isActive: true } as User & { email: string; isActive: boolean };
        d.currentUserId = admin.id;
      });
      return admin;
    }

    const db = await mockDb.get();
    const user = Object.values(db.users).find(
      (u) => (u as User & { email?: string }).email === input.email
    );
    if (!user) {
      throw new Error('가입되지 않은 이메일이에요. 회원가입을 먼저 진행해 주세요.');
    }
    const savedPassword = (user as User & { password?: string }).password;
    if (savedPassword && savedPassword !== input.password) {
      throw new Error('비밀번호가 올바르지 않아요.');
    }

    await mockDb.update((d) => {
      d.currentUserId = user.id;
    });

    return user;
  },

  async signOut(): Promise<void> {
    await delay(150);
    await mockDb.update((d) => {
      d.currentUserId = null;
    });
  },

  async getSession(): Promise<User | null> {
    await delay(150);
    const db = await mockDb.get();
    if (!db.currentUserId) return null;
    return db.users[db.currentUserId] ?? null;
  },

  async selectRole(role: Exclude<UserRole, 'admin'>): Promise<User> {
    await delay();
    const db = await mockDb.get();
    if (!db.currentUserId) throw new Error('로그인이 필요해요.');

    let updated!: User;
    await mockDb.update((d) => {
      const user = d.users[d.currentUserId!];
      updated = { ...user, role, updatedAt: nowIso() };
      d.users[d.currentUserId!] = updated;

      if (role === 'student' && !d.studentProfiles[d.currentUserId!]) {
        d.studentProfiles[d.currentUserId!] = {
          userId: d.currentUserId!,
          schoolName: '',
          majorName: '',
          gradeYear: 1,
          verificationStatus: 'unverified',
          interests: [],
          preferredJobCategories: [],
          preferredWorkModes: [],
          availableDays: [],
          profileCompletion: 0,
          isDiscoverable: true,
        };

        const hasOffer = d.offers.some((o) => o.studentId === d.currentUserId);
        if (!hasOffer) {
          d.offers.push({
            id: newId('offer'),
            jobId: 'job_02',
            jobTitle: '카페 인스타그램 콘텐츠 기획 및 운영',
            employerId: 'employer_02',
            employerName: '그린테이블 (개인 의뢰인)',
            employerVerified: false,
            studentId: d.currentUserId!,
            message: '프로필을 보고 SNS 감각이 좋으실 것 같아 제안 드려요. 편하게 이야기 나눠봐요!',
            status: 'pending',
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
            createdAt: nowIso(),
          });
        }
      }
    });

    return updated;
  },

  async completeOnboarding(): Promise<User> {
    await delay();
    const db = await mockDb.get();
    if (!db.currentUserId) throw new Error('로그인이 필요해요.');

    let updated!: User;
    await mockDb.update((d) => {
      const user = d.users[d.currentUserId!];
      updated = { ...user, onboardingCompleted: true, updatedAt: nowIso() };
      d.users[d.currentUserId!] = updated;
    });

    return updated;
  },
};
