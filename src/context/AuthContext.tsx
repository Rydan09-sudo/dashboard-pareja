import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { UserProfile, Couple } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  coupleData: Couple | null;
  loading: boolean;
  linkPartner: (partnerCode: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [coupleData, setCoupleData] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndCouple = async (currentUser: User) => {
    const userRef = doc(db, 'users', currentUser.uid);
    let userSnap = await getDoc(userRef);

    let profile: UserProfile;

    if (!userSnap.exists()) {
      const coupleCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      profile = {
        uid: currentUser.uid,
        email: currentUser.email || '',
        coupleCode,
        coupleId: null,
        createdAt: serverTimestamp()
      };
      await setDoc(userRef, profile);
    } else {
      profile = userSnap.data() as UserProfile;
    }

    setUserProfile(profile);

    if (profile.coupleId) {
      const coupleRef = doc(db, 'couples', profile.coupleId);
      const coupleSnap = await getDoc(coupleRef);
      if (coupleSnap.exists()) {
        setCoupleData({ id: coupleSnap.id, ...coupleSnap.data() } as Couple);
      }
    } else {
      setCoupleData(null);
    }
  };

  const linkPartner = async (partnerCode: string): Promise<boolean> => {
    if (!user || !userProfile) return false;

    // Search for partner user code in Firestore
    // Simplify: User enters partner code, query users where coupleCode == partnerCode
    try {
      const { collection, query, where, getDocs, updateDoc } = await import('firebase/firestore');
      const q = query(collection(db, 'users'), where('coupleCode', '==', partnerCode.trim().toUpperCase()));
      const querySnap = await getDocs(q);

      if (querySnap.empty) {
        throw new Error('Código de pareja no encontrado');
      }

      const partnerDoc = querySnap.docs[0];
      const partnerData = partnerDoc.data() as UserProfile;

      if (partnerData.uid === user.uid) {
        throw new Error('No puedes vincularte con tu propio código');
      }

      const coupleId = `couple_${user.uid}_${partnerData.uid}`;
      const coupleRef = doc(db, 'couples', coupleId);

      await setDoc(coupleRef, {
        partner1: user.uid,
        partner2: partnerData.uid,
        createdAt: serverTimestamp()
      });

      // Update both user profiles
      await updateDoc(doc(db, 'users', user.uid), { coupleId });
      await updateDoc(doc(db, 'users', partnerData.uid), { coupleId });

      await fetchProfileAndCouple(user);
      return true;
    } catch (err: any) {
      console.error('Error al vincular pareja:', err);
      throw err;
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfileAndCouple(user);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfileAndCouple(currentUser);
      } else {
        setUserProfile(null);
        setCoupleData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, coupleData, loading, linkPartner, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
