'use client';
import { DUMMY_CONVERSATIONS, DUMMY_MESSAGES, GUEST_USER, GEMINI_USER } from '@/lib/dummy-data';
import type { Conversation, Message as MessageType, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreVertical, Phone, Video } from 'lucide-react';
import { Message } from './message';
import { MessageInput } from './message-input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { chat } from '@/ai/flows/chat-flow';
import { useAuth } from '@/hooks/use-auth';

interface ChatWindowProps {
  conversationId: string;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const searchParams = useSearchParams();
  const isGuest = searchParams.get('guest') === 'true';
  const { user } = useAuth();
  const currentUser = isGuest ? GUEST_USER : user;

  const conversation = DUMMY_CONVERSATIONS.find((c) => c.id === conversationId);
  const [messages, setMessages] = useState<MessageType[]>(DUMMY_MESSAGES[conversationId] || []);
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollDiv = scrollAreaRef.current.querySelector('div');
      if (scrollDiv) {
        scrollDiv.scrollTo({
          top: scrollDiv.scrollHeight,
          behavior: 'smooth',
        });
      }
    }
  }, [messages]);

  if (!currentUser) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

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

  const handleSendMessage = async (text: string, imageUrl?: string) => {
    const newMessage: MessageType = {
      id: `msg-${Date.now()}`,
      sender: currentUser,
      text,
      timestamp: new Date(),
      imageUrl,
    };
    
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);

    const shouldGeminiRespond = 
      conversation.participants.some(p => p.id === GEMINI_USER.id) ||
      text.toLowerCase().includes('@gemini');

    if (shouldGeminiRespond) {
      setIsTyping(true);
      try {
        const history = updatedMessages.map(msg => ({
          role: msg.sender.id === currentUser.id ? 'user' as const : 'model' as const,
          content: msg.text,
        }));
        
        const responseText = await chat({
          history: history.slice(-10), // Send last 10 messages for context
          message: text,
        });

        const geminiMessage: MessageType = {
          id: `msg-${Date.now() + 1}`,
          sender: GEMINI_USER,
          text: responseText,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, geminiMessage]);
      } catch (error) {
        console.error("Error getting response from Gemini:", error);
        const errorMessage: MessageType = {
          id: `err-${Date.now()}`,
          sender: GEMINI_USER,
          text: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    }
  };

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
          <Button variant="ghost" size="icon"><MoreVertical /></Button>
        </div>
      </header>
      
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-6 space-y-6">
          {messages.map((msg) => (
            <Message key={msg.id} message={msg} currentUser={currentUser} />
          ))}
           {isTyping && (
            <div className="flex items-end gap-3 justify-start">
               <Avatar className="h-8 w-8">
                  <AvatarImage src={GEMINI_USER.avatarUrl} />
                  <AvatarFallback>{getInitials(GEMINI_USER.name)}</AvatarFallback>
                </Avatar>
                <div className="max-w-xs md:max-w-md lg:max-w-lg flex flex-col gap-1 items-start">
                  <div className="p-3 rounded-2xl bg-background rounded-bl-none">
                    <p className="text-xs font-semibold mb-1 text-primary-foreground/80">{GEMINI_USER.name}</p>
                    <div className="flex gap-1.5 items-center">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse delay-0"></span>
                      <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse delay-150"></span>
                      <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse delay-300"></span>
                    </div>
                  </div>
                </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <MessageInput onSendMessage={handleSendMessage} isGuest={isGuest} />
    </div>
  );
}
