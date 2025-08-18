import type { Timestamp } from 'firebase/firestore';

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
  timestamp: Timestamp | Date; // Allow both for local and server data
};

export type Conversation = {
  id: string;
  type: 'group' | 'direct';
  name?: string; // For groups
  participants: User[];
  lastMessage: Message | null;
  unreadCount: number;
  avatarUrl?: string; // For groups or direct chat partner
  participantIds: string[];
};
