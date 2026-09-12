// 공통 도메인 계약. 01_core_student_implementation_prompt.md 5장 기준.
// 개발자 2와 합의 후에만 수정한다.

export type UserRole = 'student' | 'employer' | 'admin';

export type JobStatus = 'draft' | 'published' | 'paused' | 'closed' | 'filled';

export type ApplicationStatus =
  | 'submitted'
  | 'viewed'
  | 'chatting'
  | 'interview'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'canceled';

export type SkillLevel = 'learned' | 'basic' | 'project_used' | 'work_ready';

export type WorkMode = 'remote' | 'onsite' | 'hybrid';

export interface User {
  id: string;
  role: UserRole | null;
  displayName: string;
  avatarUrl?: string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  userId: string;
  schoolName: string;
  majorName: string;
  gradeYear: 1 | 2 | 3 | 4 | 5 | 6;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  bio?: string;
  interests: string[];
  preferredJobCategories: string[];
  preferredWorkModes: WorkMode[];
  availableHoursPerWeek?: number;
  availableDays: string[];
  profileCompletion: number;
  isDiscoverable: boolean;
}

export interface StudentSkill {
  id: string;
  studentId: string;
  skillId: string;
  skillName: string;
  level: SkillLevel;
  evidenceIds: string[];
}

export interface StudentCourse {
  id: string;
  studentId: string;
  courseName: string;
  category?: string;
  completed: boolean;
}

export interface StudentProject {
  id: string;
  studentId: string;
  title: string;
  summary: string;
  roleDescription: string;
  skillIds: string[];
  resultUrl?: string;
  repositoryUrl?: string;
  imageUrls: string[];
  source: 'class' | 'personal' | 'club' | 'competition' | 'paid_work';
  startDate?: string;
  endDate?: string;
}

export interface EmployerProfile {
  userId: string;
  organizationName: string;
  organizationType: string;
  industry?: string;
  introduction?: string;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  logoUrl?: string;
}

export interface EmployerOnboardingInput {
  organizationName: string;
  organizationType: string;
  industry?: string;
  introduction?: string;
  contactName: string;
  position?: string;
  workEmail: string;
  contactHours?: string;
}

export interface EmployerJobInput {
  title: string;
  category: string;
  summary: string;
  responsibilities: string[];
  deliverables: string[];
  workMode: WorkMode;
  locationText?: string;
  startDate: string;
  endDate: string;
  applicationDeadline: string;
  compensationType: Job['compensationType'];
  compensationMin?: number;
  hoursPerWeek?: number;
  headcount: number;
  beginnerFriendly: boolean;
  educationOrFeedback: boolean;
}

export interface EmployerApplicant {
  id: string;
  jobId: string;
  studentId: string;
  displayName: string;
  schoolName?: string;
  majorName?: string;
  status: ApplicationStatus;
  shortAnswer?: string;
  submittedAt: string;
}

export interface JobSkillRequirement {
  skillId: string;
  skillName: string;
  minimumLevel: SkillLevel;
  required: boolean;
}

