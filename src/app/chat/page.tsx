import { MessageSquareDashed } from 'lucide-react';

export default function ChatPage() {
  // This will redirect to the first conversation or a specific one
  // The logic in layout.tsx or a future component will handle the actual redirection
  // based on the user's conversations.
  // For now, we show a placeholder.

  return (
    <div className="flex h-full flex-col items-center justify-center bg-card/75 backdrop-blur-xl rounded-2xl">
      <MessageSquareDashed className="h-24 w-24 text-muted-foreground" />
      <h2 className="mt-6 text-2xl font-semibold font-headline">Welcome to ChatVerse</h2>
      <p className="mt-2 text-muted-foreground">
        Select a conversation from the sidebar to start chatting.
      </p>
    </div>
  );
}
