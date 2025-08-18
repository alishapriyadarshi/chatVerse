"use client";

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
    const handleGuestUser = async () => {
      try {
        const userCredential = await signInAnonymously(auth);
        const firebaseUser = userCredential.user;
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          const guestUser: User = {
            id: firebaseUser.uid,
            name: `Guest #${firebaseUser.uid.slice(0, 4)}`,
            avatarUrl: `https://placehold.co/100x100?text=G`,
            secretId: `GUEST-${firebaseUser.uid.slice(0, 8).toUpperCase()}`,
            isGuest: true,
          };
          await setDoc(userRef, guestUser);
          setUser(guestUser);
        } else {
          setUser(userSnap.data() as User);
        }
      } catch (error) {
        console.error("Anonymous sign-in failed:", error);
      } finally {
        setLoading(false);
      }
    };
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('guest') === 'true' && !firebaseUser) {
         handleGuestUser();
         return;
      }

      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUser(userSnap.data() as User);
        } else if (!firebaseUser.isAnonymous) {
           const { uid, displayName, photoURL } = firebaseUser;
           const newUser: User = {
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
