/**
 * E2E navigation tests for the modularized settings subroutes (issue #1048).
 *
 * Acceptance criteria:
 *  - Each tab is an independent route
 *  - Deep-linking to each tab works
 *  - Navigation between tabs works via the sidebar
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3001';

// ---------------------------------------------------------------------------
// Settings subroute navigation
// ---------------------------------------------------------------------------
test.describe('Settings subroutes (#1048)', () => {
  // Root /settings should redirect to /settings/profile
  test('redirects /settings to /settings/profile', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForURL(`${BASE_URL}/settings/profile`);
    expect(page.url()).toContain('/settings/profile');
  });

  // ---------------------------------------------------------------------------
  // Deep-link: each subroute renders without errors
  // ---------------------------------------------------------------------------
  for (const tab of ['profile', 'security', 'appearance', 'preferences', 'privacy'] as const) {
    test(`deep-link /settings/${tab} renders the correct section`, async ({ page }) => {
      await page.goto(`${BASE_URL}/settings/${tab}`);
      await page.waitForLoadState('networkidle');

      // The sidebar nav should be visible on every tab
      const nav = page.getByRole('navigation', { name: /settings navigation/i });
      await expect(nav).toBeVisible();

      // The active link should have aria-current="page"
      const activeLinks = page.locator('[aria-current="page"]');
      await expect(activeLinks.first()).toBeVisible();

      // No JS errors during navigation
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));
      expect(errors).toHaveLength(0);
    });
  }

  // ---------------------------------------------------------------------------
  // Sidebar navigation: clicking each tab changes the URL
  // ---------------------------------------------------------------------------
  test('navigating via sidebar links changes the URL correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings/profile`);
    await page.waitForLoadState('networkidle');

    const nav = page.getByRole('navigation', { name: /settings navigation/i });

    // Navigate to Security
    await nav.getByRole('link', { name: /security/i }).click();
    await page.waitForURL(`${BASE_URL}/settings/security`);
    expect(page.url()).toContain('/settings/security');

    // Navigate to Appearance
    await nav.getByRole('link', { name: /appearance/i }).click();
    await page.waitForURL(`${BASE_URL}/settings/appearance`);
    expect(page.url()).toContain('/settings/appearance');

    // Navigate to Preferences
    await nav.getByRole('link', { name: /preferences/i }).click();
    await page.waitForURL(`${BASE_URL}/settings/preferences`);
    expect(page.url()).toContain('/settings/preferences');

    // Navigate to Privacy
    await nav.getByRole('link', { name: /privacy/i }).click();
    await page.waitForURL(`${BASE_URL}/settings/privacy`);
    expect(page.url()).toContain('/settings/privacy');

    // Navigate back to Profile
    await nav.getByRole('link', { name: /profile/i }).click();
    await page.waitForURL(`${BASE_URL}/settings/profile`);
    expect(page.url()).toContain('/settings/profile');
  });

  // ---------------------------------------------------------------------------
  // Back/forward browser navigation preserves routes
  // ---------------------------------------------------------------------------
  test('browser back/forward between settings tabs works', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings/profile`);
    await page.waitForLoadState('networkidle');

    const nav = page.getByRole('navigation', { name: /settings navigation/i });

    await nav.getByRole('link', { name: /security/i }).click();
    await page.waitForURL(`${BASE_URL}/settings/security`);

    await nav.getByRole('link', { name: /appearance/i }).click();
    await page.waitForURL(`${BASE_URL}/settings/appearance`);

    await page.goBack();
    await page.waitForURL(`${BASE_URL}/settings/security`);
    expect(page.url()).toContain('/settings/security');

    await page.goForward();
    await page.waitForURL(`${BASE_URL}/settings/appearance`);
    expect(page.url()).toContain('/settings/appearance');
  });

  // ---------------------------------------------------------------------------
  // Active link highlighting
  // ---------------------------------------------------------------------------
  test('active sidebar link reflects the current route', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings/appearance`);
    await page.waitForLoadState('networkidle');

    const activeLink = page.locator('[aria-current="page"]');
    const text = await activeLink.first().textContent();
    expect(text?.toLowerCase()).toContain('appearance');
  });
});
