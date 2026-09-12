import type {
  StudentCourse,
  StudentProfile,
  StudentProfileUpdate,
  StudentProject,
  StudentProjectInput,
  StudentSkill,
  StudentSkillInput,
} from '@/domain/contracts/types';

export interface StudentRepository {
  getMyProfile(): Promise<StudentProfile | null>;
  saveOnboardingStep(input: Partial<StudentProfile>): Promise<StudentProfile>;
  updateProfile(input: StudentProfileUpdate): Promise<StudentProfile>;
  listSkills(): Promise<StudentSkill[]>;
  upsertSkill(input: StudentSkillInput): Promise<StudentSkill>;
  removeSkill(skillId: string): Promise<void>;
  listCourses(): Promise<StudentCourse[]>;
  addCourse(input: Pick<StudentCourse, 'courseName' | 'category' | 'completed'>): Promise<StudentCourse>;
  listProjects(): Promise<StudentProject[]>;
  createProject(input: StudentProjectInput): Promise<StudentProject>;
}
