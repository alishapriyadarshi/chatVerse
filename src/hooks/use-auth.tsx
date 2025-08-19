
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
    // This effect should run only once on mount to handle the initial auth state.
    const processInitialAuth = async () => {
      setLoading(true);
      try {
        // Check for redirect result first. This is crucial for Google Sign-In.
        const result = await getRedirectResult(auth);
        if (result) {
          // A redirect just happened. onAuthStateChanged will handle the user creation
          // and navigation. We just need to wait.
          return;
        }

        // If no redirect result, check for guest mode or an existing session.
        const isGuestMode = searchParams.get('guest') === 'true';
        if (isGuestMode && !auth.currentUser) {
          await signInAnonymously(auth);
          // onAuthStateChanged will handle the rest.
        }
        
      } catch (error: any) {
        console.error("Auth initialization error:", error);
        let description = 'Could not complete sign in. Please try again.';
        if (error.code === 'auth/unauthorized-domain') {
           description = `This domain is not authorized for sign-in. Please add it to the list of authorized domains in your Firebase console for project chatverse-v8eax.`;
        } else if (error.code === 'auth/admin-restricted-operation') {
            description = 'Guest mode is disabled. Please enable Anonymous sign-in in the Firebase console.';
        } else if (error.code?.includes('requests-to-this-api') || error.code?.includes('identitytoolkit')) {
          description = 'Project configuration is blocking login. Please check API key restrictions and authorized domains in your Firebase console for project chatverse-v8eax.';
        }
        toast({ title: 'Sign In Failed', description, variant: 'destructive' });
        router.replace('/'); // Go back to login on error
      } finally {
        // If onAuthStateChanged hasn't resolved yet, this might be premature.
        // The listener below will handle setting loading to false.
      }
    };

    processInitialAuth();

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
          const newPath = appUser.isGuest ? '/chat?guest=true' : '/chat';
          router.replace(newPath);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname, searchParams, toast]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
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
