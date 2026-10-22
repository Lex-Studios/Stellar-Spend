import { Language, TranslationKeys } from './types';
import { en, loadLocale } from './locales';

const RTL_LANGUAGES: Language[] = ['ar'];

export class I18n {
  private currentLanguage: Language = 'en';
  /** Cache of already-loaded locale bundles. `en` is pre-populated. */
  private loadedLocales: Partial<Record<Language, TranslationKeys>> = { en };

  constructor(language?: Language) {
    if (language && language !== 'en') {
      // Non-English initial language: start with `en` synchronously so the
      // instance is never empty, then eagerly kick off a background load.
      // Callers that need to wait should use `setLanguageAsync` instead.
      this.currentLanguage = language;
      void loadLocale(language).then((t) => {
        this.loadedLocales[language] = t;
      });
    }
  }

  /**
   * Switch the active locale synchronously.
   * If the locale bundle hasn't been loaded yet the previous translations
   * remain active until `setLanguageAsync` resolves — use that in the provider.
   */
  setLanguage(language: Language): void {
    if (this.loadedLocales[language]) {
      this.currentLanguage = language;
    }
  }

  /**
   * Switch the active locale and wait for the bundle to be ready.
   * Safe to call from React effects or event handlers.
   */
  async setLanguageAsync(language: Language): Promise<void> {
    if (!this.loadedLocales[language]) {
      this.loadedLocales[language] = await loadLocale(language);
    }
    this.currentLanguage = language;
  }

  getLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * Look up a dot-separated translation key such as `"common.loading"`.
   * Falls back to the raw key string when the path cannot be resolved.
   */
  t(key: string): string {
    const translations = this.loadedLocales[this.currentLanguage] ?? en;
    const keys = key.split('.');
    let value: unknown = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && !Array.isArray(value) && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  }

  getTranslations(): TranslationKeys {
    return this.loadedLocales[this.currentLanguage] ?? en;
  }

  getSupportedLanguages(): Language[] {
    const all: Language[] = ['en', 'es', 'fr', 'zh', 'ar', 'pt', 'sw'];
    return all;
  }

  isRTL(): boolean {
    return RTL_LANGUAGES.includes(this.currentLanguage);
  }
}

const i18n = new I18n('en');
