
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signInAnonymously } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      const params = new URLSearchParams(window.location.search);
      const isGuestMode = params.get('guest') === 'true';

      if (firebaseUser) {
        // This handles all authenticated users: Google, Anonymous, etc.
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUser(userSnap.data() as User);
        } else {
          const { uid, displayName, photoURL, isAnonymous } = firebaseUser;
           const newUser: User = isAnonymous 
           ? {
              id: uid,
              name: `Guest #${uid.slice(0, 4)}`,
              avatarUrl: `https://placehold.co/100x100?text=G`,
              secretId: `GUEST-${uid.slice(0, 8).toUpperCase()}`,
              isGuest: true,
            }
           : {
              id: uid,
              name: displayName || 'User',
              avatarUrl: photoURL || `https://placehold.co/100x100?text=${displayName?.[0] || 'U'}`,
              secretId: `USER-${uid.slice(0, 8).toUpperCase()}`,
           };
           await setDoc(userRef, newUser);
           setUser(newUser);
        }
      } else if (isGuestMode) {
        // If there's no firebaseUser but the URL indicates a guest, try to sign in.
        try {
          await signInAnonymously(auth);
          // onAuthStateChanged will be triggered again by the line above,
          // so we don't need to do anything else here.
        } catch (error) {
          // ** WORKAROUND **
          // If anonymous sign-in fails (e.g., API not enabled or blocked), create a local guest user
          console.error("Anonymous sign-in failed, creating a local guest user as a fallback:", error);
          const localGuestId = `local-guest-${Date.now()}`;
          const localGuestUser: User = {
            id: localGuestId,
            name: `Guest #${localGuestId.slice(-4)}`,
            avatarUrl: `https://placehold.co/100x100?text=G`,
            secretId: `GUEST-${localGuestId.slice(-8).toUpperCase()}`,
            isGuest: true,
          };
          setUser(localGuestUser);
        }
      } else {
         // No firebaseUser and not a guest flow, so no one is logged in.
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
