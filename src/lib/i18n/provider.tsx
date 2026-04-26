'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Language } from './types';
import { I18n } from './i18n';

interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children, defaultLanguage = 'en' }: { children: React.ReactNode; defaultLanguage?: Language }) {
  const [i18nInstance] = useState(() => new I18n(defaultLanguage));
  const [language, setLanguageState] = useState<Language>(defaultLanguage);

  const setLanguage = useCallback((lang: Language) => {
    i18nInstance.setLanguage(lang);
    setLanguageState(lang);
  }, [i18nInstance]);

  const value: I18nContextType = {
    language,
    setLanguage,
    t: (key: string) => i18nInstance.t(key),
    isRTL: i18nInstance.isRTL(),
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
