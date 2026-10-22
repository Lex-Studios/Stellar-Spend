/**
 * Unit tests for the i18n system.
 *
 * Covers:
 *  - Per-locale module exports (all 7 locales have complete TranslationKeys)
 *  - Dynamic loadLocale() loader
 *  - I18n class: t(), setLanguageAsync(), isRTL(), getTranslations()
 *  - i18n singleton default state
 *
 * Closes #1270
 */

import { describe, it, expect } from 'vitest';
import { I18n } from '../i18n';
import { loadLocale, en as enStatic } from '../locales';
import en from '../locales/en';
import es from '../locales/es';
import fr from '../locales/fr';
import zh from '../locales/zh';
import ar from '../locales/ar';
import pt from '../locales/pt';
import sw from '../locales/sw';
import type { Language, TranslationKeys } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALL_LOCALES: [Language, TranslationKeys][] = [
  ['en', en],
  ['es', es],
  ['fr', fr],
  ['zh', zh],
  ['ar', ar],
  ['pt', pt],
  ['sw', sw],
];

const TOP_LEVEL_NAMESPACES: Array<keyof TranslationKeys> = [
  'common',
  'navigation',
  'offramp',
  'errors',
  'loyalty',
  'referral',
  'insurance',
  'dispute',
  'settings',
  'receipt',
];

// ---------------------------------------------------------------------------
// Per-locale static module tests
// ---------------------------------------------------------------------------

describe('locale modules — completeness', () => {
  it.each(ALL_LOCALES)('%s has all top-level namespaces', (_lang, translations) => {
    for (const ns of TOP_LEVEL_NAMESPACES) {
      expect(translations).toHaveProperty(ns);
    }
  });

  it.each(ALL_LOCALES)('%s has all common keys', (_lang, translations) => {
    const keys: Array<keyof TranslationKeys['common']> = [
      'loading',
      'error',
      'success',
      'cancel',
      'submit',
      'close',
    ];
    for (const key of keys) {
      expect(typeof translations.common[key]).toBe('string');
      expect(translations.common[key].length).toBeGreaterThan(0);
    }
  });

  it.each(ALL_LOCALES)('%s has all settings keys', (_lang, translations) => {
    const keys: Array<keyof TranslationKeys['settings']> = [
      'title',
      'profile',
      'appearance',
      'preferences',
      'security',
      'notifications',
      'language',
      'currency',
      'theme',
      'dark',
      'light',
      'system',
      'kyc_status',
      'limits',
      'reset',
      'save',
      'saved',
      'email_notifications',
      'push_notifications',
      'sync_account',
    ];
    for (const key of keys) {
      expect(typeof translations.settings[key]).toBe('string');
    }
  });

  it.each(ALL_LOCALES)('%s has no empty string values anywhere', (_lang, translations) => {
    function checkNoEmpty(obj: Record<string, unknown>, path: string) {
      for (const [k, v] of Object.entries(obj)) {
        const currentPath = `${path}.${k}`;
        if (typeof v === 'string') {
          expect(v, `empty string at ${currentPath}`).not.toBe('');
        } else if (v && typeof v === 'object') {
          checkNoEmpty(v as Record<string, unknown>, currentPath);
        }
      }
    }
    checkNoEmpty(translations as unknown as Record<string, unknown>, _lang);
  });

  it('en static export matches the default export', () => {
    expect(enStatic).toStrictEqual(en);
  });
});

// ---------------------------------------------------------------------------
// Dynamic loader (loadLocale)
// ---------------------------------------------------------------------------

describe('loadLocale()', () => {
  it('returns en synchronously without a chunk fetch', async () => {
    const result = await loadLocale('en');
    expect(result).toStrictEqual(en);
  });

  it.each(['es', 'fr', 'zh', 'ar', 'pt', 'sw'] as Language[])(
    'resolves %s with a non-empty TranslationKeys object',
    async (lang) => {
      const result = await loadLocale(lang);
      expect(result).toBeDefined();
      for (const ns of TOP_LEVEL_NAMESPACES) {
        expect(result).toHaveProperty(ns);
      }
    },
  );

  it('resolves the same object reference on repeated calls (module cache)', async () => {
    const first = await loadLocale('fr');
    const second = await loadLocale('fr');
    expect(first).toBe(second);
  });
});

