/**
 * @deprecated
 * This file exists only for backward-compatibility.
 * Import individual locales from `./locales/<lang>` or use the
 * async `loadLocale(language)` from `./locales` instead.
 *
 * All named locale exports are still re-exported here so that
 * any existing direct imports continue to compile without change.
 * The i18n system itself no longer imports this file.
 */
export { default as en } from './locales/en';
export { default as es } from './locales/es';
export { default as fr } from './locales/fr';
export { default as zh } from './locales/zh';
export { default as ar } from './locales/ar';
export { default as pt } from './locales/pt';
export { default as sw } from './locales/sw';
