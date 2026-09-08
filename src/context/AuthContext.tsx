import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { UserProfile, Couple, Language, ThemeMode } from '../types';
import { translations } from '../lib/i18n';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  coupleData: Couple | null;
  loading: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  t: typeof translations['es'];
  linkPartner: (partnerCode: string) => Promise<boolean>;
  updateProfileName: (name: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [coupleData, setCoupleData] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [language, setLanguageState] = useState<Language>('es');
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  // Apply theme class to <html> document element
  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else if (mode === 'light') {
      root.classList.remove('dark');
    } else {
      // System
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    if (user) {
      updateDoc(doc(db, 'users', user.uid), { theme: newTheme }).catch(console.error);
    }
  };

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    if (user) {
      updateDoc(doc(db, 'users', user.uid), { language: newLang }).catch(console.error);
    }
  };

  const fetchProfileAndCouple = async (currentUser: User) => {
    const userRef = doc(db, 'users', currentUser.uid);
    let userSnap = await getDoc(userRef);

    let profile: UserProfile;

    if (!userSnap.exists()) {
      const coupleCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      profile = {
        uid: currentUser.uid,
        email: currentUser.email || '',
        displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuario',
        coupleCode,
        coupleId: null,
        language: 'es',
        theme: 'dark',
        createdAt: serverTimestamp()
      };
      await setDoc(userRef, profile);
    } else {
      profile = userSnap.data() as UserProfile;
    }

    setUserProfile(profile);

    if (profile.language) setLanguageState(profile.language);
    if (profile.theme) {
      setThemeState(profile.theme);
      applyTheme(profile.theme);
    } else {
      applyTheme('dark');
    }

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

    try {
      const { collection, query, where, getDocs, updateDoc: updateFirestoreDoc } = await import('firebase/firestore');
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

      await updateFirestoreDoc(doc(db, 'users', user.uid), { coupleId });
      await updateFirestoreDoc(doc(db, 'users', partnerData.uid), { coupleId });

      await fetchProfileAndCouple(user);
      return true;
    } catch (err: any) {
      console.error('Error al vincular pareja:', err);
      throw err;
    }
  };

  const updateProfileName = async (name: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), { displayName: name });
    setUserProfile(prev => prev ? { ...prev, displayName: name } : null);
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

  const t = translations[language] || translations.es;

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      coupleData,
      loading,
      language,
      setLanguage,
      theme,
      setTheme,
      t,
      linkPartner,
      updateProfileName,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
