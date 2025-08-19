
'use client';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';

export function AuthForm() {
  const router = useRouter();
  const { loading: isAuthLoading } = useAuth();
  const [isGuestSignInProgress, setIsGuestSignInProgress] = useState(false);

  const handleGuestSignIn = () => {
    setIsGuestSignInProgress(true);
    // The useAuth hook will see this and trigger anonymous sign-in.
    router.push('/?guest=true');
  };

  // Combine local progress with global auth loading state for a responsive UI
  const isProcessing = isAuthLoading || isGuestSignInProgress;
  
  return (
    <Card className="w-full max-w-sm frosted-glass bg-card/80 border-border/30 shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-headline text-foreground">
          Welcome to ChatVerse
        </CardTitle>
        <CardDescription className="text-foreground/80 pt-2">
          Connect, collaborate, and chat in real-time.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Button variant="secondary" size="lg" className="bg-accent/70 hover:bg-accent text-accent-foreground" onClick={handleGuestSignIn} disabled={isProcessing}>
           {isProcessing ? 'Processing...' : 'Enter as Guest'}
        </Button>
      </CardContent>
    </Card>
  );
}
