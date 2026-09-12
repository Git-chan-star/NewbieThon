export type AppRole = "student" | "employer" | "admin";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";
export type JobStatus = "draft" | "published" | "paused" | "closed" | "filled";
export type ApplicationStatus =
  | "submitted"
  | "viewed"
  | "chatting"
  | "interview"
  | "accepted"
  | "rejected"
  | "withdrawn";
export type OfferStatus = "pending" | "accepted" | "declined" | "expired" | "canceled";
export type WorkMode = "remote" | "onsite" | "hybrid";
export type CompensationType = "hourly" | "daily" | "fixed" | "monthly" | "negotiable";
export type EngagementStatus =
  | "ready"
  | "in_progress"
  | "submitted"
  | "revision_requested"
  | "completed"
  | "canceled"
  | "disputed";

export interface Organization {
  id: string;
  name: string;
  organizationType: string;
  industry?: string;
  introduction?: string;
  logoUrl?: string;
  verificationStatus: VerificationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  organizationId: string;
  employerId: string;
  title: string;
  category?: string;
  summary?: string;
  tasks: string[];
  deliverables: string[];
  providedResources: string[];
  beginnerFriendly: boolean;
  feedbackProvided: boolean;
  workMode?: WorkMode;
  location?: string;
  startsOn?: string;
  endsOn?: string;
  applyDeadline?: string;
  compensationType?: CompensationType;
  compensationMin?: number;
  compensationMax?: number;
  paymentTiming?: string;
  status: JobStatus;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  studentId: string;
  message?: string;
  profileSnapshot: Record<string, unknown>;
  status: ApplicationStatus;
  submittedAt: string;
  updatedAt: string;
}

export interface JobOffer {
  id: string;
  jobId: string;
  employerId: string;
  studentId: string;
  reason: string;
  message?: string;
  expiresAt: string;
  status: OfferStatus;
  createdAt: string;
}

export interface Conversation {
  id: string;
  jobId?: string;
  applicationId?: string;
  offerId?: string;
  lastMessageAt?: string;
  closedAt?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  messageType: "text" | "file" | "system";
  body?: string;
  attachmentPath?: string;
  clientMessageId: string;
  createdAt: string;
}

export interface Engagement {
  id: string;
  jobId: string;
  applicationId?: string;
  offerId?: string;
  employerId: string;
  studentId: string;
  status: EngagementStatus;
  agreedScope: string;
  agreedDeliverables: string[];
  agreedStartDate?: string;
  agreedEndDate?: string;
  agreedCompensationType: CompensationType;
  agreedCompensationAmount?: number;
  paymentStatus: "not_recorded" | "scheduled" | "reported_paid";
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MatchExplanation {
  score: number;
  matchedSkillNames: string[];
  missingRequiredSkillNames: string[];
  matchedInterestNames: string[];
  availabilityMatched: boolean | null;
  workModeMatched: boolean | null;
  insufficientData: string[];
}

