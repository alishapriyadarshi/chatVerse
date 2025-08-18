import { ChatWindow } from '@/components/chat/chat-window';

export default function ConversationPage({ params }: { params: { id: string } }) {
  return <ChatWindow conversationId={params.id} />;
}
