import type { SupabaseClient } from "@supabase/supabase-js";

type Row = Record<string, unknown>;

export interface EmployerOnboardingInput {
  organizationName: string;
  organizationType: string;
  organizationIndustry?: string;
  organizationIntroduction?: string;
  contactName: string;
  contactPosition?: string;
  contactWorkEmail: string;
  contactHours?: string;
}

export interface JobDraftInput {
  organization_id: string;
  employer_id: string;
  title?: string;
  category?: string;
  summary?: string;
  tasks?: string[];
  deliverables?: string[];
  provided_resources?: string[];
  difficulty?: "learning" | "basic" | "independent" | "advanced";
  no_specific_skill?: boolean;
  beginner_friendly?: boolean;
  feedback_provided?: boolean;
  work_mode?: "remote" | "onsite" | "hybrid";
  location?: string;
  starts_on?: string;
  ends_on?: string;
  estimated_total_hours?: number;
  weekly_hours?: number;
  openings?: number;
  apply_deadline?: string;
  compensation_type?: "hourly" | "daily" | "fixed" | "monthly" | "negotiable";
  compensation_min?: number;
  compensation_max?: number;
  payment_timing?: string;
}

export interface EngagementTerms {
  sourceApplicationId?: string;
  sourceOfferId?: string;
  agreedScope: string;
  agreedDeliverables: string[];
  agreedStartDate?: string;
  agreedEndDate?: string;
  agreedCompensationType: "hourly" | "daily" | "fixed" | "monthly" | "negotiable";
  agreedCompensationAmount?: number;
}

function requireData<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error("서버 응답에 데이터가 없습니다.");
  return result.data;
}

/**
 * 화면은 테이블을 조합하거나 상태 규칙을 재구현하지 않고 이 계층을 호출한다.
 * 상태를 바꾸는 메서드는 반드시 서버 RPC를 사용한다.
 */
export class SupabaseMarketplaceRepository {
  constructor(private readonly client: SupabaseClient) {}

  async onboardEmployer(input: EmployerOnboardingInput): Promise<Row> {
    const result = await this.client.rpc("onboard_employer", {
      organization_name: input.organizationName,
      organization_type: input.organizationType,
      organization_industry: input.organizationIndustry ?? null,
      organization_introduction: input.organizationIntroduction ?? null,
      contact_name: input.contactName,
      contact_position: input.contactPosition ?? null,
      contact_work_email: input.contactWorkEmail,
      contact_hours: input.contactHours ?? null,
    });
    return requireData(result) as Row;
  }

  async submitEmployerVerification(documentPath: string): Promise<Row> {
    const result = await this.client.rpc("submit_employer_verification", {
      document_path: documentPath,
    });
    return requireData(result) as Row;
  }

  async createJobDraft(input: JobDraftInput): Promise<Row> {
    const result = await this.client.from("jobs").insert(input).select().single();
    return requireData(result) as Row;
  }

  async updateJobDraft(jobId: string, input: Partial<JobDraftInput>): Promise<Row> {
    const immutable = { ...input };
    delete immutable.organization_id;
    delete immutable.employer_id;
    const result = await this.client.from("jobs").update(immutable).eq("id", jobId).select().single();
    return requireData(result) as Row;
  }

  async validateJobForPublish(jobId: string): Promise<{
    valid: boolean;
    errors: string[];
    employerVerification: string;
    showsUnverifiedBadge: boolean;
  }> {
    const result = await this.client.rpc("validate_job_for_publish", { target_job_id: jobId });
    return requireData(result) as {
      valid: boolean;
      errors: string[];
      employerVerification: string;
      showsUnverifiedBadge: boolean;
    };
  }

  async publishJob(jobId: string, idempotencyKey: string): Promise<Row> {
    const result = await this.client.rpc("publish_job", {
      target_job_id: jobId,
      idempotency_key: idempotencyKey,
    });
    return requireData(result) as Row;
  }

  async changeJobStatus(jobId: string, nextStatus: "paused" | "closed" | "filled"): Promise<Row> {
    const result = await this.client.rpc("change_job_status", {
      target_job_id: jobId,
      next_status: nextStatus,
    });
    return requireData(result) as Row;
  }

  async listMyJobs(employerId: string, cursor?: string, limit = 20): Promise<Row[]> {
    let query = this.client
      .from("jobs")
      .select("*, applications(count)")
      .eq("employer_id", employerId)
      .order("updated_at", { ascending: false })
      .limit(Math.min(limit, 50));
    if (cursor) query = query.lt("updated_at", cursor);
    const result = await query;
    return requireData(result) as Row[];
  }

