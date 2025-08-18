'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Message as MessageType, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Timestamp } from 'firebase/firestore';

interface MessageProps {
  message: MessageType;
  currentUser: User;
}

export function Message({ message, currentUser }: MessageProps) {
  const [timestamp, setTimestamp] = useState('');

  useEffect(() => {
    const getTimestamp = () => {
        let date: Date;
        if (message.timestamp instanceof Timestamp) {
            date = message.timestamp.toDate();
        } else if (message.timestamp instanceof Date) {
            date = message.timestamp;
        } else {
            return 'sending...';
        }
        return formatDistanceToNow(date, { addSuffix: true });
    }


    const updateTimestamp = () => {
      setTimestamp(getTimestamp());
    };

    updateTimestamp();
    const intervalId = setInterval(updateTimestamp, 60000); 

    return () => clearInterval(intervalId);
  }, [message.timestamp]);
  
  const isSender = message.sender.id === currentUser.id;
  
  const getInitials = (name: string) => {
    if (!name) return '??'
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className={cn('flex items-end gap-3', isSender ? 'justify-end' : 'justify-start')}>
      {!isSender && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.sender.avatarUrl} />
          <AvatarFallback>{getInitials(message.sender.name)}</AvatarFallback>
        </Avatar>
      )}
      <div className={cn('max-w-xs md:max-w-md lg:max-w-lg flex flex-col gap-1', isSender ? 'items-end' : 'items-start')}>
        <div className={cn(
          'p-3 rounded-2xl text-foreground',
          isSender ? 'bg-primary rounded-br-none' : 'bg-background rounded-bl-none'
        )}>
          {!isSender && (
            <p className="text-xs font-semibold mb-1 text-primary-foreground/80">{message.sender.name}</p>
          )}
          {message.imageUrl && (
            <Image
              src={message.imageUrl}
              alt="Uploaded image"
              width={300}
              height={200}
              className="rounded-lg mb-2"
              data-ai-hint="chat image"
            />
          )}
          <p className="whitespace-pre-wrap">{message.text}</p>
        </div>
        <span className="text-xs text-muted-foreground px-1">
          {timestamp}
        </span>
      </div>
       {isSender && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={currentUser.avatarUrl} />
          <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
