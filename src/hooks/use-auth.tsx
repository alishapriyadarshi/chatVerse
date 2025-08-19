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
    // This effect should only run once on mount to handle the initial auth state.
    const handleInitialAuth = async () => {
      setLoading(true);
      const isGuestMode = searchParams.get('guest') === 'true';

      try {
        // Handle guest login first if requested
        if (isGuestMode && !auth.currentUser) {
          await signInAnonymously(auth);
          // The onAuthStateChanged listener below will handle the rest.
          return;
        }

        // Handle redirect result from Google Sign-In
        const result = await getRedirectResult(auth);
        if (result) {
          // This block runs when the user is redirected back from Google.
          // onAuthStateChanged will handle user creation and state setting.
        } else if (auth.currentUser) {
          // User is already signed in (e.g., from a previous session).
          // onAuthStateChanged will handle this.
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
      } finally {
        // The onAuthStateChanged listener will eventually set loading to false.
        // We set a timeout here to prevent getting stuck in a loading state if all else fails.
        setTimeout(() => {
          if (loading) {
            setLoading(false)
          }
        }, 3000);
      }
    };
    
    handleInitialAuth();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
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
        
        if (pathname === '/') {
          router.replace(appUser.isGuest ? '/chat?guest=true' : '/chat');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // Run only once

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
