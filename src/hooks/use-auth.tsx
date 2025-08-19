
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, Suspense } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { signInAnonymously } from 'firebase/auth';
import { useToast } from './use-toast';


interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

function AuthHandler() {
  const { loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const isGuestMode = searchParams.get('guest') === 'true';
    if (isGuestMode && !auth.currentUser && !loading) {
      signInAnonymously(auth).catch((error: any) => {
        console.error("Anonymous sign-in error:", error);
        let description = 'Could not sign you in as a guest. Please try again.';
        if (error.code === 'auth/admin-restricted-operation') {
          description = 'Guest mode is disabled. Please enable Anonymous sign-in in the Firebase console for project chatverse-v8eax.';
        }
        toast({ title: 'Guest Sign In Failed', description, variant: 'destructive' });
        router.replace('/');
      });
    }
  }, [pathname, searchParams, router, toast, loading]);

  useEffect(() => {
    if (!loading && user) {
        const isAuthPage = pathname === '/';
        if (isAuthPage) {
          router.replace('/chat');
        }
    }
  }, [user, loading, pathname, router]);


  return null;
}


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setLoading(true);
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        let appUser: User;
        if (userSnap.exists()) {
          appUser = userSnap.data() as User;
          await updateDoc(userRef, { isOnline: true, lastSeen: serverTimestamp() });
        } else {
          const { uid, isAnonymous } = firebaseUser;
          const newUser: User = {
            id: uid,
            name: `Guest #${uid.slice(0, 4)}`,
            avatarUrl: `https://placehold.co/100x100?text=${uid.slice(0,1).toUpperCase()}`,
            isGuest: isAnonymous,
            isOnline: true,
            lastSeen: serverTimestamp() as any,
            geminiMessageCount: 0,
          };
          await setDoc(userRef, newUser);
          appUser = newUser;
        }
        
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
        <Suspense fallback={null}>
            <AuthHandler/>
        </Suspense>
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
