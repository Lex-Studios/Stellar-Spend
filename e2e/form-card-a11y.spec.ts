import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// The form card is rendered on the dashboard. Serious and critical axe violations fail the test.
test.describe('form card accessibility', () => {
  test('has no serious or critical axe violations', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('form').first()).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );

    expect(blocking.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