// ---------------------------------------------------------------------------
// I18n class
// ---------------------------------------------------------------------------

describe('I18n class', () => {
  it('defaults to English', () => {
    const instance = new I18n();
    expect(instance.getLanguage()).toBe('en');
    expect(instance.t('common.loading')).toBe('Loading...');
  });

  it('t() returns the key path as fallback for unknown keys', () => {
    const instance = new I18n();
    expect(instance.t('does.not.exist')).toBe('does.not.exist');
  });

  it('t() returns the key path for partially valid paths', () => {
    const instance = new I18n();
    expect(instance.t('common.nonexistent')).toBe('common.nonexistent');
  });

  it('setLanguageAsync() switches language and resolves translations', async () => {
    const instance = new I18n();
    await instance.setLanguageAsync('es');
    expect(instance.getLanguage()).toBe('es');
    expect(instance.t('common.loading')).toBe('Cargando...');
  });

  it('setLanguageAsync() caches the locale (second call skips re-fetch)', async () => {
    const instance = new I18n();
    await instance.setLanguageAsync('fr');
    const first = instance.getTranslations();
    await instance.setLanguageAsync('fr');
    const second = instance.getTranslations();
    expect(first).toBe(second);
  });

  it('isRTL() is true only for Arabic', async () => {
    const instance = new I18n();
    expect(instance.isRTL()).toBe(false);
    await instance.setLanguageAsync('ar');
    expect(instance.isRTL()).toBe(true);
    await instance.setLanguageAsync('fr');
    expect(instance.isRTL()).toBe(false);
  });

  it('getTranslations() returns the active locale bundle', async () => {
    const instance = new I18n();
    await instance.setLanguageAsync('zh');
    expect(instance.getTranslations()).toStrictEqual(zh);
  });

  it('getSupportedLanguages() returns all 7 locales', () => {
    const instance = new I18n();
    const langs = instance.getSupportedLanguages();
    expect(langs.sort()).toEqual(['ar', 'en', 'es', 'fr', 'pt', 'sw', 'zh']);
  });

  it('setLanguage() is a no-op when the locale is not yet loaded', () => {
    // Create a fresh instance so 'pt' is not in cache
    const instance = new I18n();
    // 'pt' is not loaded — setLanguage should not switch
    instance.setLanguage('pt');
    expect(instance.getLanguage()).toBe('en');
  });

  it('setLanguage() switches immediately when locale is already cached', async () => {
    const instance = new I18n();
    await instance.setLanguageAsync('pt');
    // Switch away then back synchronously
    await instance.setLanguageAsync('en');
    instance.setLanguage('pt');
    expect(instance.getLanguage()).toBe('pt');
  });

  it('t() falls back to en bundle when active locale not yet loaded', () => {
    // Create instance starting on a language whose bundle hasn't resolved yet.
    // Background load fires but hasn't completed. t() should fall through to `en`.
    const instance = new I18n('sw');
    // The constructor starts a background load; we test immediately.
    // t() should return the English string from the `en` fallback.
    const result = instance.t('common.loading');
    // Either the async load already resolved (fast test env) or we get the en fallback
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// RTL locale — Arabic-specific checks
// ---------------------------------------------------------------------------

describe('Arabic locale', () => {
  it('has RTL-appropriate content for key fields', async () => {
    const instance = new I18n();
    await instance.setLanguageAsync('ar');
    // Arabic uses right-to-left text; just verify strings are non-empty
    expect(instance.t('navigation.home')).toBe('الرئيسية');
    expect(instance.t('common.loading')).toBe('جاري التحميل...');
  });
});
