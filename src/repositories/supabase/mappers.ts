import type {
  Application,
  Job,
  JobOffer,
  SkillLevel,
  StudentCourse,
  StudentProfile,
  StudentProject,
  StudentSkill,
} from '@/domain/contracts/types';

export type DbRow = Record<string, any>;

export const toDbSkillLevel: Record<SkillLevel, string> = {
  learned: 'learning',
  basic: 'basic',
  project_used: 'independent',
  work_ready: 'advanced',
};

export function toSkillLevel(value?: string): SkillLevel {
  if (value === 'advanced') return 'work_ready';
  if (value === 'independent') return 'project_used';
  if (value === 'basic') return 'basic';
  return 'learned';
}

function relation(row: unknown): DbRow {
  if (Array.isArray(row)) return (row[0] ?? {}) as DbRow;
  return (row ?? {}) as DbRow;
}

export function mapProfile(row: DbRow): StudentProfile {
  return {
    userId: row.user_id,
    schoolName: row.school ?? '',
    majorName: row.major ?? '',
    gradeYear: row.school_year ?? 1,
    verificationStatus: row.verification_status,
    bio: row.introduction ?? undefined,
    interests: row.interests ?? [],
    preferredJobCategories: row.preferred_job_categories ?? [],
    preferredWorkModes: row.work_modes ?? [],
    availableHoursPerWeek: row.available_hours_per_week ?? undefined,
    availableDays: row.available_days ?? [],
    profileCompletion: row.profile_completion ?? 0,
    isDiscoverable: row.discoverable ?? false,
  };
}

export function mapSkill(row: DbRow): StudentSkill {
  const skill = relation(row.skills);
  return {
    id: `${row.student_id}:${row.skill_id}`,
    studentId: row.student_id,
    skillId: row.skill_id,
    skillName: skill.name ?? row.skill_name ?? '',
    level: toSkillLevel(row.level),
    evidenceIds: [],
  };
}

export function mapCourse(row: DbRow): StudentCourse {
  return {
    id: row.id,
    studentId: row.student_id,
    courseName: row.name,
    category: row.provider ?? undefined,
    completed: Boolean(row.completed_at),
  };
}

export function mapProject(row: DbRow): StudentProject {
  return {
    id: row.id,
    studentId: row.student_id,
    title: row.title,
    summary: row.description ?? '',
    roleDescription: row.role_description ?? '',
    skillIds: row.skills ?? [],
    resultUrl: row.project_url ?? undefined,
    repositoryUrl: row.repository_url ?? undefined,
    imageUrls: row.image_urls ?? [],
    source: row.project_type === 'course' ? 'class' : row.project_type,
    startDate: row.starts_on ?? undefined,
    endDate: row.ends_on ?? undefined,
  };
}

export function mapJob(row: DbRow): Job {
  const organization = relation(row.organizations);
  const requirementRows = (row.job_skill_requirements ?? []) as DbRow[];
  const difficulty = row.difficulty === 'learning' ? 'beginner' : row.difficulty === 'basic' ? 'basic' : 'intermediate';
  return {
    id: row.id,
    employerId: row.employer_id,
    employerName: organization.name ?? '구인자',
    employerVerified: organization.verification_status === 'verified',
    title: row.title,
    category: row.category ?? '기타',
    summary: row.summary ?? '',
    responsibilities: row.tasks ?? [],
    deliverables: row.deliverables ?? [],
    requiredSkills: requirementRows.map((requirement) => {
      const skill = relation(requirement.skills);
      return {
        skillId: requirement.skill_id,
        skillName: skill.name ?? '',
        minimumLevel: toSkillLevel(requirement.minimum_level),
        required: requirement.is_required,
      };
    }),
    difficulty,
    beginnerFriendly: row.beginner_friendly,
    educationOrFeedback: row.feedback_provided,
    workMode: row.work_mode ?? 'remote',
    locationText: row.location ?? undefined,
    estimatedHours: row.estimated_total_hours ?? undefined,
    hoursPerWeek: row.weekly_hours ?? undefined,
    startDate: row.starts_on ?? undefined,
    endDate: row.ends_on ?? undefined,
    compensationType: row.compensation_type ?? 'negotiable',
    compensationMin: row.compensation_min ?? undefined,
    compensationMax: row.compensation_max ?? undefined,
    currency: 'KRW',
    headcount: row.openings ?? 1,
    applicationDeadline: row.apply_deadline ?? undefined,
    status: row.status,
    publishedAt: row.published_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapApplication(row: DbRow): Application {
  return {
    id: row.id,
    jobId: row.job_id,
    studentId: row.student_id,
    status: row.status,
    availableStartDate: row.available_start_date ?? undefined,
    availabilityNote: row.availability_note ?? undefined,
    shortAnswer: row.short_answer ?? row.message ?? undefined,
    submittedProfileSnapshot: row.profile_snapshot ?? {},
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at,
  };
}

export function mapOffer(row: DbRow): JobOffer {
  const job = relation(row.jobs);
  const organization = relation(job.organizations);
  return {
    id: row.id,
    jobId: row.job_id,
    jobTitle: job.title ?? '',
    employerId: row.employer_id,
    employerName: organization.name ?? '구인자',
    employerVerified: organization.verification_status === 'verified',
    studentId: row.student_id,
    message: row.message ?? row.reason,
    status: row.status,
    expiresAt: row.expires_at ?? undefined,
    createdAt: row.created_at,
  };
}

export function newRequestId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export const jobSelect = `
  *,
  organizations(name, verification_status),
  job_skill_requirements(skill_id, minimum_level, is_required, skills(name))
`;
