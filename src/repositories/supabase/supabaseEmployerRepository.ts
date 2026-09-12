import type {
  EmployerApplicant,
  EmployerJobInput,
  EmployerOnboardingInput,
  EmployerProfile,
  Job,
  JobStatus,
  StudentProfile,
} from '@/domain/contracts/types';
import { requireSupabase } from '@/lib/supabase';
import type { EmployerRepository } from '@/repositories/interfaces/EmployerRepository';
import { SupabaseMarketplaceRepository } from './marketplace';
import { jobSelect, mapJob, mapProfile, newRequestId, type DbRow } from './mappers';

async function authId(): Promise<string> {
  const { data, error } = await requireSupabase().auth.getUser();
  if (error || !data.user) throw new Error(error?.message ?? '로그인이 필요해요.');
  return data.user.id;
}

function mapEmployer(row: DbRow): EmployerProfile {
  const organization = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
  return {
    userId: row.user_id,
    organizationName: organization?.name ?? '',
    organizationType: organization?.organization_type ?? '',
    industry: organization?.industry ?? undefined,
    introduction: organization?.introduction ?? undefined,
    verificationStatus: row.verification_status,
    logoUrl: organization?.logo_url ?? undefined,
  };
}

export const supabaseEmployerRepository: EmployerRepository = {
  async getMyProfile() {
    const id = await authId();
    const { data, error } = await requireSupabase()
      .from('employer_profiles')
      .select('*, organizations(*)')
      .eq('user_id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapEmployer(data as DbRow) : null;
  },
  async onboard(input: EmployerOnboardingInput): Promise<EmployerProfile> {
    const client = requireSupabase();
    const marketplace = new SupabaseMarketplaceRepository(client);
    await marketplace.onboardEmployer({
      organizationName: input.organizationName,
      organizationType: input.organizationType,
      organizationIndustry: input.industry,
      organizationIntroduction: input.introduction,
      contactName: input.contactName,
      contactPosition: input.position,
      contactWorkEmail: input.workEmail,
      contactHours: input.contactHours,
    });
    const profile = await this.getMyProfile();
    if (!profile) throw new Error('구인자 프로필을 불러오지 못했어요.');
    return profile;
  },
  async listMyJobs(): Promise<Job[]> {
    const id = await authId();
    const { data, error } = await requireSupabase().from('jobs').select(jobSelect).eq('employer_id', id).order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as DbRow[]).map(mapJob);
  },
  async createAndPublishJob(input: EmployerJobInput): Promise<Job> {
    const client = requireSupabase();
    const id = await authId();
    const { data: profile, error: profileError } = await client.from('employer_profiles').select('organization_id').eq('user_id', id).single();
    if (profileError) throw new Error(profileError.message);
    const marketplace = new SupabaseMarketplaceRepository(client);
    const draft = await marketplace.createJobDraft({
      organization_id: profile.organization_id,
      employer_id: id,
      title: input.title,
      category: input.category,
      summary: input.summary,
      tasks: input.responsibilities,
      deliverables: input.deliverables,
      no_specific_skill: true,
      beginner_friendly: input.beginnerFriendly,
      feedback_provided: input.educationOrFeedback,
      work_mode: input.workMode,
      location: input.locationText,
      starts_on: input.startDate,
      ends_on: input.endDate,
      weekly_hours: input.hoursPerWeek,
      openings: input.headcount,
      apply_deadline: input.applicationDeadline,
      compensation_type: input.compensationType,
      compensation_min: input.compensationMin,
    });
    await marketplace.publishJob(draft.id as string, newRequestId());
    const { data, error } = await client.from('jobs').select(jobSelect).eq('id', draft.id).single();
    if (error) throw new Error(error.message);
    return mapJob(data as DbRow);
  },
  async changeJobStatus(jobId: string, status: Extract<JobStatus, 'paused' | 'closed' | 'filled'>): Promise<void> {
    await new SupabaseMarketplaceRepository(requireSupabase()).changeJobStatus(jobId, status);
  },
  async listApplicants(jobId: string): Promise<EmployerApplicant[]> {
    const rows = await new SupabaseMarketplaceRepository(requireSupabase()).listApplicants(jobId);
    return rows.map((raw) => {
      const row = raw as DbRow;
      const snapshot = row.profile_snapshot ?? {};
      return {
        id: row.id,
        jobId: row.job_id,
        studentId: row.student_id,
        displayName: snapshot.displayName ?? '학생',
        schoolName: snapshot.school ?? undefined,
        majorName: snapshot.major ?? undefined,
        status: row.status,
        shortAnswer: row.short_answer ?? row.message ?? undefined,
        submittedAt: row.submitted_at,
      };
    });
  },
  async changeApplicantStatus(applicationId, status): Promise<void> {
    const client = requireSupabase();
    const marketplace = new SupabaseMarketplaceRepository(client);
    if (status === 'accepted') {
      const { error } = await client.rpc('accept_application_and_create_engagement', {
        target_application_id: applicationId,
        application_status_key: newRequestId(),
        engagement_key: newRequestId(),
      });
      if (error) throw new Error(error.message);
    } else {
      await marketplace.changeApplicationStatus(applicationId, status, newRequestId());
    }
  },
  async searchStudents(keyword: string): Promise<StudentProfile[]> {
    const rows = await new SupabaseMarketplaceRepository(requireSupabase()).searchDiscoverableStudents(keyword);
    return rows.map((row) => mapProfile(row as DbRow));
  },
};
