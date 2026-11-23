/**
 * Wait utilities for E2E tests
 */

import type { Page } from '@playwright/test';

/**
 * Wait for network to be idle (no pending requests for specified duration)
 */
export async function waitForNetworkIdle(
  page: Page,
  options: { timeout?: number; idleTime?: number } = {}
): Promise<void> {
  const { timeout = 30000, idleTime = 500 } = options;

  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch (error) {
    // Fallback: wait for idle time
    await page.waitForTimeout(idleTime);
  }
}

/**
 * Wait for element to be stable (not animating)
 */
export async function waitForStable(
  page: Page,
  selector: string,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 5000 } = options;
  const element = page.locator(selector);
  
  try {
    await element.waitFor({ state: 'visible', timeout });
    
    // Wait for animations to complete
    await page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const style = window.getComputedStyle(el);
        return style.animationPlayState === 'paused' || style.animationName === 'none';
      },
      selector,
      { timeout: 2000 }
    ).catch(() => {});
    
    await page.waitForTimeout(100);
  } catch (error) {
    // Element might not exist, that's okay
  }
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 10000, interval = 100 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Wait for localStorage key to have a specific value
 */
export async function waitForLocalStorage(
  page: Page,
  key: string,
  expectedValue?: string,
  options: { timeout?: number } = {}
): Promise<string | null> {
  const { timeout = 5000 } = options;

  return page.waitForFunction(
    ({ key, expectedValue }) => {
      const value = localStorage.getItem(key);
      if (expectedValue !== undefined) {
        return value === expectedValue;
      }
      return value !== null;
    },
    { key, expectedValue },
    { timeout }
  ).then(() => page.evaluate((k) => localStorage.getItem(k), key));
}
