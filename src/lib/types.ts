export type User = {
  id: string;
  name: string;
  avatarUrl: string;
  secretId?: string;
  isGuest?: boolean;
};

export type Message = {
  id: string;
  sender: User;
  text: string;
  imageUrl?: string;
  timestamp: Date;
};

export type Conversation = {
  id: string;
  type: 'group' | 'direct';
  name?: string; // For groups
  participants: User[];
  lastMessage: Message;
  unreadCount: number;
  avatarUrl?: string; // For groups or direct chat partner
};