export interface Job {
  id: string;
  employerId: string;
  employerName: string;
  employerVerified: boolean;
  title: string;
  category: string;
  summary: string;
  responsibilities: string[];
  deliverables: string[];
  requiredSkills: JobSkillRequirement[];
  difficulty: 'beginner' | 'basic' | 'intermediate';
  beginnerFriendly: boolean;
  educationOrFeedback: boolean;
  workMode: WorkMode;
  locationText?: string;
  estimatedHours?: number;
  hoursPerWeek?: number;
  startDate?: string;
  endDate?: string;
  compensationType: 'hourly' | 'daily' | 'fixed' | 'monthly' | 'negotiable';
  compensationMin?: number;
  compensationMax?: number;
  currency: 'KRW';
  headcount: number;
  applicationDeadline?: string;
  status: JobStatus;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MatchExplanation {
  totalScore: number;
  matchedSkillNames: string[];
  matchedInterest?: string;
  availabilityMatched: boolean;
  workModeMatched: boolean;
  missingRequiredSkillNames: string[];
}

export interface JobRecommendation {
  job: Job;
  match: MatchExplanation;
}

export interface JobDetail extends Job {
  match?: MatchExplanation;
  alreadyApplied: boolean;
  isOwnJob: boolean;
  isSaved: boolean;
}

export interface Application {
  id: string;
  jobId: string;
  studentId: string;
  status: ApplicationStatus;
  availableStartDate?: string;
  availabilityNote?: string;
  shortAnswer?: string;
  submittedProfileSnapshot: Record<string, unknown>;
  submittedAt: string;
  updatedAt: string;
}

export interface ApplicationSummary extends Application {
  job: Pick<Job, 'id' | 'title' | 'employerName' | 'category' | 'compensationType' | 'compensationMin' | 'compensationMax' | 'currency'>;
}

export interface ApplicationDetail extends ApplicationSummary {
  job: Job;
}

export interface JobOffer {
  id: string;
  jobId: string;
  jobTitle: string;
  employerId: string;
  employerName: string;
  employerVerified: boolean;
  studentId: string;
  message: string;
  status: OfferStatus;
  expiresAt?: string;
  createdAt: string;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor?: string;
}

export interface SignUpInput {
  email: string;
  password: string;
  displayName: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export type StudentProfileUpdate = Partial<StudentProfile>;

export interface StudentSkillInput {
  skillId: string;
  skillName: string;
  level: SkillLevel;
}

export interface StudentProjectInput {
  title: string;
  summary: string;
  roleDescription: string;
  skillIds: string[];
  resultUrl?: string;
  repositoryUrl?: string;
  source: StudentProject['source'];
}

export interface JobSearchQuery {
  keyword?: string;
  category?: string;
  difficulty?: Job['difficulty'];
  workMode?: WorkMode;
  compensationType?: Job['compensationType'];
  beginnerFriendlyOnly?: boolean;
  cursor?: string;
}

export interface ApplicationInput {
  jobId: string;
  availableStartDate?: string;
  availabilityNote?: string;
  shortAnswer?: string;
}

export type CompetitionStatus = 'draft' | 'published' | 'closed';
export type TeamStatus = 'recruiting' | 'full' | 'closed';
export type TeamApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface Competition {
  id: string;
  organizerId?: string;
  title: string;
  organizerName: string;
  summary: string;
  description?: string;
  categories: string[];
  requiredSkills: string[];
  locationText?: string;
  startsAt?: string;
  endsAt?: string;
  applicationDeadline?: string;
  sourceUrl?: string;
  status: CompetitionStatus;
  publishedAt?: string;
  createdAt: string;
}

export interface CompetitionDetail extends Competition {
  teams: CompetitionTeam[];
}

export interface CreateTeamInput {
  competitionId: string;
  name: string;
  introduction: string;
  openings: { roleName: string; description?: string; skillNames: string[]; headcount: number }[];
}

export interface TeamRoleOpening {
  id: string;
  teamId: string;
  roleName: string;
  description?: string;
  skillNames: string[];
  headcount: number;
  filledCount: number;
}

export interface CompetitionTeam {
  id: string;
  competitionId: string;
  leaderId: string;
  name: string;
  introduction: string;
  status: TeamStatus;
  memberCount: number;
  openings: TeamRoleOpening[];
  createdAt: string;
}

export interface TeamApplication {
  id: string;
  teamId: string;
  openingId: string;
  studentId: string;
  message: string;
  status: TeamApplicationStatus;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  kind: 'job' | 'team';
  preview?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  type: 'text' | 'file' | 'system';
  body?: string;
  attachmentPath?: string;
  createdAt: string;
}

export type WorkStatus = 'ready' | 'in_progress' | 'submitted' | 'revision_requested' | 'completed' | 'canceled' | 'disputed';

export interface WorkDeliverable {
  id: string;
  title: string;
  note?: string;
  externalUrl?: string;
  submittedAt: string;
}

export interface WorkItem {
  id: string;
  jobId: string;
  jobTitle: string;
  employerId: string;
  studentId: string;
  status: WorkStatus;
  agreedScope: string;
  agreedDeliverables: string[];
  compensationType: Job['compensationType'];
  compensationAmount?: number;
  startDate?: string;
  endDate?: string;
  deliverables: WorkDeliverable[];
  createdAt: string;
}

export interface AdminOverview {
  totalUsers: number;
  activeStudents: number;
  activeEmployers: number;
  publishedJobs: number;
  pendingVerifications: number;
  openReports: number;
}

export interface AdminUserSummary {
  id: string;
  displayName: string;
  role: UserRole | null;
  isActive: boolean;
  createdAt: string;
}

export interface AdminVerification {
  userId: string;
  organizationId: string;
  organizationName: string;
  contactName: string;
  workEmail: string;
  status: 'unverified' | 'pending' | 'verified' | 'rejected';
  documentPath?: string;
  submittedAt: string;
}

export type ReportStatus = 'received' | 'reviewing' | 'resolved' | 'dismissed';

export interface AdminReport {
  id: string;
  reporterId: string;
  targetType: 'user' | 'job' | 'message' | 'engagement';
  targetId: string;
  reasonCode: string;
  detail?: string;
  status: ReportStatus;
  assignedAdminId?: string;
  createdAt: string;
}
