import type {
  Application,
  ApplicationDetail,
  ApplicationInput,
  ApplicationSummary,
  CursorPage,
  JobOffer,
} from '@/domain/contracts/types';
import { requireSupabase } from '@/lib/supabase';
import type { StudentApplicationRepository } from '@/repositories/interfaces/StudentApplicationRepository';
import { jobSelect, mapApplication, mapJob, mapOffer, newRequestId, type DbRow } from './mappers';

const PAGE_SIZE = 12;

function summary(row: DbRow): ApplicationSummary {
  const application = mapApplication(row);
  const job = mapJob(Array.isArray(row.jobs) ? row.jobs[0] : row.jobs);
  return {
    ...application,
    job: {
      id: job.id,
      title: job.title,
      employerName: job.employerName,
      category: job.category,
      compensationType: job.compensationType,
      compensationMin: job.compensationMin,
      compensationMax: job.compensationMax,
      currency: job.currency,
    },
  };
}

export const supabaseStudentApplicationRepository: StudentApplicationRepository = {
  async submitApplication(input: ApplicationInput): Promise<Application> {
    const { data, error } = await requireSupabase().rpc('apply_to_job_v2', {
      target_job_id: input.jobId,
      application_available_start: input.availableStartDate ?? null,
      application_availability_note: input.availabilityNote ?? null,
      application_short_answer: input.shortAnswer ?? null,
      idempotency_key: newRequestId(),
    });
    if (error) throw new Error(error.message);
    return mapApplication(data as DbRow);
  },
  async listMyApplications(cursor?: string): Promise<CursorPage<ApplicationSummary>> {
    let request = requireSupabase()
      .from('applications')
      .select(`*, jobs(${jobSelect})`)
      .order('submitted_at', { ascending: false })
      .limit(PAGE_SIZE);
    if (cursor) request = request.lt('submitted_at', cursor);
    const { data, error } = await request;
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as DbRow[];
    return { items: rows.map(summary), nextCursor: rows.length === PAGE_SIZE ? rows[rows.length - 1]?.submitted_at : undefined };
  },
  async getMyApplication(applicationId: string): Promise<ApplicationDetail> {
    const { data, error } = await requireSupabase().from('applications').select(`*, jobs(${jobSelect})`).eq('id', applicationId).single();
    if (error) throw new Error(error.message);
    const application = mapApplication(data as DbRow);
    const job = mapJob(Array.isArray((data as DbRow).jobs) ? (data as DbRow).jobs[0] : (data as DbRow).jobs);
    return { ...application, job };
  },
  async withdrawApplication(applicationId: string): Promise<Application> {
    const { data, error } = await requireSupabase().rpc('withdraw_application', { target_application_id: applicationId });
    if (error) throw new Error(error.message);
    return mapApplication(data as DbRow);
  },
  async listMyOffers(cursor?: string): Promise<CursorPage<JobOffer>> {
    let request = requireSupabase()
      .from('job_offers')
      .select('*, jobs(title, organizations(name, verification_status))')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);
    if (cursor) request = request.lt('created_at', cursor);
    const { data, error } = await request;
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as DbRow[];
    return { items: rows.map(mapOffer), nextCursor: rows.length === PAGE_SIZE ? rows[rows.length - 1]?.created_at : undefined };
  },
  async respondToOffer(offerId: string, decision: 'accept' | 'decline'): Promise<JobOffer> {
    const { data, error } = await requireSupabase().rpc('respond_to_offer', {
      offer_id: offerId,
      accept: decision === 'accept',
      idempotency_key: newRequestId(),
    });
    if (error) throw new Error(error.message);
    return mapOffer(data as DbRow);
  },
};
