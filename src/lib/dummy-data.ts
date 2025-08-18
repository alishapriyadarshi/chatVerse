import type { User, Conversation, Message } from './types';

export const LOGGED_IN_USER: User = {
  id: 'user-1',
  name: 'Alice',
  avatarUrl: 'https://placehold.co/100x100',
  secretId: 'ALICE-SECRET-123',
};

export const GUEST_USER: User = {
  id: 'user-guest',
  name: 'Guest',
  avatarUrl: 'https://placehold.co/100x100?text=G',
  secretId: 'GUEST-SECRET-XYZ',
  isGuest: true,
};

export const GEMINI_USER: User = {
    id: 'user-gemini',
    name: 'Gemini',
    avatarUrl: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d6ebb19945ab56832508.svg',
    secretId: 'GEMINI-BOT-SECRET'
};

export const DUMMY_USERS: User[] = [
  LOGGED_IN_USER,
  { id: 'user-2', name: 'Bob', avatarUrl: 'https://placehold.co/100x100' },
  { id: 'user-3', name: 'Charlie', avatarUrl: 'https://placehold.co/100x100' },
  { id: 'user-4', name: 'Diana', avatarUrl: 'https://placehold.co/100x100' },
  GUEST_USER,
  GEMINI_USER
];


const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

const tenMinutesAgo = new Date();
tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

const fiveMinutesAgo = new Date();
fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

const twoMinutesAgo = new Date();
twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2);


export const DUMMY_MESSAGES: { [conversationId: string]: Message[] } = {
  'conv-1': [
    { id: 'msg-1-1', sender: DUMMY_USERS[1], text: 'Hey Alice!', timestamp: yesterday },
    { id: 'msg-1-2', sender: LOGGED_IN_USER, text: 'Hi Bob! How are you?', timestamp: tenMinutesAgo },
    { id: 'msg-1-3', sender: DUMMY_USERS[1], text: 'Doing great! Just checking in.', timestamp: fiveMinutesAgo },
    { id: 'msg-1-4', sender: DUMMY_USERS[1], text: 'Check out this cool image!', imageUrl: 'https://placehold.co/600x400', timestamp: fiveMinutesAgo },
  ],
  'conv-2': [
    { id: 'msg-2-1', sender: DUMMY_USERS[2], text: 'Project update?', timestamp: yesterday },
    { id: 'msg-2-2', sender: DUMMY_USERS[3], text: 'I pushed the latest changes.', timestamp: tenMinutesAgo },
    { id: 'msg-2-3', sender: LOGGED_IN_USER, text: 'Awesome, I\'ll review them now.', timestamp: fiveMinutesAgo },
  ],
  'conv-3': [
    { id: 'msg-3-1', sender: DUMMY_USERS[3], text: 'Lunch tomorrow?', timestamp: twoMinutesAgo },
  ],
  'conv-gemini': [
    { id: 'msg-gem-1', sender: GEMINI_USER, text: 'Hello! How can I help you today?', timestamp: new Date() },
  ],
};

export const DUMMY_CONVERSATIONS: Conversation[] = [
    {
    id: 'conv-gemini',
    type: 'direct',
    participants: [LOGGED_IN_USER, GUEST_USER, GEMINI_USER],
    name: GEMINI_USER.name,
    avatarUrl: GEMINI_USER.avatarUrl,
    lastMessage: DUMMY_MESSAGES['conv-gemini'][0],
    unreadCount: 1,
  },
  {
    id: 'conv-1',
    type: 'direct',
    participants: [LOGGED_IN_USER, DUMMY_USERS[1]],
    name: DUMMY_USERS[1].name,
    avatarUrl: DUMMY_USERS[1].avatarUrl,
    lastMessage: DUMMY_MESSAGES['conv-1'][DUMMY_MESSAGES['conv-1'].length - 1],
    unreadCount: 2,
  },
  {
    id: 'conv-2',
    type: 'group',
    name: 'Project Team',
    participants: [LOGGED_IN_USER, DUMMY_USERS[2], DUMMY_USERS[3]],
    avatarUrl: 'https://placehold.co/100x100',
    lastMessage: DUMMY_MESSAGES['conv-2'][DUMMY_MESSAGES['conv-2'].length - 1],
    unreadCount: 0,
  },
  {
    id: 'conv-3',
    type: 'direct',
    participants: [LOGGED_IN_USER, DUMMY_USERS[3]],
    name: DUMMY_USERS[3].name,
    avatarUrl: DUMMY_USERS[3].avatarUrl,
    lastMessage: DUMMY_MESSAGES['conv-3'][DUMMY_MESSAGES['conv-3'].length - 1],
    unreadCount: 1,
  },
];
