import type { StudentRepository } from '@/repositories/interfaces/StudentRepository';
import type {
  StudentCourse,
  StudentProfile,
  StudentProfileUpdate,
  StudentProject,
  StudentProjectInput,
  StudentSkill,
  StudentSkillInput,
} from '@/domain/contracts/types';
import { mockDb } from './db';
import { delay, newId } from './storage';

function computeCompletion(profile: StudentProfile, skillCount: number, projectCount: number): number {
  let score = 0;
  if (profile.schoolName && profile.majorName) score += 25;
  if (profile.interests.length > 0) score += 15;
  if (skillCount > 0) score += 25;
  if (profile.preferredJobCategories.length > 0 && profile.preferredWorkModes.length > 0) score += 20;
  if (projectCount > 0) score += 15;
  return Math.min(score, 100);
}

async function requireUserId(): Promise<string> {
  const db = await mockDb.get();
  if (!db.currentUserId) throw new Error('로그인이 필요해요.');
  return db.currentUserId;
}

export const mockStudentRepository: StudentRepository = {
  async getMyProfile(): Promise<StudentProfile | null> {
    await delay(200);
    const userId = await requireUserId();
    const db = await mockDb.get();
    return db.studentProfiles[userId] ?? null;
  },

  async saveOnboardingStep(input: Partial<StudentProfile>): Promise<StudentProfile> {
    await delay();
    const userId = await requireUserId();

    let updated!: StudentProfile;
    await mockDb.update((d) => {
      const current: StudentProfile = d.studentProfiles[userId] ?? {
        userId,
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
      const merged: StudentProfile = { ...current, ...input, userId };
      const skillCount = (d.studentSkills[userId] ?? []).length;
      const projectCount = (d.studentProjects[userId] ?? []).length;
      merged.profileCompletion = computeCompletion(merged, skillCount, projectCount);
      d.studentProfiles[userId] = merged;
      updated = merged;
    });

    return updated;
  },

  async updateProfile(input: StudentProfileUpdate): Promise<StudentProfile> {
    return this.saveOnboardingStep(input);
  },

  async listSkills(): Promise<StudentSkill[]> {
    await delay(150);
    const userId = await requireUserId();
    const db = await mockDb.get();
    return db.studentSkills[userId] ?? [];
  },

  async upsertSkill(input: StudentSkillInput): Promise<StudentSkill> {
    await delay(150);
    const userId = await requireUserId();

    let saved!: StudentSkill;
    await mockDb.update((d) => {
      const list = d.studentSkills[userId] ?? [];
      const existingIndex = list.findIndex((s) => s.skillId === input.skillId);
      if (existingIndex >= 0) {
        saved = { ...list[existingIndex], level: input.level };
        list[existingIndex] = saved;
      } else {
        saved = {
          id: newId('skill'),
          studentId: userId,
          skillId: input.skillId,
          skillName: input.skillName,
          level: input.level,
          evidenceIds: [],
        };
        list.push(saved);
      }
      d.studentSkills[userId] = list;
    });

    return saved;
  },

  async removeSkill(skillId: string): Promise<void> {
    await delay(150);
    const userId = await requireUserId();
    await mockDb.update((d) => {
      d.studentSkills[userId] = (d.studentSkills[userId] ?? []).filter((s) => s.skillId !== skillId);
    });
  },

  async listCourses(): Promise<StudentCourse[]> {
    await delay(150);
    const userId = await requireUserId();
    const db = await mockDb.get();
    return db.studentCourses[userId] ?? [];
  },

  async addCourse(input: Pick<StudentCourse, 'courseName' | 'category' | 'completed'>): Promise<StudentCourse> {
    await delay(150);
    const userId = await requireUserId();

    let saved!: StudentCourse;
    await mockDb.update((d) => {
      saved = { id: newId('course'), studentId: userId, ...input };
      d.studentCourses[userId] = [...(d.studentCourses[userId] ?? []), saved];
    });

    return saved;
  },

  async listProjects(): Promise<StudentProject[]> {
    await delay(150);
    const userId = await requireUserId();
    const db = await mockDb.get();
    return db.studentProjects[userId] ?? [];
  },

  async createProject(input: StudentProjectInput): Promise<StudentProject> {
    await delay();
    const userId = await requireUserId();

    let saved!: StudentProject;
    await mockDb.update((d) => {
      saved = {
        id: newId('project'),
        studentId: userId,
        title: input.title,
        summary: input.summary,
        roleDescription: input.roleDescription,
        skillIds: input.skillIds,
        resultUrl: input.resultUrl,
        repositoryUrl: input.repositoryUrl,
        imageUrls: [],
        source: input.source,
      };
      d.studentProjects[userId] = [...(d.studentProjects[userId] ?? []), saved];

      const profile = d.studentProfiles[userId];
      if (profile) {
        const skillCount = (d.studentSkills[userId] ?? []).length;
        const projectCount = d.studentProjects[userId].length;
        profile.profileCompletion = computeCompletion(profile, skillCount, projectCount);
      }
    });

    return saved;
  },
};
