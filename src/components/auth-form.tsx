'use client';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { signInWithRedirect, GoogleAuthProvider, getRedirectResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    width="24px"
    height="24px"
  >
    <path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />
    <path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"

    />
    <path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.012,35.846,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    />
  </svg>
);


export function AuthForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true); // Start loading to process redirect

  useEffect(() => {
    const processRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // User successfully signed in.
          router.push('/chat');
        }
      } catch (error: any) {
         if (error.code !== 'auth/no-redirect-active') {
            console.error("Error processing redirect result: ", error);
            let description = 'Could not complete sign in. Please try again.';
            if (error.code === 'auth/requests-to-this-api-are-blocked.' || error.code.includes('identitytoolkit')) {
              description = 'Project configuration is blocking login. Please check API key restrictions and authorized domains in your Firebase console.';
            }
            toast({
                title: 'Sign In Failed',
                description,
                variant: 'destructive',
            });
         }
      } finally {
        setIsLoading(false);
      }
    };
    processRedirectResult();
  }, [router, toast]);


  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
      // The user will be redirected, and the useEffect hook will handle the result on return.
    } catch (error: any) {
      console.error("Error initiating sign in with Google: ", error);
      let description = 'Could not sign you in with Google. Please try again.';
       if (error.code === 'auth/requests-to-this-api-are-blocked.' || error.code.includes('identitytoolkit')) {
         description = 'Project configuration is blocking login. Please check API key restrictions and authorized domains in your Firebase console.';
       }
      toast({
        title: 'Sign In Failed',
        description,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      router.push('/chat?guest=true');
    } catch (error) {
       console.error("Error signing in as Guest: ", error);
       toast({
        title: 'Sign In Failed',
        description: 'Could not sign you in as Guest. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
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
        <Button variant="outline" size="lg" className="bg-background/80 hover:bg-background" onClick={handleGoogleSignIn} disabled={isLoading}>
            {isLoading ? 'Loading...' : (
                <>
                    <GoogleIcon className="mr-2" />
                    Sign In with Google
                </>
            )}
        </Button>
        <Button variant="secondary" size="lg" className="bg-accent/70 hover:bg-accent text-accent-foreground" onClick={handleGuestSignIn} disabled={isLoading}>
            Continue as Guest
        </Button>
      </CardContent>
    </Card>
  );
}
