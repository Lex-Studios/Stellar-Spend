/**
 * Test isolation utilities
 * Ensures tests don't interfere with each other
 */

import type { Page } from '@playwright/test';

/**
 * Clear all browser storage (localStorage, sessionStorage, IndexedDB, cookies)
 */
export async function clearAllStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
  });

  // Clear IndexedDB
  await page.evaluate(async () => {
    const databases = await indexedDB.databases();
    databases.forEach((db) => {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
      }
    });
  }).catch(() => {
    // IndexedDB might not be available or might fail, that's okay
  });

  // Clear cookies via context
  await page.context().clearCookies();
}

/**
 * Reset page state to initial conditions
 */
export async function resetPageState(page: Page): Promise<void> {
  await clearAllStorage(page);
  
  // Clear any service worker registrations
  await page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(reg => reg.unregister()));
  }).catch(() => {
    // Service workers might not be available
  });
}

/**
 * Isolate test execution (use in beforeEach/afterEach)
 */
export async function isolateTest(page: Page, phase: 'before' | 'after'): Promise<void> {
  if (phase === 'before') {
    await resetPageState(page);
  } else if (phase === 'after') {
    await clearAllStorage(page);
  }
}

/**
 * Create isolated test context with clean state
 */
export async function createIsolatedContext(page: Page): Promise<void> {
  await resetPageState(page);
  
  // Set test mode flag
  await page.addInitScript(() => {
    (window as any).__TEST_MODE__ = true;
    (window as any).__TEST_START_TIME__ = Date.now();
  });
}

/**
 * Seed test data into storage
 */
export async function seedTestData(
  page: Page,
  data: Record<string, any>
): Promise<void> {
  await page.evaluate((testData) => {
    Object.entries(testData).forEach(([key, value]) => {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    });
  }, data);
}

/**
 * Verify test isolation (check that storage is clean)
 */
export async function verifyIsolation(page: Page): Promise<boolean> {
  const storageData = await page.evaluate(() => ({
    localStorageKeys: Object.keys(localStorage),
    sessionStorageKeys: Object.keys(sessionStorage),
    cookieCount: document.cookie.split(';').filter(c => c.trim()).length,
  }));

  // Should have no storage or only expected test-related keys
  const expectedKeys = ['__TEST_MODE__', 'wallet_connection', 'stellar_network'];
  const unexpectedKeys = storageData.localStorageKeys.filter(
    key => !expectedKeys.includes(key)
  );

  return unexpectedKeys.length === 0;
}
