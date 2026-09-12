import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { SkillLevel, WorkMode } from '@/domain/contracts/types';

export interface DraftSkill {
  skillId: string;
  skillName: string;
  level: SkillLevel;
}

export interface DraftCourse {
  courseName: string;
  category?: string;
  completed: boolean;
}

export interface DraftProject {
  title: string;
  summary: string;
  roleDescription: string;
  skillIds: string[];
  source: 'class' | 'personal' | 'club' | 'competition';
}

interface OnboardingDraft {
  schoolName: string;
  majorName: string;
  gradeYear: 1 | 2 | 3 | 4 | 5 | 6;
  interests: string[];
  skills: DraftSkill[];
  courses: DraftCourse[];
  projects: DraftProject[];
  preferredJobCategories: string[];
  preferredWorkModes: WorkMode[];
  availableDays: string[];
  availableHoursPerWeek?: number;
}

interface OnboardingState {
  draft: OnboardingDraft;
  updateDraft: (patch: Partial<OnboardingDraft>) => void;
  addSkill: (skill: DraftSkill) => void;
  removeSkill: (skillId: string) => void;
  addCourse: (course: DraftCourse) => void;
  addProject: (project: DraftProject) => void;
  reset: () => void;
}

const emptyDraft: OnboardingDraft = {
  schoolName: '',
  majorName: '',
  gradeYear: 1,
  interests: [],
  skills: [],
  courses: [],
  projects: [],
  preferredJobCategories: [],
  preferredWorkModes: [],
  availableDays: [],
  availableHoursPerWeek: undefined,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      draft: emptyDraft,
      updateDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
      addSkill: (skill) =>
        set((s) => ({
          draft: {
            ...s.draft,
            skills: [...s.draft.skills.filter((sk) => sk.skillId !== skill.skillId), skill],
          },
        })),
      removeSkill: (skillId) =>
        set((s) => ({ draft: { ...s.draft, skills: s.draft.skills.filter((sk) => sk.skillId !== skillId) } })),
      addCourse: (course) => set((s) => ({ draft: { ...s.draft, courses: [...s.draft.courses, course] } })),
      addProject: (project) => set((s) => ({ draft: { ...s.draft, projects: [...s.draft.projects, project] } })),
      reset: () => set({ draft: emptyDraft }),
    }),
    {
      name: 'newbiethon:onboarding-draft',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
