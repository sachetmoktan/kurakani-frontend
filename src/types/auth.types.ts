export type TLogin = {
  access_token: string;
};

export type TFetchApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: HeadersInit;
  credentials?: RequestCredentials;
  auth?: boolean;
  signal?: AbortSignal;
};

export type TUser = {
  _id: string;
  name: string;
  email: string;
  roles: string[];
};

export type AccessTokenPayload = {
  userId: string;
  email: string;
  name: string;
  roles: string[];
  exp: number;
  iat: number;
};

export type AuthContextValue = {
  token: string | null;
  payload: AccessTokenPayload | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  removeToken: () => void;
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
  lastMessageDetail: TLastMessageDetail;
};
