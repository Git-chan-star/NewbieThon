import type { WorkItem } from '@/domain/contracts/types';
import { requireSupabase } from '@/lib/supabase';
import type { WorkRepository } from '@/repositories/interfaces/WorkRepository';
import { newRequestId, type DbRow } from './mappers';

function mapWork(row: DbRow): WorkItem {
  const job = Array.isArray(row.jobs) ? row.jobs[0] : row.jobs;
  return {
    id: row.id,
    jobId: row.job_id,
    jobTitle: job?.title ?? '전공 업무',
    employerId: row.employer_id,
    studentId: row.student_id,
    status: row.status,
    agreedScope: row.agreed_scope,
    agreedDeliverables: row.agreed_deliverables ?? [],
    compensationType: row.agreed_compensation_type,
    compensationAmount: row.agreed_compensation_amount ?? undefined,
    startDate: row.agreed_start_date ?? undefined,
    endDate: row.agreed_end_date ?? undefined,
    deliverables: ((row.engagement_deliverables ?? []) as DbRow[]).map((item) => ({ id: item.id, title: item.title, note: item.note ?? undefined, externalUrl: item.external_url ?? undefined, submittedAt: item.submitted_at })),
    createdAt: row.created_at,
  };
}

const select = '*, jobs(title), engagement_deliverables(*)';
export const supabaseWorkRepository: WorkRepository = {
  async listWork() { const { data, error } = await requireSupabase().from('engagements').select(select).order('updated_at', { ascending: false }); if (error) throw new Error(error.message); return ((data ?? []) as DbRow[]).map(mapWork); },
  async getWork(id) { const { data, error } = await requireSupabase().from('engagements').select(select).eq('id', id).single(); if (error) throw new Error(error.message); return mapWork(data as DbRow); },
  async startWork(id) { const { error } = await requireSupabase().rpc('start_engagement', { engagement_id: id }); if (error) throw new Error(error.message); },
  async submitDeliverable(id, title, note, externalUrl) { const { error } = await requireSupabase().rpc('submit_deliverable', { target_engagement_id: id, target_title: title, target_note: note ?? null, target_external_url: externalUrl ?? null, target_file_path: null, request_idempotency_key: newRequestId() }); if (error) throw new Error(error.message); },
  async requestRevision(id, note) { const { error } = await requireSupabase().rpc('request_revision', { engagement_id: id, revision_note: note }); if (error) throw new Error(error.message); },
  async completeWork(id) { const { error } = await requireSupabase().rpc('complete_engagement', { engagement_id: id, idempotency_key: newRequestId() }); if (error) throw new Error(error.message); },
};
