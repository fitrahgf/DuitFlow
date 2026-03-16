'use client';

import React, { createContext, useContext, useState, useSyncExternalStore } from 'react';
import { Language, dictionaries, Dictionary } from '@/lib/i18n/dictionaries';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
  dict: Dictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const subscribeToLanguageStorage = (callback: () => void) => {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
};

const getStoredLanguage = (): Language => {
  if (typeof window === 'undefined') return 'id';
  const savedLang = localStorage.getItem('language');
  return savedLang === 'en' || savedLang === 'id' ? savedLang : 'id';
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const storedLanguage = useSyncExternalStore<Language>(
    subscribeToLanguageStorage,
    getStoredLanguage,
    () => 'id'
  );
  const [languageOverride, setLanguageOverride] = useState<Language | null>(null);
  const language: Language = languageOverride ?? storedLanguage;

  const setLanguage = (lang: Language) => {
    setLanguageOverride(lang);
    localStorage.setItem('language', lang);
    window.dispatchEvent(new StorageEvent('storage', { key: 'language', newValue: lang }));
  };

  const t = (path: string): string => {
    const keys = path.split('.');
    let current: unknown = dictionaries[language as keyof typeof dictionaries];
    
    for (const key of keys) {
      if (typeof current === 'object' && current !== null && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return path; // Fallback to path if not found
      }
    }
    
    return typeof current === 'string' ? current : path;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    dict: dictionaries[language as keyof typeof dictionaries]
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
