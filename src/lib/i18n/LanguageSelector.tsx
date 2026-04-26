'use client';

import React from 'react';
import { useI18n } from './provider';
import { Language } from './types';

export function LanguageSelector() {
  const { language, setLanguage, isRTL } = useI18n();
  const languages: Language[] = ['en', 'es', 'fr', 'zh', 'ar'];

  return (
    <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
      {languages.map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            language === lang
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
          aria-label={`Switch to ${lang}`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
