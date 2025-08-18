'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  MessageSquare,
  Users,
  Search,
  PlusCircle,
  LogOut,
  Settings,
} from 'lucide-react';
import type { Conversation } from '@/lib/types';
import { CURRENT_USER, DUMMY_CONVERSATIONS } from '@/lib/dummy-data';

export function SidebarContentComponent() {
  const pathname = usePathname();
  const conversations = DUMMY_CONVERSATIONS;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="flex flex-col h-full">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={CURRENT_USER.avatarUrl} alt={CURRENT_USER.name} />
            <AvatarFallback>{getInitials(CURRENT_USER.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col truncate">
            <span className="font-semibold truncate font-headline">{CURRENT_USER.name}</span>
            <span className="text-xs text-muted-foreground truncate">
              ID: {CURRENT_USER.secretId}
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
              const Icon = conv.type === 'group' ? Users : MessageSquare;
              return (
                <SidebarMenuItem key={conv.id}>
                  <Link href={`/chat/${conv.id}`}>
                    <SidebarMenuButton
                      isActive={pathname === `/chat/${conv.id}`}
                      className="justify-start w-full"
                      tooltip={conv.name}
                    >
                       <Avatar className="h-6 w-6">
                        <AvatarImage src={conv.avatarUrl} alt={conv.name} />
                        <AvatarFallback>{getInitials(conv.name ?? 'U')}</AvatarFallback>
                      </Avatar>
                      <span className="truncate">{conv.name}</span>
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
            <Link href="/">
              <SidebarMenuButton className="justify-start w-full" tooltip="Log Out">
                <LogOut />
                <span>Log Out</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </div>
  );
}
