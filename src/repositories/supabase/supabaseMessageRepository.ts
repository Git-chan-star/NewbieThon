import type { ChatMessage, ConversationSummary } from '@/domain/contracts/types';
import { requireSupabase } from '@/lib/supabase';
import type { MessageRepository } from '@/repositories/interfaces/MessageRepository';
import { newRequestId, type DbRow } from './mappers';

function mapMessage(row: DbRow): ChatMessage {
  return { id: row.id, conversationId: row.conversation_id, senderId: row.sender_id, type: row.message_type, body: row.body ?? undefined, attachmentPath: row.attachment_path ?? undefined, createdAt: row.created_at };
}

export const supabaseMessageRepository: MessageRepository = {
  async listConversations(): Promise<ConversationSummary[]> {
    const { data, error } = await requireSupabase().from('conversations').select('*, jobs(title), competition_teams(name), messages(body, created_at)').order('last_message_at', { ascending: false, nullsFirst: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as DbRow[]).map((row) => {
      const job = Array.isArray(row.jobs) ? row.jobs[0] : row.jobs;
      const team = Array.isArray(row.competition_teams) ? row.competition_teams[0] : row.competition_teams;
      const messages = ((row.messages ?? []) as DbRow[]).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
      return { id: row.id, title: team?.name ?? job?.title ?? '대화', kind: row.team_id ? 'team' : 'job', preview: messages[0]?.body ?? '대화를 시작해 보세요.', lastMessageAt: row.last_message_at ?? row.created_at, unreadCount: 0 };
    });
  },
  async listMessages(conversationId) {
    const { data, error } = await requireSupabase().from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return ((data ?? []) as DbRow[]).map(mapMessage);
  },
  async sendMessage(conversationId, body) {
    const { data, error } = await requireSupabase().rpc('send_message', { target_conversation_id: conversationId, target_message_type: 'text', target_message_body: body, target_attachment_path: null, target_client_message_id: newRequestId() });
    if (error) throw new Error(error.message);
    return mapMessage(data as DbRow);
  },
};
