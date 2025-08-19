
'use client';
import { SidebarTrigger } from '../ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';

interface ChatHeaderProps {
  title: string;
  avatarUrl?: string;
  avatarFallback: string;
  description?: string;
}

export function ChatHeader({ title, avatarUrl, avatarFallback, description }: ChatHeaderProps) {
  return (
    <header className="flex items-center p-4 border-b border-border/50">
      <SidebarTrigger className="md:hidden mr-2" />
      <Avatar className="h-10 w-10">
        <AvatarImage src={avatarUrl} alt={title} />
        <AvatarFallback>{avatarFallback}</AvatarFallback>
      </Avatar>
      <div className="ml-4">
        <h2 className="font-semibold text-lg font-headline">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon"><MoreVertical /></Button>
      </div>
    </header>
  );
}
