import type {
  Application,
  ApplicationDetail,
  ApplicationInput,
  ApplicationSummary,
  CursorPage,
  JobOffer,
} from '@/domain/contracts/types';

export interface StudentApplicationRepository {
  submitApplication(input: ApplicationInput): Promise<Application>;
  listMyApplications(cursor?: string): Promise<CursorPage<ApplicationSummary>>;
  getMyApplication(applicationId: string): Promise<ApplicationDetail>;
  withdrawApplication(applicationId: string): Promise<Application>;
  listMyOffers(cursor?: string): Promise<CursorPage<JobOffer>>;
  respondToOffer(offerId: string, decision: 'accept' | 'decline'): Promise<JobOffer>;
}
