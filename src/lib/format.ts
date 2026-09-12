import type { Job } from '@/domain/contracts/types';

const won = new Intl.NumberFormat('ko-KR');

const compensationUnitLabel: Record<Job['compensationType'], string> = {
  hourly: '시급',
  daily: '일급',
  fixed: '건별',
  monthly: '월급',
  negotiable: '협의',
};

export function formatCompensation(job: Pick<Job, 'compensationType' | 'compensationMin' | 'compensationMax'>): string {
  const unit = compensationUnitLabel[job.compensationType];
  if (job.compensationType === 'negotiable' || (!job.compensationMin && !job.compensationMax)) {
    return '보수 협의';
  }
  if (job.compensationMin && job.compensationMax && job.compensationMin !== job.compensationMax) {
    return `${unit} ${won.format(job.compensationMin)}~${won.format(job.compensationMax)}원`;
  }
  const amount = job.compensationMin ?? job.compensationMax ?? 0;
  return `${unit} ${won.format(amount)}원`;
}

const difficultyLabel: Record<Job['difficulty'], string> = {
  beginner: '입문',
  basic: '기초',
  intermediate: '중급',
};

export function formatDifficulty(difficulty: Job['difficulty']): string {
  return difficultyLabel[difficulty];
}

const workModeLabel: Record<Job['workMode'], string> = {
  remote: '재택',
  onsite: '대면',
  hybrid: '혼합',
};

export function formatWorkMode(mode: Job['workMode']): string {
  return workModeLabel[mode];
}

export function formatHours(job: Pick<Job, 'estimatedHours' | 'hoursPerWeek'>): string | undefined {
  if (job.hoursPerWeek) return `주 ${job.hoursPerWeek}시간`;
  if (job.estimatedHours) return `총 ${job.estimatedHours}시간`;
  return undefined;
}

export function formatKoreanDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function isDeadlinePassed(iso?: string): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

export function formatDeadlineRemaining(iso?: string): string | undefined {
  if (!iso) return undefined;
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return '마감되었어요';
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 1) return '오늘 마감';
  return `마감까지 ${days}일`;
}

export const applicationStatusLabel: Record<string, string> = {
  submitted: '지원을 보냈어요',
  viewed: '구인자가 프로필을 확인했어요',
  chatting: '조건을 이야기하고 있어요',
  interview: '인터뷰를 준비하고 있어요',
  accepted: '함께하기로 했어요',
  rejected: '이번에는 연결되지 않았어요',
  withdrawn: '지원을 취소했어요',
};
