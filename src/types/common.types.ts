import type { TConversation } from './auth.types';

export type TApiResponse<T> = {
  data: T;
  message: string;
  success: boolean;
};

export type TMessage = {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
};

export type TConversationUpdate =
  | {
      conversation: TConversation;
    }
  | {
      conversationId: string;
      unreadCount: Record<string, number>;
    };