  async listApplicants(jobId: string, cursor?: string, limit = 20): Promise<Row[]> {
    let query = this.client
      .from("applications")
      .select("*")
      .eq("job_id", jobId)
      .order("submitted_at", { ascending: false })
      .limit(Math.min(limit, 50));
    if (cursor) query = query.lt("submitted_at", cursor);
    const result = await query;
    return requireData(result) as Row[];
  }

  async changeApplicationStatus(
    applicationId: string,
    nextStatus: "viewed" | "chatting" | "interview" | "accepted" | "rejected",
    idempotencyKey: string,
  ): Promise<Row> {
    const result = await this.client.rpc("change_application_status", {
      target_application_id: applicationId,
      next_status: nextStatus,
      idempotency_key: idempotencyKey,
    });
    return requireData(result) as Row;
  }

  async searchDiscoverableStudents(search: string, limit = 20): Promise<Row[]> {
    const escapedSearch = search.replaceAll("%", "\\%").replaceAll("_", "\\_");
    const result = await this.client
      .from("student_profiles")
      .select("user_id, school, major, school_year, interests, available_hours_per_week, work_modes, verification_status")
      .eq("discoverable", true)
      .or(`major.ilike.%${escapedSearch}%,school.ilike.%${escapedSearch}%`)
      .limit(Math.min(limit, 50));
    return requireData(result) as Row[];
  }

  async sendJobOffer(input: {
    jobId: string;
    studentId: string;
    reason: string;
    message?: string;
    expiresAt: string;
    idempotencyKey: string;
  }): Promise<Row> {
    const result = await this.client.rpc("send_job_offer", {
      target_job_id: input.jobId,
      target_student_id: input.studentId,
      offer_reason: input.reason,
      offer_message: input.message ?? null,
      offer_expires_at: input.expiresAt,
      idempotency_key: input.idempotencyKey,
    });
    return requireData(result) as Row;
  }

  async listConversations(cursor?: string, limit = 20): Promise<Row[]> {
    let query = this.client
      .from("conversations")
      .select("*, conversation_participants(*), messages(*)")
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(Math.min(limit, 50));
    if (cursor) query = query.lt("last_message_at", cursor);
    const result = await query;
    return requireData(result) as Row[];
  }

  async listMessages(conversationId: string, cursor?: string, limit = 30): Promise<Row[]> {
    let query = this.client
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(Math.min(limit, 100));
    if (cursor) query = query.lt("created_at", cursor);
    const result = await query;
    return requireData(result) as Row[];
  }

  async sendMessage(input: {
    conversationId: string;
    type: "text" | "file";
    body?: string;
    attachmentPath?: string;
    clientMessageId: string;
  }): Promise<Row> {
    const result = await this.client.rpc("send_message", {
      target_conversation_id: input.conversationId,
      target_message_type: input.type,
      target_message_body: input.body ?? null,
      target_attachment_path: input.attachmentPath ?? null,
      target_client_message_id: input.clientMessageId,
    });
    return requireData(result) as Row;
  }

  async createEngagement(input: EngagementTerms, idempotencyKey: string): Promise<Row> {
    const result = await this.client.rpc("create_engagement", {
      source_application_id: input.sourceApplicationId ?? null,
      source_offer_id: input.sourceOfferId ?? null,
      agreed_scope: input.agreedScope,
      agreed_deliverables: input.agreedDeliverables,
      agreed_start_date: input.agreedStartDate ?? null,
      agreed_end_date: input.agreedEndDate ?? null,
      agreed_compensation_type: input.agreedCompensationType,
      agreed_compensation_amount: input.agreedCompensationAmount ?? null,
      idempotency_key: idempotencyKey,
    });
    return requireData(result) as Row;
  }

  async startEngagement(engagementId: string): Promise<Row> {
    const result = await this.client.rpc("start_engagement", { engagement_id: engagementId });
    return requireData(result) as Row;
  }

  async requestRevision(engagementId: string, note: string): Promise<Row> {
    const result = await this.client.rpc("request_revision", {
      engagement_id: engagementId,
      revision_note: note,
    });
    return requireData(result) as Row;
  }

  async completeEngagement(engagementId: string, idempotencyKey: string): Promise<Row> {
    const result = await this.client.rpc("complete_engagement", {
      engagement_id: engagementId,
      idempotency_key: idempotencyKey,
    });
    return requireData(result) as Row;
  }
}
