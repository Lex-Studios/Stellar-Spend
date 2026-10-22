/**
 * Shared helpers for E2E test isolation and web-first assertion utilities.
 *
 * Issue #1340 — Stabilize Playwright E2E suite:
 *  - Storage state is isolated per test via `test.use({ storageState: undefined })`
 *    applied at each describe block (callers import `isolatedTest`).
 *  - `waitForTimeout` is replaced with the helpers below, which assert on
 *    observable DOM state rather than sleeping for a fixed duration.
 */

import { test as base, expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Storage-isolated test fixture
// ---------------------------------------------------------------------------

/**
 * A `test` fixture that clears browser storage before every test, preventing
 * state leakage across tests that share the same browser context.
 *
 * Usage:
 *   import { isolatedTest as test } from './fixtures/test-isolation';
 *
 *   test('my test', async ({ page }) => { ... });
 */
export const isolatedTest = base.extend({
  page: async ({ page }, use) => {
    // Clear all storage before each test so tests never share wallet sessions,
    // transaction history, or any other persisted state.
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await use(page);
  },
});

export { expect };

// ---------------------------------------------------------------------------
// Web-first wait helpers (replacements for waitForTimeout)
// ---------------------------------------------------------------------------

/**
 * Wait until a button with the given accessible name is either visible or
 * hidden. Replaces bare `waitForTimeout` calls that follow a click.
 */
export async function waitForButtonState(
  page: Page,
  name: RegExp | string,
  state: 'visible' | 'hidden',
  timeoutMs = 5_000,
): Promise<void> {
  const locator = page.getByRole('button', { name });
  if (state === 'visible') {
    await expect(locator.first()).toBeVisible({ timeout: timeoutMs });
  } else {
    await expect(locator.first()).toBeHidden({ timeout: timeoutMs });
  }
}

/**
 * Wait until any element matching `locator` is visible.
 * Direct replacement for `await page.waitForTimeout(N)` after triggering an
 * async UI update.
 */
export async function waitForVisible(
  page: Page,
  selector: string,
  timeoutMs = 5_000,
): Promise<void> {
  await expect(page.locator(selector).first()).toBeVisible({ timeout: timeoutMs });
}

/**
 * Wait for the wallet-connected state: either the "Connect Wallet" button
 * disappears or an address / "Connected" label becomes visible.
 */
export async function waitForWalletConnected(page: Page, timeoutMs = 8_000): Promise<void> {
  // Web-first: at least one of these conditions resolves within the timeout.
  await expect(async () => {
    const connectBtnVisible = await page
      .getByRole('button', { name: /connect wallet/i })
      .isVisible()
      .catch(() => false);
    const addressVisible = await page
      .getByText(/GB[A-Z0-9]{2,}[\.\u2026][A-Z0-9]{2,}/i)
      .isVisible()
      .catch(() => false);
    const connectedVisible = await page
      .getByText(/connected/i)
      .isVisible()
      .catch(() => false);
    if (connectBtnVisible && !addressVisible && !connectedVisible) {
      throw new Error('Wallet not yet connected');
    }
  }).toPass({ timeout: timeoutMs });
}

/**
 * Wait for a network modal / dialog to appear.
 */
export async function waitForDialog(page: Page, timeoutMs = 5_000): Promise<void> {
  await expect(page.getByRole('dialog').first()).toBeVisible({ timeout: timeoutMs });
}
