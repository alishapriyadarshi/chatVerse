'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImagePlus, SendHorizonal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CURRENT_USER } from '@/lib/dummy-data';

export function MessageInput({ isGuest }: { isGuest?: boolean }) {
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  const handleImageUpload = () => {
    if (isGuest) {
      toast({
        title: 'Feature Locked',
        description: 'Guest users cannot upload images.',
        variant: 'destructive',
      });
      return;
    }
    // Trigger file input click
    document.getElementById('image-upload')?.click();
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    console.log('Sending message:', message);
    setMessage('');
  };

  return (
    <form
      onSubmit={handleSend}
      className="p-4 border-t border-border/50 bg-background/50 flex items-start gap-4"
    >
      <input type="file" id="image-upload" className="hidden" accept="image/*" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0"
        onClick={handleImageUpload}
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
