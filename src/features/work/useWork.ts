import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workRepository } from '@/repositories';

const keys = { all: ['work'] as const, detail: (id: string) => ['work', id] as const };
export function useWorkList() { return useQuery({ queryKey: keys.all, queryFn: () => workRepository.listWork() }); }
export function useWork(id: string) { return useQuery({ queryKey: keys.detail(id), queryFn: () => workRepository.getWork(id), enabled: Boolean(id) }); }
function useWorkAction(id: string, action: (...args: any[]) => Promise<void>) { const client = useQueryClient(); return useMutation({ mutationFn: (args: any[]) => action(...args), onSuccess: () => { client.invalidateQueries({ queryKey: keys.all }); client.invalidateQueries({ queryKey: keys.detail(id) }); } }); }
export function useStartWork(id: string) { return useWorkAction(id, () => workRepository.startWork(id)); }
export function useSubmitDeliverable(id: string) { return useWorkAction(id, (title: string, note?: string, url?: string) => workRepository.submitDeliverable(id, title, note, url)); }
export function useRequestRevision(id: string) { return useWorkAction(id, (note: string) => workRepository.requestRevision(id, note)); }
export function useCompleteWork(id: string) { return useWorkAction(id, () => workRepository.completeWork(id)); }
