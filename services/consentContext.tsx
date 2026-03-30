import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PrivacyConsent } from '../types';
import { doc, onSnapshot, updateDoc, getFirestore } from 'firebase/firestore';

interface ConsentContextType {
  consent: PrivacyConsent | null;
  isLoaded: boolean;
  updateConsent: (updates: Partial<PrivacyConsent>) => Promise<void>;
  hasConsented: (type: keyof PrivacyConsent) => boolean;
}

const ConsentContext = createContext<ConsentContextType>({
  consent: null,
  isLoaded: false,
  updateConsent: async () => {},
  hasConsented: () => false,
});

export const useConsent = () => useContext(ConsentContext);

interface ConsentProviderProps {
  userId: string | null;
  children: React.ReactNode;
}

export const ConsentProvider: React.FC<ConsentProviderProps> = ({ userId, children }) => {
  const [consent, setConsent] = useState<PrivacyConsent | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!userId) {
      setConsent(null);
      setIsLoaded(true);
      return;
    }

    const db = getFirestore();
    const userDoc = doc(db, 'users', userId);

    const unsubscribe = onSnapshot(userDoc, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.privacyConsent) {
          setConsent(data.privacyConsent as PrivacyConsent);
        } else {
          setConsent(null);
        }
      } else {
        setConsent(null);
      }
      setIsLoaded(true);
    });

    return () => unsubscribe();
  }, [userId]);

  const updateConsent = useCallback(async (updates: Partial<PrivacyConsent>) => {
    if (!userId) return;

    const db = getFirestore();
    const userDoc = doc(db, 'users', userId);
    const now = new Date().toISOString();

    const newConsent: PrivacyConsent = {
      essential: true,
      aiProcessing: consent?.aiProcessing ?? false,
      pushNotifications: consent?.pushNotifications ?? false,
      consentVersion: '1.0',
      consentedAt: consent?.consentedAt || now,
      updatedAt: now,
      ...updates,
    };

    await updateDoc(userDoc, { privacyConsent: newConsent });
  }, [userId, consent]);

  const hasConsented = useCallback((type: keyof PrivacyConsent): boolean => {
    if (!consent) return false;
    const value = consent[type];
    return typeof value === 'boolean' ? value : !!value;
  }, [consent]);

  return (
    <ConsentContext.Provider value={{ consent, isLoaded, updateConsent, hasConsented }}>
      {children}
    </ConsentContext.Provider>
  );
};
