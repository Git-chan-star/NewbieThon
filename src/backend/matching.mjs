export const MATCH_WEIGHTS = Object.freeze({
  skills: 50,
  interest: 20,
  availability: 15,
  workMode: 10,
  level: 5,
});

function normalize(values = []) {
  return new Set(values.map((value) => String(value).trim().toLowerCase()).filter(Boolean));
}

function overlap(left, right) {
  const rightSet = normalize(right);
  return [...normalize(left)].filter((value) => rightSet.has(value));
}

/**
 * 설명 가능한 추천 점수를 계산한다. 입력하지 않은 정보는 0점이 아니라
 * `insufficientData`로 구분하며, 이 함수만으로 학생을 자동 탈락시키면 안 된다.
 */
export function scoreCandidate(job, student) {
  const required = normalize(job.requiredSkills);
  const preferred = normalize(job.preferredSkills);
  const studentSkills = normalize(student.skills);
  const matchedRequired = [...required].filter((skill) => studentSkills.has(skill));
  const missingRequired = [...required].filter((skill) => !studentSkills.has(skill));
  const matchedPreferred = [...preferred].filter((skill) => studentSkills.has(skill));

  const skillDenominator = required.size * 2 + preferred.size;
  const skillRatio = skillDenominator
    ? (matchedRequired.length * 2 + matchedPreferred.length) / skillDenominator
    : 1;

  const matchedInterests = overlap(job.categories, student.interests);
  const interestKnown = Boolean(job.categories?.length && student.interests?.length);
  const availabilityKnown = job.availabilityMatched !== undefined;
  const workModeKnown = Boolean(job.workMode && student.workModes?.length);
  const levelKnown = Boolean(job.beginnerFriendly !== undefined && student.year);

  const parts = {
    skills: Math.round(MATCH_WEIGHTS.skills * skillRatio),
    interest: interestKnown && matchedInterests.length ? MATCH_WEIGHTS.interest : 0,
    availability: availabilityKnown && job.availabilityMatched ? MATCH_WEIGHTS.availability : 0,
    workMode: workModeKnown && student.workModes.includes(job.workMode) ? MATCH_WEIGHTS.workMode : 0,
    level: levelKnown && (job.beginnerFriendly || student.year >= 3) ? MATCH_WEIGHTS.level : 0,
  };

  return {
    score: Object.values(parts).reduce((sum, value) => sum + value, 0),
    parts,
    matchedSkillNames: [...matchedRequired, ...matchedPreferred],
    missingRequiredSkillNames: missingRequired,
    matchedInterestNames: matchedInterests,
    availabilityMatched: availabilityKnown ? Boolean(job.availabilityMatched) : null,
    workModeMatched: workModeKnown ? student.workModes.includes(job.workMode) : null,
    insufficientData: [
      !interestKnown && "interest",
      !availabilityKnown && "availability",
      !workModeKnown && "workMode",
      !levelKnown && "level",
    ].filter(Boolean),
  };
}

