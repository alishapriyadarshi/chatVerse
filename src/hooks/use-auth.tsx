
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signInAnonymously } from 'firebase/auth';
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
    const isGuestMode = searchParams.get('guest') === 'true';
    if (isGuestMode && !auth.currentUser) {
        setLoading(true);
        signInAnonymously(auth).catch((error: any) => {
            console.error("Anonymous sign-in error:", error);
            let description = 'Could not sign you in as a guest. Please try again.';
            if (error.code === 'auth/admin-restricted-operation') {
                description = 'Guest mode is disabled. Please enable Anonymous sign-in in the Firebase console for project chatverse-v8eax.';
            }
             toast({ title: 'Guest Sign In Failed', description, variant: 'destructive' });
             router.replace('/');
        }).finally(() => {
            // onAuthStateChanged will handle setting loading to false
        });
    }
  }, [pathname, searchParams, router, toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setLoading(true);
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
        
        const isAuthPage = pathname === '/';
        if (isAuthPage) {
          const newPath = appUser.isGuest ? '/chat?guest=true' : '/chat';
          router.replace(newPath);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

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
