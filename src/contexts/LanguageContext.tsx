"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

type Language = 'en' | 'mr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  availableLanguages: { code: Language; name: string; flag: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_CONFIG = {
  en: { name: 'English', flag: '🇺🇸' },
  mr: { name: 'मराठी', flag: '🇮🇳' }
};

// Import translations
import enTranslations from '../../messages/en.json';
import mrTranslations from '../../messages/mr.json';

const translations: Record<Language, any> = {
  en: enTranslations,
  mr: mrTranslations
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>('mr'); // Default to Marathi

  useEffect(() => {
    // Set default language based on user role
    if (user?.user_metadata?.role === 'admin') {
      // For admin, default to Marathi
      const storedLang = localStorage.getItem('messmate_admin_language') as Language;
      if (storedLang && (storedLang === 'en' || storedLang === 'mr')) {
        setLanguageState(storedLang);
      } else {
        setLanguageState('mr'); // Default to Marathi for admin
        localStorage.setItem('messmate_admin_language', 'mr');
      }
    } else {
      // For regular users, you can set different logic if needed
      setLanguageState('en'); // Default to English for regular users
    }
  }, [user]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (user?.user_metadata?.role === 'admin') {
      localStorage.setItem('messmate_admin_language', lang);
    }
  };

  // Translation function
  const t = (key: string): string => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  // Available languages (only English and Marathi for admin)
  const availableLanguages = Object.entries(LANGUAGE_CONFIG).map(([code, config]) => ({
    code: code as Language,
    name: config.name,
    flag: config.flag
  }));

  const value = {
    language,
    setLanguage,
    t,
    availableLanguages
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}