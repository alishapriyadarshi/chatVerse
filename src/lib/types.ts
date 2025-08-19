import type { Timestamp } from 'firebase/firestore';

export type User = {
  id: string;
  name: string;
  avatarUrl: string;
  isGuest?: boolean;
  isOnline?: boolean;
  lastSeen?: Timestamp;
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
