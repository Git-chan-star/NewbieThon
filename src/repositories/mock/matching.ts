// 임시 클라이언트 매칭 계산. 실제 서비스에서는 개발자 2의 서버 매칭 로직으로 대체한다.
// 02_employer_marketplace_implementation_prompt.md 14장의 가중치를 그대로 따른다.
import type { Job, MatchExplanation, StudentProfile, StudentSkill } from '@/domain/contracts/types';

export function scoreJob(job: Job, profile: StudentProfile | null, skills: StudentSkill[]): MatchExplanation {
  const skillLevelRank: Record<string, number> = {
    learned: 1,
    basic: 2,
    project_used: 3,
    work_ready: 4,
  };

  const studentSkillMap = new Map(skills.map((s) => [s.skillId, s]));

  const matchedSkillNames: string[] = [];
  const missingRequiredSkillNames: string[] = [];

  let skillScore = 0;
  const maxSkillScore = 50;
  const perSkill = job.requiredSkills.length > 0 ? maxSkillScore / job.requiredSkills.length : 0;

  for (const req of job.requiredSkills) {
    const owned = studentSkillMap.get(req.skillId);
    const meetsLevel = owned && skillLevelRank[owned.level] >= skillLevelRank[req.minimumLevel];
    if (meetsLevel) {
      matchedSkillNames.push(req.skillName);
      skillScore += perSkill;
    } else if (req.required) {
      missingRequiredSkillNames.push(req.skillName);
    }
  }

  const matchedInterest = profile?.preferredJobCategories.includes(job.category) ? job.category : undefined;
  const interestScore = matchedInterest ? 20 : 0;

  const availabilityMatched = Boolean(
    profile?.availableHoursPerWeek && job.hoursPerWeek && profile.availableHoursPerWeek >= job.hoursPerWeek
  );
  const availabilityScore = availabilityMatched ? 15 : 0;

  const workModeMatched = Boolean(profile?.preferredWorkModes.includes(job.workMode));
  const workModeScore = workModeMatched ? 10 : 0;

  const difficultyScore = job.beginnerFriendly || job.difficulty === 'beginner' ? 5 : 2;

  const totalScore = Math.round(skillScore + interestScore + availabilityScore + workModeScore + difficultyScore);

  return {
    totalScore: Math.min(totalScore, 100),
    matchedSkillNames,
    matchedInterest,
    availabilityMatched,
    workModeMatched,
    missingRequiredSkillNames,
  };
}

export function buildMatchReasons(match: MatchExplanation): string[] {
  const reasons: string[] = [];
  if (match.matchedSkillNames.length > 0) {
    reasons.push(`배운 기술 ${match.matchedSkillNames.length}개가 맞아요 (${match.matchedSkillNames.join(', ')})`);
  }
  if (match.matchedInterest) {
    reasons.push(`관심 분야로 등록한 ${match.matchedInterest} 업무예요`);
  }
  if (match.workModeMatched) {
    reasons.push('희망한 근무 방식과 같아요');
  }
  if (match.availabilityMatched) {
    reasons.push('가능한 시간과 비슷해요');
  }
  if (reasons.length === 0) {
    reasons.push('새로운 분야에 도전해볼 수 있어요');
  }
  return reasons;
}
