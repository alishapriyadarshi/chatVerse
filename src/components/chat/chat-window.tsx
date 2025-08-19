'use client';
import { GEMINI_USER } from '@/lib/dummy-data';
import type { Conversation, Message as MessageType, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import { Message } from './message';
import { MessageInput } from './message-input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useState, useRef } from 'react';
import { chat } from '@/ai/flows/chat-flow';
import { useAuth } from '@/hooks/use-auth';
import { db, storage } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';

interface ChatWindowProps {
  conversationId: string;
}

// A simple cache for user data to avoid repeated fetches
const userCache = new Map<string, User>();

async function getUser(userId: string): Promise<User | undefined> {
  if (userCache.has(userId)) {
    return userCache.get(userId);
  }
  if (userId === GEMINI_USER.id) {
    userCache.set(GEMINI_USER.id, GEMINI_USER);
    return GEMINI_USER;
  }
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const user = userSnap.data() as User;
      userCache.set(userId, user);
      return user;
    }
  } catch (error) {
    console.error("Error fetching user:", error);
  }
  return undefined;
}


export function ChatWindow({ conversationId }: ChatWindowProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;
  
    let unsubConversation: () => void;
  
    const fetchConversation = async () => {
      if (conversationId === 'conv-gemini') {
        // This is a virtual conversation, create it on the fly
        setConversation({
          id: 'conv-gemini',
          type: 'direct',
          participants: [currentUser, GEMINI_USER],
          participantIds: [currentUser.id, GEMINI_USER.id],
          name: GEMINI_USER.name,
          avatarUrl: GEMINI_USER.avatarUrl,
          lastMessage: null,
          unreadCount: 0,
        });
      } else {
        const convRef = doc(db, 'conversations', conversationId);
        unsubConversation = onSnapshot(convRef, async (doc) => {
          if (doc.exists()) {
             const convData = { id: doc.id, ...doc.data() } as Conversation;
            // Fetch full user objects for participants
            const participantPromises = convData.participantIds.map(id => getUser(id));
            const participants = await Promise.all(participantPromises);
            convData.participants = participants.filter(Boolean) as User[];
            setConversation(convData);
          } else {
            console.error("Conversation not found!");
            setConversation(null);
          }
        });
      }
    };
  
    fetchConversation();
  
    return () => {
      if (unsubConversation) {
        unsubConversation();
      }
    };
  }, [conversationId, currentUser]);
  
  useEffect(() => {
    if (!conversationId || !currentUser) return;

    if (conversationId === 'conv-gemini') {
        setMessages([{
            id: 'gem-intro',
            senderId: GEMINI_USER.id,
            sender: GEMINI_USER,
            text: "Hello! How can I help you today?",
            timestamp: new Date(),
        }]);
        return;
    };

    const messagesQuery = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, async (querySnapshot) => {
      const msgsPromises = querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const sender = await getUser(data.senderId);
        return { 
          id: doc.id, 
          ...data,
          sender, // Populate sender object
        } as MessageType;
      });
      const msgs = await Promise.all(msgsPromises);
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [conversationId, currentUser]);


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

  const handleSendMessage = async (text: string, imageDataUrl?: string) => {
    if (!currentUser || !conversation) return;
    if (!text.trim() && !imageDataUrl) return;

    let imageUrl: string | undefined = undefined;

    if (imageDataUrl) {
        if(currentUser.isGuest) {
            toast({
                title: "Feature unavailable for guests",
                description: "Guests cannot send images.",
                variant: "destructive"
            });
            return;
        }
      const storageRef = ref(storage, `chat-images/${conversation.id}/${Date.now()}`);
      try {
        await uploadString(storageRef, imageDataUrl, 'data_url');
        imageUrl = await getDownloadURL(storageRef);
      } catch (error) {
        console.error("Error uploading image:", error);
        toast({ title: 'Image Upload Failed', description: 'Could not upload your image. Please try again.', variant: 'destructive' });
        return;
      }
    }
    
    const newMessageData = {
      senderId: currentUser.id,
      text,
      imageUrl,
      timestamp: serverTimestamp(),
    };

    const isGeminiConversation = conversation.id === 'conv-gemini';

    const tempMessageId = `temp-${Date.now()}`;
    const optimisticMessage: MessageType = {
        id: tempMessageId,
        senderId: currentUser.id,
        sender: currentUser,
        text,
        imageUrl,
        timestamp: new Date()
    };

    // For non-gemini conversations, add the message to firestore immediately
    if (!isGeminiConversation) {
        addDoc(collection(db, 'conversations', conversation.id, 'messages'), newMessageData);
    } else {
        // For gemini, we add it optimistically
        setMessages(prev => [...prev, optimisticMessage]);
    }
    
    const shouldGeminiRespond = 
      isGeminiConversation ||
      (conversation.participants && conversation.participants.some(p => p.id === GEMINI_USER.id)) ||
      text.toLowerCase().includes('@gemini');

    if (shouldGeminiRespond) {
      setIsTyping(true);
      try {
        const history = [...messages, optimisticMessage]
            .slice(-10) // Limit history
            .map(msg => ({
                role: msg.senderId === currentUser.id ? 'user' as const : 'model' as const,
                content: msg.text,
            }));
        
        const responseText = await chat({
          history,
          message: text,
        });

        const geminiMessage: MessageType = {
          id: `msg-${Date.now() + 1}`,
          senderId: GEMINI_USER.id,
          sender: GEMINI_USER,
          text: responseText,
          timestamp: new Date(),
        };

        if (!isGeminiConversation) {
            const geminiMessageForDb = {
                senderId: GEMINI_USER.id,
                text: responseText,
                timestamp: serverTimestamp()
            };
            addDoc(collection(db, 'conversations', conversation.id, 'messages'), geminiMessageForDb);
        } else {
             setMessages(prev => [...prev.filter(m => m.id !== tempMessageId), optimisticMessage, geminiMessage]);
        }
      } catch (error) {
        console.error("Error getting response from Gemini:", error);
        const errorMessage: MessageType = {
          id: `err-${Date.now()}`,
          senderId: GEMINI_USER.id,
          sender: GEMINI_USER,
          text: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        };
         setMessages(prev => [...prev.filter(m => m.id !== tempMessageId), optimisticMessage, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    }
  };
  
  if (!currentUser || !conversation) {
    return (
      <div className="flex h-full items-center justify-center bg-card/75 backdrop-blur-xl rounded-2xl">
        <p>Loading conversation...</p>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const otherParticipant = conversation.type === 'direct' ? conversation.participants.find(p => p.id !== currentUser.id) : null;
  const conversationName = conversation.name || otherParticipant?.name || 'Conversation';
  const conversationAvatar = conversation.avatarUrl || otherParticipant?.avatarUrl;

  return (
    <div className="flex flex-col h-full bg-card/75 backdrop-blur-xl rounded-2xl overflow-hidden">
      <header className="flex items-center p-4 border-b border-border/50">
        <Avatar className="h-10 w-10">
          <AvatarImage src={conversationAvatar} alt={conversationName} />
          <AvatarFallback>{getInitials(conversationName)}</AvatarFallback>
        </Avatar>
        <div className="ml-4">
          <h2 className="font-semibold text-lg font-headline">{conversationName}</h2>
          <p className="text-sm text-muted-foreground">
            {conversation.type === 'group' 
              ? `${conversation.participantIds.length} members`
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

      <MessageInput onSendMessage={handleSendMessage} isGuest={currentUser.isGuest} />
    </div>
  );
}
