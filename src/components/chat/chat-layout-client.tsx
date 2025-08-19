'use client';

import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarContentComponent } from '@/components/chat/sidebar-content';

export function ChatLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div
        className="relative min-h-screen w-full bg-cover bg-center"
        style={{ backgroundImage: "url('https://placehold.co/1920x1080')" }}
        data-ai-hint="abstract background"
      >
        <div className="absolute inset-0 bg-background/50" />
        <div className="relative flex min-h-screen">
          <Sidebar variant="inset" side="left" collapsible="icon" className="frosted-glass border-border/30 shadow-2xl">
            <SidebarContentComponent />
          </Sidebar>
          <SidebarInset className="p-0 m-0 md:m-2 md:rounded-2xl max-h-screen overflow-hidden bg-transparent">
            {children}
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
