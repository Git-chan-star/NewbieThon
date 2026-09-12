import type { Competition, CompetitionTeam, TeamApplication } from '@/domain/contracts/types';
import type { CompetitionRepository } from '@/repositories/interfaces/CompetitionRepository';

const now = new Date().toISOString();
const competitions: Competition[] = [
  { id: 'competition-1', title: '2026 대학생 AI 서비스 해커톤', organizerName: '잇구 운영팀', summary: '생활 속 문제를 AI로 해결하는 2박 3일 해커톤', description: '기획, 디자인, 개발 직군이 함께 팀을 구성해 서비스를 완성해요.', categories: ['AI', '앱 서비스'], requiredSkills: ['Python', 'React Native', 'Figma'], locationText: '서울', applicationDeadline: new Date(Date.now() + 20 * 86400000).toISOString(), status: 'published', publishedAt: now, createdAt: now },
  { id: 'competition-2', title: '공공데이터 활용 아이디어톤', organizerName: '데이터진흥원', summary: '공공데이터를 활용한 대학생 서비스 아이디어 공모전', categories: ['데이터', '기획'], requiredSkills: ['Python', 'Figma'], applicationDeadline: new Date(Date.now() + 35 * 86400000).toISOString(), status: 'published', publishedAt: now, createdAt: now },
];
const teams: CompetitionTeam[] = [{ id: 'team-1', competitionId: 'competition-1', leaderId: 'student-leader', name: '새싹메이커스', introduction: '초보자도 함께 배우며 완주하는 팀이에요.', status: 'recruiting', memberCount: 2, openings: [{ id: 'opening-1', teamId: 'team-1', roleName: 'Android 개발', description: 'React Native 화면 개발을 함께해요.', skillNames: ['React Native', 'TypeScript'], headcount: 1, filledCount: 0 }], createdAt: now }];
const applications: TeamApplication[] = [];

export const mockCompetitionRepository: CompetitionRepository = {
  async listCompetitions(keyword) {
    const key = keyword?.toLowerCase().trim();
    return key ? competitions.filter((item) => `${item.title} ${item.summary}`.toLowerCase().includes(key)) : competitions;
  },
  async getCompetition(id) {
    const competition = competitions.find((item) => item.id === id);
    if (!competition) throw new Error('대회 공고를 찾을 수 없어요.');
    return { ...competition, teams: teams.filter((team) => team.competitionId === id) };
  },
  async getTeam(id) {
    const team = teams.find((item) => item.id === id);
    if (!team) throw new Error('팀을 찾을 수 없어요.');
    return team;
  },
  async createTeam(input) {
    const team: CompetitionTeam = { id: `team-${Date.now()}`, competitionId: input.competitionId, leaderId: 'mock-student', name: input.name, introduction: input.introduction, status: 'recruiting', memberCount: 1, openings: input.openings.map((item, index) => ({ ...item, id: `opening-${Date.now()}-${index}`, teamId: '', filledCount: 0 })), createdAt: new Date().toISOString() };
    team.openings = team.openings.map((item) => ({ ...item, teamId: team.id }));
    teams.push(team);
    return team;
  },
  async applyToTeam(openingId, message) {
    const opening = teams.flatMap((team) => team.openings).find((item) => item.id === openingId);
    if (!opening) throw new Error('모집 역할을 찾을 수 없어요.');
    const application: TeamApplication = { id: `team-application-${Date.now()}`, teamId: opening.teamId, openingId, studentId: 'mock-student', message, status: 'pending', createdAt: new Date().toISOString() };
    applications.push(application);
    return application;
  },
  async listTeamApplications(teamId) { return applications.filter((item) => item.teamId === teamId); },
  async respondToTeamApplication(applicationId, accept) { const item = applications.find((application) => application.id === applicationId); if (item) item.status = accept ? 'accepted' : 'rejected'; },
};
