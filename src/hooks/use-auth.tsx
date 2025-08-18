
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
        // User is signed in (Google or Anonymous)
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          // User document already exists, just set it
          setUser(userSnap.data() as User);
        } else {
          // New user, create the user document in Firestore
          const { uid, displayName, photoURL, isAnonymous } = firebaseUser;
           const newUser: User = {
              id: uid,
              name: isAnonymous ? `Guest #${uid.slice(0, 4)}` : displayName || 'User',
              avatarUrl: isAnonymous ? `https://placehold.co/100x100?text=G` : photoURL || `https://placehold.co/100x100?text=${displayName?.[0] || 'U'}`,
              secretId: isAnonymous ? `GUEST-${uid.slice(0, 8).toUpperCase()}`: `USER-${uid.slice(0, 8).toUpperCase()}`,
              isGuest: isAnonymous,
            };
           await setDoc(userRef, newUser);
           setUser(newUser);
        }
      } else if (isGuestMode) {
        // No user is signed in, but they want to be a guest
        try {
          await signInAnonymously(auth);
          // onAuthStateChanged will be re-triggered by the line above,
          // which will then handle the user document creation.
        } catch (error) {
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
