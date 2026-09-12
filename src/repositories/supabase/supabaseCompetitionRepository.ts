import type { Competition, CompetitionDetail, CompetitionTeam, CreateTeamInput, TeamApplication } from '@/domain/contracts/types';
import { requireSupabase } from '@/lib/supabase';
import type { CompetitionRepository } from '@/repositories/interfaces/CompetitionRepository';
import type { DbRow } from './mappers';

function mapCompetition(row: DbRow): Competition {
  return {
    id: row.id,
    organizerId: row.created_by ?? undefined,
    title: row.title,
    organizerName: row.organizer_name,
    summary: row.summary,
    description: row.description ?? undefined,
    categories: row.categories ?? [],
    requiredSkills: row.required_skills ?? [],
    locationText: row.location ?? undefined,
    startsAt: row.starts_at ?? undefined,
    endsAt: row.ends_at ?? undefined,
    applicationDeadline: row.application_deadline ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    status: row.status,
    publishedAt: row.published_at ?? undefined,
    createdAt: row.created_at,
  };
}

function mapTeam(row: DbRow): CompetitionTeam {
  const members = Array.isArray(row.team_members) ? row.team_members : [];
  const openings = (row.team_role_openings ?? []) as DbRow[];
  return {
    id: row.id,
    competitionId: row.competition_id,
    leaderId: row.leader_id,
    name: row.name,
    introduction: row.introduction,
    status: row.status,
    memberCount: row.member_count ?? members[0]?.count ?? members.length,
    openings: openings.map((opening) => ({
      id: opening.id,
      teamId: opening.team_id,
      roleName: opening.role_name,
      description: opening.description ?? undefined,
      skillNames: opening.skill_names ?? [],
      headcount: opening.headcount,
      filledCount: opening.filled_count,
    })),
    createdAt: row.created_at,
  };
}

function mapApplication(row: DbRow): TeamApplication {
  return { id: row.id, teamId: row.team_id, openingId: row.opening_id, studentId: row.student_id, message: row.message, status: row.status, createdAt: row.created_at };
}

const teamSelect = '*, team_role_openings(*), team_members(count)';

export const supabaseCompetitionRepository: CompetitionRepository = {
  async listCompetitions(keyword) {
    let query = requireSupabase().from('competitions').select('*').eq('status', 'published').order('published_at', { ascending: false });
    if (keyword?.trim()) {
      const escaped = keyword.trim().replaceAll('%', '\\%').replaceAll('_', '\\_').replaceAll(',', ' ');
      query = query.or(`title.ilike.%${escaped}%,summary.ilike.%${escaped}%`);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return ((data ?? []) as DbRow[]).map(mapCompetition);
  },
  async getCompetition(id): Promise<CompetitionDetail> {
    const client = requireSupabase();
    const [{ data, error }, { data: teams, error: teamsError }] = await Promise.all([
      client.from('competitions').select('*').eq('id', id).single(),
      client.from('competition_teams').select(teamSelect).eq('competition_id', id).neq('status', 'closed').order('created_at'),
    ]);
    if (error || teamsError) throw new Error(error?.message ?? teamsError?.message);
    return { ...mapCompetition(data as DbRow), teams: ((teams ?? []) as DbRow[]).map(mapTeam) };
  },
  async getTeam(id) {
    const { data, error } = await requireSupabase().from('competition_teams').select(teamSelect).eq('id', id).single();
    if (error) throw new Error(error.message);
    return mapTeam(data as DbRow);
  },
  async createTeam(input: CreateTeamInput) {
    const { data, error } = await requireSupabase().rpc('create_competition_team', {
      target_competition_id: input.competitionId,
      team_name: input.name,
      team_introduction: input.introduction,
      role_openings: input.openings,
    });
    if (error) throw new Error(error.message);
    return this.getTeam((data as DbRow).id);
  },
  async applyToTeam(openingId, message) {
    const { data, error } = await requireSupabase().rpc('apply_to_team', { target_opening_id: openingId, application_message: message });
    if (error) throw new Error(error.message);
    return mapApplication(data as DbRow);
  },
  async listTeamApplications(teamId) {
    const { data, error } = await requireSupabase().from('team_applications').select('*').eq('team_id', teamId).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as DbRow[]).map(mapApplication);
  },
  async respondToTeamApplication(applicationId, accept) {
    const { error } = await requireSupabase().rpc('respond_to_team_application', { target_application_id: applicationId, accept_application: accept });
    if (error) throw new Error(error.message);
  },
};
