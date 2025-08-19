import type { User, Conversation, Message } from './types';
import { Timestamp } from 'firebase/firestore';

export const GEMINI_USER: User = {
    id: 'user-gemini',
    name: 'Gemini',
    avatarUrl: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d6ebb19945ab56832508.svg',
};
