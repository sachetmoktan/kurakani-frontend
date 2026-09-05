export type TUser = {
  _id: string;
  name: string;
  email: string;
  roles: string[];
};

export type TLastMessageDetail = {
  content: string;
  senderId: string;
  createdAt: Date;
};

export type TConversation = {
  _id: string;
  participants: { _id: string; name: string }[];
  unreadCount: Record<string, number>;
  lastMessageDetails: TLastMessageDetail;
};
