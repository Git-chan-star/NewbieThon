import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateTeamInput } from '@/domain/contracts/types';
import { competitionRepository } from '@/repositories';

const keys = {
  all: ['competitions'] as const,
  list: (keyword: string) => ['competitions', 'list', keyword] as const,
  detail: (id: string) => ['competitions', 'detail', id] as const,
  team: (id: string) => ['competitions', 'team', id] as const,
  applications: (id: string) => ['competitions', 'team', id, 'applications'] as const,
};

export function useCompetitions(keyword = '') { return useQuery({ queryKey: keys.list(keyword), queryFn: () => competitionRepository.listCompetitions(keyword) }); }
export function useCompetition(id: string) { return useQuery({ queryKey: keys.detail(id), queryFn: () => competitionRepository.getCompetition(id), enabled: Boolean(id) }); }
export function useTeam(id: string) { return useQuery({ queryKey: keys.team(id), queryFn: () => competitionRepository.getTeam(id), enabled: Boolean(id) }); }
export function useCreateTeam() { const client = useQueryClient(); return useMutation({ mutationFn: (input: CreateTeamInput) => competitionRepository.createTeam(input), onSuccess: (team) => client.invalidateQueries({ queryKey: keys.detail(team.competitionId) }) }); }
export function useApplyToTeam() { return useMutation({ mutationFn: ({ openingId, message }: { openingId: string; message: string }) => competitionRepository.applyToTeam(openingId, message) }); }
export function useTeamApplications(teamId: string) { return useQuery({ queryKey: keys.applications(teamId), queryFn: () => competitionRepository.listTeamApplications(teamId), enabled: Boolean(teamId) }); }
export function useRespondToTeamApplication(teamId: string) { const client = useQueryClient(); return useMutation({ mutationFn: ({ applicationId, accept }: { applicationId: string; accept: boolean }) => competitionRepository.respondToTeamApplication(applicationId, accept), onSuccess: () => { client.invalidateQueries({ queryKey: keys.applications(teamId) }); client.invalidateQueries({ queryKey: keys.team(teamId) }); } }); }
