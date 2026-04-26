import { Language, TranslationKeys } from './types';
import { en, es, fr, zh, ar } from './translations';

const translations: Record<Language, TranslationKeys> = {
  en,
  es,
  fr,
  zh,
  ar,
};

export class I18n {
  private currentLanguage: Language = 'en';

  constructor(language?: Language) {
    if (language && language in translations) {
      this.currentLanguage = language;
    }
  }

  setLanguage(language: Language): void {
    if (language in translations) {
      this.currentLanguage = language;
    }
  }

  getLanguage(): Language {
    return this.currentLanguage;
  }

  t(key: string): string {
    const keys = key.split('.');
    let value: any = translations[this.currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  }

  getTranslations(): TranslationKeys {
    return translations[this.currentLanguage];
  }

  getSupportedLanguages(): Language[] {
    return Object.keys(translations) as Language[];
  }

  isRTL(): boolean {
    return this.currentLanguage === 'ar';
  }
}

export const i18n = new I18n('en');
