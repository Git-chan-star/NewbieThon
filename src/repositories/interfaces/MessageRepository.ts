import type { ChatMessage, ConversationSummary } from '@/domain/contracts/types';

export interface MessageRepository {
  listConversations(): Promise<ConversationSummary[]>;
  listMessages(conversationId: string): Promise<ChatMessage[]>;
  sendMessage(conversationId: string, body: string): Promise<ChatMessage>;
}
