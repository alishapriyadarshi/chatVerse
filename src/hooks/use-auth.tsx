
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

      if (isGuestMode && !firebaseUser) {
        // If guest mode is requested and no user is logged in, sign in anonymously.
        // onAuthStateChanged will be triggered again with the new user.
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Anonymous sign-in failed:", error);
          setLoading(false);
        }
        // Return early, wait for the next auth state change
        return;
      }

      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUser(userSnap.data() as User);
        } else {
          // This block will now correctly handle both new Google users and new anonymous users
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
      } else {
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
