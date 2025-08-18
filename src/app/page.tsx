import { AuthForm } from '@/components/auth-form';

export default function Home() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-8 bg-cover bg-center"
      style={{ backgroundImage: "url('https://placehold.co/1920x1080')" }}
      data-ai-hint="abstract background"
    >
      <div className="absolute inset-0 bg-background/50 backdrop-blur-sm" />
      <div className="z-10">
        <AuthForm />
      </div>
    </main>
  );
}
