import type { Competition, CompetitionDetail, CompetitionTeam, CreateTeamInput, TeamApplication } from '@/domain/contracts/types';

export interface CompetitionRepository {
  listCompetitions(keyword?: string): Promise<Competition[]>;
  getCompetition(id: string): Promise<CompetitionDetail>;
  getTeam(id: string): Promise<CompetitionTeam>;
  createTeam(input: CreateTeamInput): Promise<CompetitionTeam>;
  applyToTeam(openingId: string, message: string): Promise<TeamApplication>;
  listTeamApplications(teamId: string): Promise<TeamApplication[]>;
  respondToTeamApplication(applicationId: string, accept: boolean): Promise<void>;
}
