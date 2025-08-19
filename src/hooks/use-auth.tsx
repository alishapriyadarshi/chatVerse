
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signInAnonymously, getRedirectResult } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useToast } from './use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthentication = async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        let appUser: User;
        if (userSnap.exists()) {
          appUser = userSnap.data() as User;
        } else {
          const { uid, displayName, photoURL, isAnonymous } = firebaseUser;
          const newUser: User = {
            id: uid,
            name: isAnonymous ? `Guest #${uid.slice(0, 4)}` : (displayName || 'User'),
            avatarUrl: isAnonymous ? `https://placehold.co/100x100?text=G` : (photoURL || `https://placehold.co/100x100?text=${(displayName?.charAt(0) || 'U').toUpperCase()}`),
            secretId: isAnonymous ? `GUEST-${uid.slice(0, 8).toUpperCase()}`: `USER-${uid.slice(0, 8).toUpperCase()}`,
            isGuest: isAnonymous,
          };
          await setDoc(userRef, newUser);
          appUser = newUser;
        }
        
        setUser(appUser);
        
        // Redirect if on the login page
        if (pathname === '/') {
          const newPath = appUser.isGuest ? '/chat?guest=true' : '/chat';
          router.replace(newPath);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    const unsubscribe = onAuthStateChanged(auth, handleAuthentication);

    // Handle initial state and redirects
    const processAuthResult = async () => {
      setLoading(true);
      try {
        const result = await getRedirectResult(auth);
        // If there's a result, onAuthStateChanged will fire and handle it.
        // If not, we check for guest mode or existing user.
        if (!result) {
          const isGuestMode = searchParams.get('guest') === 'true';
          if (isGuestMode && !auth.currentUser) {
            try {
              await signInAnonymously(auth);
              // onAuthStateChanged will handle the rest.
            } catch (error: any) {
              if (error.code === 'auth/admin-restricted-operation') {
                toast({
                  title: 'Guest Mode Disabled',
                  description: 'Anonymous sign-in is not enabled for this project. Please enable it in the Firebase console.',
                  variant: 'destructive',
                });
                 router.replace('/'); // Go back to login
              } else {
                 toast({ title: 'Guest Sign In Failed', description: 'Could not sign you in as a guest. Please try again.', variant: 'destructive' });
              }
               setLoading(false);
            }
          } else if (auth.currentUser) {
            // Manually trigger handler for already logged-in user if onAuthStateChanged hasn't fired yet
            await handleAuthentication(auth.currentUser);
          } else {
            setLoading(false);
          }
        }
      } catch (error: any) {
        console.error("Auth initialization error:", error);
        let description = 'Could not complete sign in. Please try again.';
        if (error.code === 'auth/unauthorized-domain') {
           description = `This domain is not authorized for sign-in. Please add it to the list of authorized domains in your Firebase console for project chatverse-v8eax.`;
        } else if (error.code?.includes('requests-to-this-api') || error.code?.includes('identitytoolkit')) {
          description = 'Project configuration is blocking login. Please check API key restrictions and authorized domains in your Firebase console for project chatverse-v8eax.';
        }
        toast({ title: 'Sign In Failed', description, variant: 'destructive' });
        setLoading(false);
        router.replace('/'); // Go back to login on error
      }
    };

    processAuthResult();

    return () => unsubscribe();
  }, [router, pathname, searchParams, toast]); // Dependencies for the effect

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
