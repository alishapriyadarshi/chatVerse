'use client';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  MessageSquare,
  Users,
  Search,
  PlusCircle,
  LogOut,
  Settings,
} from 'lucide-react';
import type { Conversation, User } from '@/lib/types';
import { GEMINI_USER } from '@/lib/dummy-data';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export function SidebarContentComponent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const isGuest = currentUser?.isGuest || false;

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', currentUser.id)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const convos: Conversation[] = [];
      querySnapshot.forEach((doc) => {
        convos.push({ id: doc.id, ...doc.data() } as Conversation);
      });
      // Add Gemini conversation if it doesn't exist for the user
      if (!convos.some(c => c.id === 'conv-gemini')) {
        const geminiConv: Conversation = {
            id: 'conv-gemini',
            type: 'direct',
            participants: [currentUser, GEMINI_USER],
            participantIds: [currentUser.id, GEMINI_USER.id],
            name: GEMINI_USER.name,
            avatarUrl: GEMINI_USER.avatarUrl,
            lastMessage: null,
            unreadCount: 1,
        };
        convos.unshift(geminiConv);
      }

      setConversations(convos);
    });

    return () => unsubscribe();
  }, [currentUser]);
  
  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  const getLinkHref = (baseHref: string) => {
    return isGuest ? `${baseHref}?guest=true` : baseHref;
  }

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({
        title: 'Logout Failed',
        description: 'Could not log you out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col h-full p-4">
        <p>Loading user...</p>
      </div>
    );
  }

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
            <span className="text-xs text-muted-foreground truncate">
              ID: {currentUser.secretId}
            </span>
          </div>
        </div>
        <form className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Find user by ID..." className="pl-9" />
        </form>
      </SidebarHeader>

      <SidebarContent className="flex-1 p-0">
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span className="text-sm">Conversations</span>
             <Button variant="ghost" size="icon" className="h-7 w-7">
                <PlusCircle className="h-4 w-4" />
             </Button>
          </SidebarGroupLabel>
          <SidebarMenu>
            {conversations.map((conv) => {
              const linkHref = getLinkHref(`/chat/${conv.id}`);
              const otherParticipant = conv.type === 'direct' ? conv.participants.find(p => p.id !== currentUser.id && p.id !== GEMINI_USER.id) : null;
              const name = conv.name || otherParticipant?.name || 'Conversation';
              const avatarUrl = conv.avatarUrl || otherParticipant?.avatarUrl;

              return (
                <SidebarMenuItem key={conv.id}>
                  <Link href={linkHref}>
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
            <SidebarMenuButton className="justify-start w-full" tooltip="Log Out" onClick={handleLogout} disabled={isGuest}>
              <LogOut />
              <span>Log Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </div>
  );
}
