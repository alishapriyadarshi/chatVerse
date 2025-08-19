'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarSeparator } from '@/components/ui/sidebar';
import { LogOut, Settings, MessageSquare, Users, PlusCircle } from 'lucide-react';
import type { Conversation, User } from '@/lib/types';
import { GEMINI_USER } from '@/lib/dummy-data';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, onSnapshot, addDoc, getDocs, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export function SidebarContentComponent() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // Listen for conversations
    const convosQuery = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', currentUser.id)
    );
    const unsubConversations = onSnapshot(convosQuery, async (snapshot) => {
      const convos: Conversation[] = [];
      for (const doc of snapshot.docs) {
        const convData = { id: doc.id, ...doc.data() } as Conversation;
        // Fetch full participant details
        const participantPromises = convData.participantIds.map(id => getDoc(db, 'users', id));
        const participantDocs = await Promise.all(participantPromises);
        convData.participants = participantDocs.map(pDoc => pDoc.data() as User).filter(Boolean);
        convos.push(convData);
      }
      setConversations(convos);
    });

    // Listen for online users (all users for now, could be optimized with presence)
    const usersQuery = query(collection(db, 'users'), where('id', '!=', currentUser.id));
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((doc) => {
        users.push(doc.data() as User);
      });
      setOnlineUsers(users);
    });
    
    return () => {
      unsubConversations();
      unsubUsers();
    };
  }, [currentUser]);

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace('/');
      window.location.assign('/');
    } catch (error) {
      console.error('Error signing out: ', error);
      toast({
        title: 'Logout Failed',
        description: 'Could not log you out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateNewChat = async (otherUser: User) => {
    if (!currentUser) return;

    // Check if a conversation already exists
    const existingConvo = conversations.find(c => 
        c.type === 'direct' && 
        c.participantIds.length === 2 &&
        c.participantIds.includes(currentUser.id) &&
        c.participantIds.includes(otherUser.id)
    );

    if (existingConvo) {
      router.push(`/chat/${existingConvo.id}`);
      setIsModalOpen(false);
      return;
    }

    // Create a new conversation
    try {
      const newConversationRef = await addDoc(collection(db, 'conversations'), {
        type: 'direct',
        participantIds: [currentUser.id, otherUser.id],
        createdAt: serverTimestamp(),
        lastMessage: null,
        unreadCount: 0,
      });
      router.push(`/chat/${newConversationRef.id}`);
      setIsModalOpen(false);
    } catch (error: any) {
        console.error("Error creating new chat: ", error);
        if (error.code === 'permission-denied') {
             toast({
                title: 'Permission Denied',
                description: "Guest users can't create chats. Please update your Firestore security rules to allow this.",
                variant: 'destructive',
                duration: 9000,
            });
        } else {
            toast({ title: 'Error', description: 'Could not start a new chat.', variant: 'destructive'});
        }
    }
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col h-full p-4">
        <p>Loading user...</p>
      </div>
    );
  }
  
  const allConversations = [
      {
        id: 'conv-gemini',
        name: GEMINI_USER.name,
        avatarUrl: GEMINI_USER.avatarUrl,
        lastMessage: { text: 'Ask me anything...' },
        unreadCount: 0,
        type: 'direct',
        participantIds: [currentUser.id, GEMINI_USER.id],
      } as Conversation,
      ...conversations,
  ];

  return (
    <div className="flex flex-col h-full">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
            <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col truncate">
            <span className="font-semibold truncate font-headline">{currentUser.name}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 p-0">
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span className="text-sm">Conversations</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsModalOpen(true)}>
              <PlusCircle className="h-4 w-4" />
            </Button>
          </SidebarGroupLabel>
          <SidebarMenu>
            {allConversations.map((conv) => {
              const otherParticipant = conv.type === 'direct' ? conv.participants?.find(p => p.id !== currentUser.id && p.id !== GEMINI_USER.id) : null;
              const name = conv.name || (conv.id === 'conv-gemini' ? GEMINI_USER.name : otherParticipant?.name) || 'Conversation';
              const avatarUrl = conv.avatarUrl || (conv.id === 'conv-gemini' ? GEMINI_USER.avatarUrl : otherParticipant?.avatarUrl);

              return (
                <SidebarMenuItem key={conv.id}>
                  <Link href={`/chat/${conv.id}`}>
                    <SidebarMenuButton
                      isActive={pathname === `/chat/${conv.id}`}
                      className="justify-start w-full"
                      tooltip={name}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={avatarUrl} alt={name} />
                        <AvatarFallback>{getInitials(name ?? 'U')}</AvatarFallback>
                      </Avatar>
                      <span className="truncate">{name}</span>
                      {conv.unreadCount > 0 && (
                        <div className="ml-auto h-5 min-w-[1.25rem] rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center px-1">
                          {conv.unreadCount}
                        </div>
                      )}
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="justify-start w-full" tooltip="Settings">
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="justify-start w-full" tooltip="Log Out" onClick={handleLogout}>
              <LogOut />
              <span>Log Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a new chat</DialogTitle>
            <DialogDescription>Select a user to start a one-on-one conversation.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
            {onlineUsers.length > 0 ? onlineUsers.map(user => (
              <div key={user.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer" onClick={() => handleCreateNewChat(user)}>
                 <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <span>{user.name}</span>
              </div>
            )) : <p className="text-sm text-muted-foreground p-4 text-center">No other users are online.</p>
            }
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
