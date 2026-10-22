/**
 * Per-locale dynamic loader.
 *
 * `en` is imported statically so it is always available in the initial bundle
 * and ready for SSR without any async waterfall.
 *
 * All other locales are loaded on demand via dynamic `import()` so webpack /
 * Next.js can split them into separate chunks that are only downloaded when
 * the user switches to that language.
 */
import type { Language, TranslationKeys } from '../types';
import en from './en';

/** The English locale is always available synchronously (SSR-safe). */
export { en };

/**
 * Dynamically loads the translation bundle for the requested locale.
 * Returns the cached `en` bundle immediately if `language` is `'en'`.
 * The returned promise resolves once the locale chunk has been fetched
 * and parsed by the browser.
 */
export async function loadLocale(language: Language): Promise<TranslationKeys> {
  switch (language) {
    case 'en':
      return en;
    case 'es':
      return (await import(/* webpackChunkName: "locale-es" */ './es')).default;
    case 'fr':
      return (await import(/* webpackChunkName: "locale-fr" */ './fr')).default;
    case 'zh':
      return (await import(/* webpackChunkName: "locale-zh" */ './zh')).default;
    case 'ar':
      return (await import(/* webpackChunkName: "locale-ar" */ './ar')).default;
    case 'pt':
      return (await import(/* webpackChunkName: "locale-pt" */ './pt')).default;
    case 'sw':
      return (await import(/* webpackChunkName: "locale-sw" */ './sw')).default;
    default: {
      // Exhaustive check — TypeScript will error if a new Language is added
      // without updating this switch.
      const _exhaustive: never = language;
      void _exhaustive;
      return en;
    }
  }
}
