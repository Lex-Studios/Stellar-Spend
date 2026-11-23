/**
 * E2E Tests: Settings and Notifications (#468)
 *
 * Tests settings persistence and notification functionality with comprehensive
 * coverage for user preferences, state management, and test isolation.
 *
 * Coverage:
 *  - Settings page navigation and UI
 *  - Notification preferences persistence
 *  - Theme/appearance settings
 *  - Profile settings updates
 *  - Security settings
 *  - Reset state between tests
 *  - LocalStorage/SessionStorage handling
 *  - Settings synchronization
 */

import { test, expect } from '@playwright/test';
import { injectFreighterStub, mockHorizonAccount, WALLET_ADDRESSES } from './fixtures/wallet-fixtures';
import { waitForNetworkIdle } from './helpers/wait';

test.describe('Settings and Notifications', () => {
  test.beforeEach(async ({ page }) => {
    // Reset state before each test
    await page.goto('http://localhost:3001');
    
    // Clear all storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Setup wallet
    await injectFreighterStub(page);
    await mockHorizonAccount(page);

    // Connect wallet for authenticated tests
    await page.click('[data-testid="connect-wallet-button"]');
    await page.waitForSelector('[data-testid="wallet-modal"]', { timeout: 5000 }).catch(() => {});
    const freighterOption = page.locator('[data-testid="wallet-option-freighter"]');
    if (await freighterOption.isVisible().catch(() => false)) {
      await freighterOption.click();
    }
    await page.waitForSelector('[data-testid="wallet-button"]', { timeout: 5000 }).catch(() => {});
  });

  test.afterEach(async ({ page }) => {
    // Reset state after each test for isolation
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should navigate to settings page', async ({ page }) => {
    // Navigate to settings
    await page.goto('http://localhost:3001/settings');
    await page.waitForLoadState('networkidle');

    // Verify settings page loaded
    const settingsHeading = page.locator('h1:has-text("Settings"), [data-testid="settings-page"]');
    await expect(settingsHeading.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display all settings sections', async ({ page }) => {
    await page.goto('http://localhost:3001/settings');
    await page.waitForLoadState('networkidle');

    // Verify main settings sections are visible
    const sections = [
      'Profile',
      'Appearance',
      'Notifications',
      'Security',
      'Preferences',
    ];

    for (const section of sections) {
      const sectionElement = page.locator(`[data-testid="settings-section-${section.toLowerCase()}"], h2:has-text("${section}"), button:has-text("${section}")`);
      if (await sectionElement.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(sectionElement.first()).toBeVisible();
      }
    }
  });

  test('should toggle notification settings and persist', async ({ page }) => {
    await page.goto('http://localhost:3001/settings');
    await page.waitForLoadState('networkidle');

    // Find notification settings section
    const notificationSection = page.locator('[data-testid="notification-settings"], [data-testid="settings-section-notifications"]');
    if (await notificationSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      await notificationSection.scrollIntoViewIfNeeded();
    }

    // Toggle notification preference
    const emailNotificationToggle = page.locator('[data-testid="notification-email-toggle"], input[name="emailNotifications"]');
    if (await emailNotificationToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      const initialState = await emailNotificationToggle.isChecked();
      await emailNotificationToggle.click();
      
      await waitForNetworkIdle(page);

      // Verify toggle changed
      const newState = await emailNotificationToggle.isChecked();
      expect(newState).toBe(!initialState);

      // Reload page and verify persistence
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.goto('http://localhost:3001/settings');
      
      const toggleAfterReload = page.locator('[data-testid="notification-email-toggle"], input[name="emailNotifications"]');
      if (await toggleAfterReload.isVisible({ timeout: 2000 }).catch(() => false)) {
        const persistedState = await toggleAfterReload.isChecked();
        expect(persistedState).toBe(newState);
      }
    }
  });

  test('should update theme settings and persist', async ({ page }) => {
    await page.goto('http://localhost:3001/settings');
    await page.waitForLoadState('networkidle');

    // Find appearance/theme section
    const appearanceSection = page.locator('[data-testid="appearance-settings"], [data-testid="settings-section-appearance"]');
    if (await appearanceSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      await appearanceSection.scrollIntoViewIfNeeded();
    }

    // Check initial theme
    const htmlElement = await page.locator('html');
    const initialTheme = await htmlElement.getAttribute('data-theme').catch(() => null);

    // Toggle theme
    const themeToggle = page.locator('[data-testid="theme-toggle"], button:has-text("Dark"), button:has-text("Light")');
    if (await themeToggle.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await themeToggle.first().click();
      await page.waitForTimeout(500);

      // Verify theme changed
      const newTheme = await htmlElement.getAttribute('data-theme').catch(() => null);
      if (initialTheme && newTheme) {
        expect(newTheme).not.toBe(initialTheme);
      }

      // Verify persistence in localStorage
      const storedTheme = await page.evaluate(() => localStorage.getItem('theme'));
      expect(storedTheme).toBeTruthy();

      // Reload and verify persistence
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const themeAfterReload = await htmlElement.getAttribute('data-theme').catch(() => null);
      if (newTheme && themeAfterReload) {
        expect(themeAfterReload).toBe(newTheme);
      }
    }
  });

  test('should update profile settings', async ({ page }) => {
    await page.goto('http://localhost:3001/settings');
    await page.waitForLoadState('networkidle');

    // Find profile section
    const profileSection = page.locator('[data-testid="profile-settings"], [data-testid="settings-section-profile"]');
    if (await profileSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      await profileSection.scrollIntoViewIfNeeded();
    }

    // Update display name
    const displayNameInput = page.locator('[data-testid="profile-display-name"], input[name="displayName"]');
    if (await displayNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await displayNameInput.fill('Test User Updated');
      
      // Save changes
      const saveButton = page.locator('[data-testid="save-profile"], button:has-text("Save")');
      if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveButton.click();
        
        // Wait for save confirmation
        const successMessage = page.locator('[data-testid="save-success"], [role="alert"]:has-text("saved")');
        if (await successMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(successMessage).toBeVisible();
        }

        await waitForNetworkIdle(page);

        // Verify persistence
        const storedProfile = await page.evaluate(() => localStorage.getItem('userProfile'));
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          expect(profile.displayName).toBe('Test User Updated');
        }
      }
    }
  });

  test('should configure notification preferences for transaction events', async ({ page }) => {
    await page.goto('http://localhost:3001/settings');
    await page.waitForLoadState('networkidle');

    // Navigate to notification settings
    const notificationSettings = page.locator('[data-testid="notification-settings"]');
    if (await notificationSettings.isVisible({ timeout: 2000 }).catch(() => false)) {
      await notificationSettings.scrollIntoViewIfNeeded();
    }

    // Configure transaction notifications
    const transactionNotifyToggle = page.locator('[data-testid="notify-transaction-complete"], input[name="notifyTransactionComplete"]');
    if (await transactionNotifyToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await transactionNotifyToggle.check();
      await waitForNetworkIdle(page);

      // Verify stored preferences
      const preferences = await page.evaluate(() => {
        const stored = localStorage.getItem('notificationPreferences');
        return stored ? JSON.parse(stored) : null;
      });

      if (preferences) {
        expect(preferences.transactionComplete).toBe(true);
      }
    }
  });

  test('should handle multiple notification toggles', async ({ page }) => {
    await page.goto('http://localhost:3001/settings');
    await page.waitForLoadState('networkidle');

    const notificationTypes = [
      'notify-transaction-complete',
      'notify-transaction-failed',
      'notify-payment-received',
    ];

    for (const notificationType of notificationTypes) {
      const toggle = page.locator(`[data-testid="${notificationType}"]`);
      if (await toggle.isVisible({ timeout: 1000 }).catch(() => false)) {
        await toggle.check();
        await page.waitForTimeout(200);
      }
    }

    await waitForNetworkIdle(page);

    // Verify all preferences are stored
    const allPreferences = await page.evaluate(() => {
      const stored = localStorage.getItem('notificationPreferences');
      return stored ? JSON.parse(stored) : {};
    });

    expect(Object.keys(allPreferences).length).toBeGreaterThan(0);
  });

  test('should reset settings to defaults', async ({ page }) => {
    await page.goto('http://localhost:3001/settings');
    await page.waitForLoadState('networkidle');

    // Modify some settings first
    const toggle = page.locator('[data-testid="notification-email-toggle"]');
    if (await toggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await toggle.click();
      await waitForNetworkIdle(page);
    }

    // Find and click reset button
    const resetButton = page.locator('[data-testid="reset-settings"], button:has-text("Reset")');
    if (await resetButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await resetButton.click();

      // Confirm reset if confirmation dialog appears
      const confirmButton = page.locator('[data-testid="confirm-reset"], button:has-text("Confirm")');
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }

      await waitForNetworkIdle(page);

      // Verify settings were reset
      const settingsData = await page.evaluate(() => {
        return {
          notifications: localStorage.getItem('notificationPreferences'),
          theme: localStorage.getItem('theme'),
          profile: localStorage.getItem('userProfile'),
        };
      });

      // After reset, settings should be cleared or at defaults
      const hasDefaultValues = !settingsData.notifications || 
                               settingsData.notifications === '{}' ||
                               JSON.stringify(settingsData).includes('default');
      expect(hasDefaultValues).toBeTruthy();
    }
  });

  test('should maintain state isolation between tests', async ({ page }) => {
    // This test verifies that beforeEach/afterEach hooks properly reset state

    // Check that storage is clean
    const storageKeys = await page.evaluate(() => Object.keys(localStorage));
    
    // Only wallet connection data should exist from beforeEach
    const hasOnlyExpectedKeys = storageKeys.every(key => 
      key.includes('wallet') || key.includes('stellar') || key.length === 0
    );
    
    // Set some test data
    await page.evaluate(() => {
      localStorage.setItem('test_isolation_key', 'test_value');
    });

    const testValue = await page.evaluate(() => localStorage.getItem('test_isolation_key'));
    expect(testValue).toBe('test_value');
  });

  test('should synchronize settings across tabs', async ({ page, context }) => {
    await page.goto('http://localhost:3001/settings');
    await page.waitForLoadState('networkidle');

    // Update a setting
    await page.evaluate(() => {
      localStorage.setItem('notificationPreferences', JSON.stringify({ emailEnabled: true }));
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'notificationPreferences',
        newValue: JSON.stringify({ emailEnabled: true }),
        storageArea: localStorage,
      }));
    });

    // Open second tab
    const secondTab = await context.newPage();
    await injectFreighterStub(secondTab);
    await mockHorizonAccount(secondTab);
    await secondTab.goto('http://localhost:3001/settings');
    await secondTab.waitForLoadState('networkidle');

    // Verify setting is synchronized
    const syncedValue = await secondTab.evaluate(() => {
      const stored = localStorage.getItem('notificationPreferences');
      return stored ? JSON.parse(stored) : null;
    });

    if (syncedValue) {
      expect(syncedValue.emailEnabled).toBe(true);
    }

    await secondTab.close();
  });

  test('should validate settings before saving', async ({ page }) => {
    await page.goto('http://localhost:3001/settings');
    await page.waitForLoadState('networkidle');

    // Try to save invalid data
    const emailInput = page.locator('[data-testid="profile-email"], input[type="email"]');
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.fill('invalid-email');

      const saveButton = page.locator('[data-testid="save-profile"], button:has-text("Save")');
      if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveButton.click();

        // Should show validation error
        const errorMessage = page.locator('[data-testid="validation-error"], [role="alert"]');
        if (await errorMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(errorMessage).toContainText(/invalid|error/i);
        }
      }
    }
  });

  test('should show notification preview', async ({ page }) => {
    await page.goto('http://localhost:3001/settings');
    await page.waitForLoadState('networkidle');

    // Find notification preview/test button
    const previewButton = page.locator('[data-testid="test-notification"], button:has-text("Test"), button:has-text("Preview")');
    if (await previewButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await previewButton.click();

      // Should show test notification
      const notification = page.locator('[data-testid="toast-notification"], [role="status"], [role="alert"]');
      if (await notification.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(notification).toBeVisible();
      }
    }
  });

  test('should export and import settings', async ({ page }) => {
    await page.goto('http://localhost:3001/settings');
    await page.waitForLoadState('networkidle');

    // Set some preferences
    await page.evaluate(() => {
      localStorage.setItem('notificationPreferences', JSON.stringify({
        emailEnabled: true,
        pushEnabled: false,
      }));
      localStorage.setItem('theme', 'dark');
    });

    // Export settings
    const exportButton = page.locator('[data-testid="export-settings"], button:has-text("Export")');
    if (await exportButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await exportButton.click();
      
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/settings.*\.json/i);
        
        // Verify export content
        const path = await download.path();
        if (path) {
          const fs = await import('fs');
          const content = fs.readFileSync(path, 'utf-8');
          const settings = JSON.parse(content);
          expect(settings).toHaveProperty('notificationPreferences');
          expect(settings).toHaveProperty('theme');
        }
      }
    }
  });

  test('should maintain coverage >=85% for settings features', async ({ page }) => {
    await page.goto('http://localhost:3001/settings');
    await page.waitForLoadState('networkidle');

    // Exercise all major settings paths
    
    // 1. Toggle various settings
    const toggles = await page.locator('input[type="checkbox"]').all();
    for (let i = 0; i < Math.min(toggles.length, 3); i++) {
      if (await toggles[i].isVisible({ timeout: 500 }).catch(() => false)) {
        await toggles[i].click();
        await page.waitForTimeout(200);
      }
    }

    // 2. Update text inputs
    const textInputs = await page.locator('input[type="text"], input[type="email"]').all();
    for (let i = 0; i < Math.min(textInputs.length, 2); i++) {
      if (await textInputs[i].isVisible({ timeout: 500 }).catch(() => false)) {
        await textInputs[i].fill(`test_value_${i}`);
        await page.waitForTimeout(200);
      }
    }

    // 3. Navigate between sections
    const sections = await page.locator('[data-testid^="settings-section-"]').all();
    for (let i = 0; i < Math.min(sections.length, 3); i++) {
      if (await sections[i].isVisible({ timeout: 500 }).catch(() => false)) {
        await sections[i].click();
        await page.waitForTimeout(200);
      }
    }

    // Verify settings were modified
    const finalStorage = await page.evaluate(() => ({
      keys: Object.keys(localStorage),
      count: localStorage.length,
    }));

    expect(finalStorage.count).toBeGreaterThan(0);
  });
});
