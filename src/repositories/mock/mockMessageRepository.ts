import type { ChatMessage, ConversationSummary } from '@/domain/contracts/types';
import type { MessageRepository } from '@/repositories/interfaces/MessageRepository';

const conversations: ConversationSummary[] = [];
const messages: Record<string, ChatMessage[]> = {};

export const mockMessageRepository: MessageRepository = {
  async listConversations() { return conversations; },
  async listMessages(conversationId) { return messages[conversationId] ?? []; },
  async sendMessage(conversationId, body) {
    const message: ChatMessage = { id: `message-${Date.now()}`, conversationId, senderId: 'mock-user', type: 'text', body, createdAt: new Date().toISOString() };
    messages[conversationId] = [...(messages[conversationId] ?? []), message];
    return message;
  },
};
