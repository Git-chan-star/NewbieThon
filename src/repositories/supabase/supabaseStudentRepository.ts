import type {
  StudentCourse,
  StudentProfile,
  StudentProfileUpdate,
  StudentProject,
  StudentProjectInput,
  StudentSkill,
  StudentSkillInput,
} from '@/domain/contracts/types';
import { requireSupabase } from '@/lib/supabase';
import type { StudentRepository } from '@/repositories/interfaces/StudentRepository';
import { mapCourse, mapProfile, mapProject, mapSkill, toDbSkillLevel, type DbRow } from './mappers';

async function userId(): Promise<string> {
  const { data, error } = await requireSupabase().auth.getUser();
  if (error || !data.user) throw new Error(error?.message ?? '로그인이 필요해요.');
  return data.user.id;
}

function profileUpdate(input: Partial<StudentProfile>): DbRow {
  const output: DbRow = {};
  if (input.schoolName !== undefined) output.school = input.schoolName;
  if (input.majorName !== undefined) output.major = input.majorName;
  if (input.gradeYear !== undefined) output.school_year = input.gradeYear;
  if (input.bio !== undefined) output.introduction = input.bio;
  if (input.interests !== undefined) output.interests = input.interests;
  if (input.preferredJobCategories !== undefined) output.preferred_job_categories = input.preferredJobCategories;
  if (input.preferredWorkModes !== undefined) output.work_modes = input.preferredWorkModes;
  if (input.availableHoursPerWeek !== undefined) output.available_hours_per_week = input.availableHoursPerWeek;
  if (input.availableDays !== undefined) output.available_days = input.availableDays;
  if (input.profileCompletion !== undefined) output.profile_completion = input.profileCompletion;
  if (input.isDiscoverable !== undefined) output.discoverable = input.isDiscoverable;
  return output;
}

async function saveProfile(input: Partial<StudentProfile>): Promise<StudentProfile> {
  const id = await userId();
  const { data, error } = await requireSupabase()
    .from('student_profiles')
    .update(profileUpdate(input))
    .eq('user_id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapProfile(data as DbRow);
}

export const supabaseStudentRepository: StudentRepository = {
  async getMyProfile() {
    const id = await userId();
    const { data, error } = await requireSupabase().from('student_profiles').select('*').eq('user_id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapProfile(data as DbRow) : null;
  },
  saveOnboardingStep: saveProfile,
  updateProfile: (input: StudentProfileUpdate) => saveProfile(input),
  async listSkills(): Promise<StudentSkill[]> {
    const id = await userId();
    const { data, error } = await requireSupabase().from('student_skills').select('*, skills(name)').eq('student_id', id);
    if (error) throw new Error(error.message);
    return (data as DbRow[]).map(mapSkill);
  },
  async upsertSkill(input: StudentSkillInput): Promise<StudentSkill> {
    const id = await userId();
    let query = requireSupabase().from('skills').select('id,name');
    query = /^[0-9a-f-]{36}$/i.test(input.skillId) ? query.eq('id', input.skillId) : query.ilike('name', input.skillName);
    const { data: skill, error: skillError } = await query.limit(1).single();
    if (skillError) throw new Error(`기술 목록에서 ${input.skillName}을 찾을 수 없어요.`);
    const { data, error } = await requireSupabase()
      .from('student_skills')
      .upsert({ student_id: id, skill_id: skill.id, level: toDbSkillLevel[input.level] })
      .select('*, skills(name)')
      .single();
    if (error) throw new Error(error.message);
    return mapSkill(data as DbRow);
  },
  async removeSkill(skillId: string): Promise<void> {
    const id = await userId();
    const { error } = await requireSupabase().from('student_skills').delete().eq('student_id', id).eq('skill_id', skillId);
    if (error) throw new Error(error.message);
  },
  async listCourses(): Promise<StudentCourse[]> {
    const id = await userId();
    const { data, error } = await requireSupabase().from('student_courses').select('*').eq('student_id', id);
    if (error) throw new Error(error.message);
    return (data as DbRow[]).map(mapCourse);
  },
  async addCourse(input): Promise<StudentCourse> {
    const id = await userId();
    const { data, error } = await requireSupabase().from('student_courses').insert({
      student_id: id,
      name: input.courseName,
      provider: input.category ?? null,
      completed_at: input.completed ? new Date().toISOString().slice(0, 10) : null,
    }).select().single();
    if (error) throw new Error(error.message);
    return mapCourse(data as DbRow);
  },
  async listProjects(): Promise<StudentProject[]> {
    const id = await userId();
    const { data, error } = await requireSupabase().from('student_projects').select('*').eq('student_id', id);
    if (error) throw new Error(error.message);
    return (data as DbRow[]).map(mapProject);
  },
  async createProject(input: StudentProjectInput): Promise<StudentProject> {
    const id = await userId();
    const { data, error } = await requireSupabase().from('student_projects').insert({
      student_id: id,
      title: input.title,
      description: input.summary,
      role_description: input.roleDescription,
      skills: input.skillIds,
      project_url: input.resultUrl ?? null,
      repository_url: input.repositoryUrl ?? null,
      project_type: input.source,
    }).select().single();
    if (error) throw new Error(error.message);
    return mapProject(data as DbRow);
  },
};
