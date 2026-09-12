import type { WorkItem } from '@/domain/contracts/types';

export interface WorkRepository {
  listWork(): Promise<WorkItem[]>;
  getWork(id: string): Promise<WorkItem>;
  startWork(id: string): Promise<void>;
  submitDeliverable(id: string, title: string, note?: string, externalUrl?: string): Promise<void>;
  requestRevision(id: string, note: string): Promise<void>;
  completeWork(id: string): Promise<void>;
}
