'use client';
import { DUMMY_CONVERSATIONS, DUMMY_MESSAGES, CURRENT_USER } from '@/lib/dummy-data';
import type { Conversation, Message as MessageType } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreVertical, Phone, Video } from 'lucide-react';
import { Message } from './message';
import { MessageInput } from './message-input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatWindowProps {
  conversationId: string;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const conversation = DUMMY_CONVERSATIONS.find((c) => c.id === conversationId);
  const messages = DUMMY_MESSAGES[conversationId] || [];

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Conversation not found.</p>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const isGuest = CURRENT_USER.isGuest;

  return (
    <div className="flex flex-col h-full bg-card/75 backdrop-blur-xl rounded-2xl overflow-hidden">
      <header className="flex items-center p-4 border-b border-border/50">
        <Avatar className="h-10 w-10">
          <AvatarImage src={conversation.avatarUrl} alt={conversation.name} />
          <AvatarFallback>{getInitials(conversation.name ?? 'U')}</AvatarFallback>
        </Avatar>
        <div className="ml-4">
          <h2 className="font-semibold text-lg font-headline">{conversation.name}</h2>
          <p className="text-sm text-muted-foreground">
            {conversation.type === 'group' 
              ? `${conversation.participants.length} members`
              : 'Online'}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon"><Phone /></Button>
          <Button variant="ghost" size="icon"><Video /></Button>
          <Button variant="ghost" size="icon"><MoreVertical /></Button>
        </div>
      </header>
      
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {messages.map((msg) => (
            <Message key={msg.id} message={msg} />
          ))}
        </div>
      </ScrollArea>

      <MessageInput isGuest={isGuest} />
    </div>
  );
}
