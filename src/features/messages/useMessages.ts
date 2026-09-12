import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { messageRepository } from '@/repositories';

const keys = { all: ['messages'] as const, conversations: () => ['messages', 'conversations'] as const, thread: (id: string) => ['messages', 'thread', id] as const };
export function useConversations() { return useQuery({ queryKey: keys.conversations(), queryFn: () => messageRepository.listConversations() }); }
export function useMessages(conversationId: string) { return useQuery({ queryKey: keys.thread(conversationId), queryFn: () => messageRepository.listMessages(conversationId), enabled: Boolean(conversationId), refetchInterval: 5000 }); }
export function useSendMessage(conversationId: string) { const client = useQueryClient(); return useMutation({ mutationFn: (body: string) => messageRepository.sendMessage(conversationId, body), onSuccess: () => { client.invalidateQueries({ queryKey: keys.thread(conversationId) }); client.invalidateQueries({ queryKey: keys.conversations() }); } }); }
