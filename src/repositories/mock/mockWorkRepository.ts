import type { WorkRepository } from '@/repositories/interfaces/WorkRepository';

export const mockWorkRepository: WorkRepository = {
  async listWork() { return []; },
  async getWork() { throw new Error('진행 중인 업무가 없어요.'); },
  async startWork() {},
  async submitDeliverable() {},
  async requestRevision() {},
  async completeWork() {},
};
