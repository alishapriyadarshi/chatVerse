'use client';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImagePlus, SendHorizonal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MessageInputProps {
  onSendMessage: (text: string, imageUrl?: string) => void;
  isGuest?: boolean;
}

export function MessageInput({ onSendMessage, isGuest }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isGuest) {
      toast({
        title: 'Feature Locked',
        description: 'Guest users cannot upload images.',
        variant: 'destructive',
      });
      return;
    }
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onSendMessage('', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSendMessage(message);
    setMessage('');
  };

  return (
    <form
      onSubmit={handleSend}
      className="p-4 border-t border-border/50 bg-background/50 flex items-start gap-4"
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleImageUpload}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0"
        onClick={() => fileInputRef.current?.click()}
      >
        <ImagePlus className="h-6 w-6 text-muted-foreground" />
      </Button>
      <div className="relative flex-1">
        <Textarea
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
          rows={1}
          className="pr-20 min-h-[40px] max-h-48 resize-none bg-background rounded-full py-3 px-5"
        />
        <Button
          type="submit"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-9 w-9 bg-accent hover:bg-accent/90"
          disabled={!message.trim()}
        >
          <SendHorizonal className="h-5 w-5 text-accent-foreground" />
          <span className="sr-only">Send</span>
        </Button>
      </div>
    </form>
  );
}
