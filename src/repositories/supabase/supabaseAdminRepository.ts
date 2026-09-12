import type {
  AdminOverview,
  AdminReport,
  AdminUserSummary,
  AdminVerification,
} from '@/domain/contracts/types';
import { requireSupabase } from '@/lib/supabase';
import type { AdminRepository } from '@/repositories/interfaces/AdminRepository';
import { jobSelect, mapJob, type DbRow } from './mappers';

function relation(value: unknown): DbRow {
  return (Array.isArray(value) ? value[0] : value ?? {}) as DbRow;
}

async function count(table: string, configure?: (query: any) => any): Promise<number> {
  let query = requireSupabase().from(table).select('*', { count: 'exact', head: true });
  if (configure) query = configure(query);
  const { count: value, error } = await query;
  if (error) throw new Error(error.message);
  return value ?? 0;
}

export const supabaseAdminRepository: AdminRepository = {
  async getOverview(): Promise<AdminOverview> {
    const [totalUsers, activeStudents, activeEmployers, publishedJobs, pendingVerifications, openReports] = await Promise.all([
      count('users'),
      count('users', (query) => query.eq('role', 'student').eq('is_active', true)),
      count('users', (query) => query.eq('role', 'employer').eq('is_active', true)),
      count('jobs', (query) => query.eq('status', 'published')),
      count('employer_profiles', (query) => query.eq('verification_status', 'pending')),
      count('reports', (query) => query.in('status', ['received', 'reviewing'])),
    ]);
    return { totalUsers, activeStudents, activeEmployers, publishedJobs, pendingVerifications, openReports };
  },

  async listUsers(): Promise<AdminUserSummary[]> {
    const { data, error } = await requireSupabase()
      .from('users')
      .select('id, display_name, role, is_active, created_at')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as DbRow[]).map((row) => ({
      id: row.id,
      displayName: row.display_name,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
    }));
  },

  async setUserActive(userId, isActive) {
    const { error } = await requireSupabase().rpc('admin_set_user_active', {
      target_user_id: userId,
      active: isActive,
    });
    if (error) throw new Error(error.message);
  },

  async listJobs() {
    const { data, error } = await requireSupabase()
      .from('jobs')
      .select(jobSelect)
      .order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as DbRow[]).map(mapJob);
  },

  async setJobStatus(jobId, status) {
    const { error } = await requireSupabase().rpc('admin_set_job_status', {
      target_job_id: jobId,
      next_status: status,
    });
    if (error) throw new Error(error.message);
  },

  async listVerifications(): Promise<AdminVerification[]> {
    const { data, error } = await requireSupabase()
      .from('employer_profiles')
      .select('user_id, organization_id, contact_name, work_email, verification_status, verification_document_path, created_at, organizations(name)')
      .in('verification_status', ['pending', 'unverified', 'rejected'])
      .order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as DbRow[]).map((row) => ({
      userId: row.user_id,
      organizationId: row.organization_id,
      organizationName: relation(row.organizations).name ?? '조직 이름 없음',
      contactName: row.contact_name,
      workEmail: row.work_email,
      status: row.verification_status,
      documentPath: row.verification_document_path ?? undefined,
      submittedAt: row.created_at,
    }));
  },

  async reviewVerification(userId, decision, note) {
    const { error } = await requireSupabase().rpc('admin_review_employer_verification', {
      target_user_id: userId,
      decision,
      decision_note: note ?? null,
    });
    if (error) throw new Error(error.message);
  },

  async listReports(): Promise<AdminReport[]> {
    const { data, error } = await requireSupabase()
      .from('reports')
      .select('id, reporter_id, target_type, target_id, reason_code, detail, status, assigned_admin_id, created_at')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as DbRow[]).map((row) => ({
      id: row.id,
      reporterId: row.reporter_id,
      targetType: row.target_type,
      targetId: row.target_id,
      reasonCode: row.reason_code,
      detail: row.detail ?? undefined,
      status: row.status,
      assignedAdminId: row.assigned_admin_id ?? undefined,
      createdAt: row.created_at,
    }));
  },

  async setReportStatus(reportId, status) {
    const { error } = await requireSupabase().rpc('admin_set_report_status', {
      target_report_id: reportId,
      next_status: status,
    });
    if (error) throw new Error(error.message);
  },
};
