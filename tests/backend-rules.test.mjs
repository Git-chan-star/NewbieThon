import test from "node:test";
import assert from "node:assert/strict";
import { scoreCandidate } from "../src/backend/matching.mjs";
import {
  applicationTransitions,
  engagementTransitions,
  canTransition,
} from "../src/backend/state-machines.mjs";

test("지원 상태는 허용된 방향으로만 이동한다", () => {
  assert.equal(canTransition(applicationTransitions, "submitted", "viewed"), true);
  assert.equal(canTransition(applicationTransitions, "submitted", "accepted"), false);
  assert.equal(canTransition(applicationTransitions, "accepted", "rejected"), false);
  assert.equal(canTransition(applicationTransitions, "rejected", "viewed"), true);
});

test("업무 완료 전에 결과물 제출 단계가 필요하다", () => {
  assert.equal(canTransition(engagementTransitions, "in_progress", "completed"), false);
  assert.equal(canTransition(engagementTransitions, "submitted", "completed"), true);
  assert.equal(canTransition(engagementTransitions, "revision_requested", "submitted"), true);
});

test("매칭 점수는 이유와 누락 기술을 함께 반환한다", () => {
  const result = scoreCandidate(
    {
      requiredSkills: ["Kotlin", "Git"],
      preferredSkills: ["Figma"],
      categories: ["Android"],
      availabilityMatched: true,
      workMode: "remote",
      beginnerFriendly: true,
    },
    {
      skills: ["kotlin", "Figma"],
      interests: ["Android"],
      workModes: ["remote"],
      year: 2,
    },
  );

  assert.equal(result.score, 80);
  assert.deepEqual(result.missingRequiredSkillNames, ["git"]);
  assert.equal(result.workModeMatched, true);
});

test("입력하지 않은 정보는 정보 부족으로 구분한다", () => {
  const result = scoreCandidate(
    { requiredSkills: [], preferredSkills: [], beginnerFriendly: true },
    { skills: [] },
  );
  assert.equal(result.parts.skills, 50);
  assert.deepEqual(result.insufficientData, ["interest", "availability", "workMode", "level"]);
});
