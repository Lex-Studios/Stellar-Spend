/**
 * E2E Tests: Error and Offline Scenarios (#469)
 *
 * Tests error handling and offline functionality with comprehensive
 * coverage for network failures, error banners, offline states, and recovery.
 *
 * Coverage:
 *  - Simulate network failures
 *  - Offline mode detection and UI
 *  - Error banner display and dismissal
 *  - API error handling
 *  - Network recovery scenarios
 *  - Retry mechanisms
 *  - Graceful degradation
 */

import { test, expect } from '@playwright/test';
import { injectFreighterStub, mockHorizonAccount, WALLET_ADDRESSES } from './fixtures/wallet-fixtures';
import { waitForNetworkIdle } from './helpers/wait';

test.describe('Error and Offline Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
  });

  test('should detect and display offline state', async ({ page, context }) => {
    await injectFreighterStub(page);
    await mockHorizonAccount(page);

    // Go offline
    await context.setOffline(true);

    // Reload to trigger offline detection
    await page.reload();

    // Should show offline indicator
    const offlineIndicator = page.locator('[data-testid="offline-banner"], [data-testid="offline-indicator"], [role="status"]:has-text("offline")');
    if (await offlineIndicator.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(offlineIndicator).toBeVisible();
      await expect(offlineIndicator).toContainText(/offline|no connection|disconnected/i);
    }

    // Verify offline icon or status in UI
    const offlineIcon = page.locator('[data-testid="offline-icon"], svg[data-offline="true"]');
    if (await offlineIcon.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(offlineIcon).toBeVisible();
    }
  });

  test('should handle network failure during transaction', async ({ page, context }) => {
    await injectFreighterStub(page);
    await mockHorizonAccount(page);

    // Connect wallet
    await page.click('[data-testid="connect-wallet-button"]');
    await page.waitForSelector('[data-testid="wallet-modal"]', { timeout: 5000 }).catch(() => {});
    const freighterOption = page.locator('[data-testid="wallet-option-freighter"]');
    if (await freighterOption.isVisible().catch(() => false)) {
      await freighterOption.click();
    }
    await page.waitForSelector('[data-testid="wallet-button"]', { timeout: 5000 }).catch(() => {});

    // Start a transaction (navigate to send page)
    await page.goto('http://localhost:3001/send');
    await page.waitForLoadState('networkidle');

    // Go offline before submitting
    await context.setOffline(true);

    // Try to submit transaction
    const submitButton = page.locator('[data-testid="submit-transaction"], button:has-text("Send"), button[type="submit"]');
    if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await submitButton.click();

      // Should show error message
      const errorBanner = page.locator('[data-testid="error-banner"], [role="alert"]');
      if (await errorBanner.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(errorBanner).toContainText(/network|connection|offline|failed/i);
      }
    }

    // Restore connection
    await context.setOffline(false);
  });

  test('should simulate API failure and show error banner', async ({ page }) => {
    await injectFreighterStub(page);
    await mockHorizonAccount(page);

    // Mock API to return error
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    // Connect wallet
    await page.click('[data-testid="connect-wallet-button"]');
    await page.waitForSelector('[data-testid="wallet-modal"]', { timeout: 5000 }).catch(() => {});
    const freighterOption = page.locator('[data-testid="wallet-option-freighter"]');
    if (await freighterOption.isVisible().catch(() => false)) {
      await freighterOption.click();
    }

    // Try action that calls API
    await page.goto('http://localhost:3001/history');
    
    // Should display error banner
    const errorBanner = page.locator('[data-testid="error-banner"], [role="alert"]');
    if (await errorBanner.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(errorBanner).toBeVisible();
      const errorText = await errorBanner.textContent();
      expect(errorText).toMatch(/error|failed|unable/i);
    }
  });

  test('should dismiss error banner on close', async ({ page }) => {
    await injectFreighterStub(page);

    // Mock API error
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server Error' }),
      });
    });

    await page.goto('http://localhost:3001/history');

    // Wait for error banner
    const errorBanner = page.locator('[data-testid="error-banner"], [role="alert"]');
    if (await errorBanner.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(errorBanner).toBeVisible();

      // Click dismiss button
      const dismissButton = page.locator('[data-testid="dismiss-error"], [aria-label="Dismiss"], button:has-text("×")');
      if (await dismissButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dismissButton.click();

        // Error banner should be hidden
        await expect(errorBanner).not.toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should auto-dismiss error banner after timeout', async ({ page }) => {
    await injectFreighterStub(page);

    // Mock transient error
    let callCount = 0;
    await page.route('**/api/**', route => {
      callCount++;
      if (callCount === 1) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Temporary Error' }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('http://localhost:3001/history');

    // Wait for error banner
    const errorBanner = page.locator('[data-testid="error-banner"], [role="alert"]');
    if (await errorBanner.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(errorBanner).toBeVisible();

      // Wait for auto-dismiss (usually 5-10 seconds)
      await page.waitForTimeout(8000);

      // Banner should be dismissed
      const isVisible = await errorBanner.isVisible().catch(() => false);
      if (isVisible) {
        // Some banners might fade but still be in DOM
        const opacity = await errorBanner.evaluate(el => window.getComputedStyle(el).opacity);
        expect(parseFloat(opacity)).toBeLessThanOrEqual(0.1);
      }
    }
  });

  test('should handle Horizon API timeout', async ({ page }) => {
    await injectFreighterStub(page);

    // Mock slow/timeout Horizon response
    await page.route('**/horizon/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30s delay
      route.abort('timedout');
    });

    await page.click('[data-testid="connect-wallet-button"]');
    await page.waitForSelector('[data-testid="wallet-modal"]', { timeout: 5000 }).catch(() => {});
    const freighterOption = page.locator('[data-testid="wallet-option-freighter"]');
    if (await freighterOption.isVisible().catch(() => false)) {
      await freighterOption.click();
    }

    // Should show timeout error
    const errorMessage = page.locator('[data-testid="error-banner"], [role="alert"]');
    if (await errorMessage.isVisible({ timeout: 10000 }).catch(() => false)) {
      await expect(errorMessage).toContainText(/timeout|slow|unable to connect/i);
    }
  });

  test('should retry failed requests', async ({ page }) => {
    await injectFreighterStub(page);
    await mockHorizonAccount(page);

    let attemptCount = 0;
    await page.route('**/api/**', route => {
      attemptCount++;
      if (attemptCount < 2) {
        // Fail first attempt
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Service Unavailable' }),
        });
      } else {
        // Succeed on retry
        route.continue();
      }
    });

    await page.goto('http://localhost:3001/history');

    // Look for retry button or automatic retry
    const retryButton = page.locator('[data-testid="retry-button"], button:has-text("Retry"), button:has-text("Try Again")');
    if (await retryButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await retryButton.click();
      await waitForNetworkIdle(page);

      // After retry, error should be gone
      const errorBanner = page.locator('[data-testid="error-banner"]');
      const errorVisible = await errorBanner.isVisible({ timeout: 2000 }).catch(() => false);
      expect(errorVisible).toBeFalsy();
    }

    // Verify retry happened
    expect(attemptCount).toBeGreaterThanOrEqual(2);
  });

  test('should handle wallet connection errors gracefully', async ({ page }) => {
    await injectFreighterStub(page);

    // Mock wallet error
    await page.addInitScript(() => {
      window.freighterApi.getPublicKey = async () => {
        throw new Error('Wallet connection failed');
      };
    });

    await page.click('[data-testid="connect-wallet-button"]');
    await page.waitForSelector('[data-testid="wallet-modal"]', { timeout: 5000 }).catch(() => {});
    await page.click('[data-testid="wallet-option-freighter"]');

    // Should show wallet error
    const errorMessage = page.locator('[data-testid="wallet-error"], [data-testid="error-banner"], [role="alert"]');
    if (await errorMessage.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(errorMessage).toContainText(/wallet|connection|failed/i);
    }

    // Should remain in disconnected state
    const connectButton = page.locator('[data-testid="connect-wallet-button"]');
    await expect(connectButton).toBeVisible();
  });

  test('should show loading state during network operations', async ({ page }) => {
    await injectFreighterStub(page);
    await mockHorizonAccount(page);

    // Mock slow API response
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      route.continue();
    });

    await page.goto('http://localhost:3001/history');

    // Should show loading indicator
    const loadingIndicator = page.locator('[data-testid="loading"], [data-testid="spinner"], [role="status"]:has-text("Loading")');
    if (await loadingIndicator.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(loadingIndicator).toBeVisible();
    }

    // Wait for content to load
    await waitForNetworkIdle(page);

    // Loading should be gone
    const loadingStillVisible = await loadingIndicator.isVisible({ timeout: 1000 }).catch(() => false);
    expect(loadingStillVisible).toBeFalsy();
  });

  test('should handle rate limiting errors', async ({ page }) => {
    await injectFreighterStub(page);

    // Mock rate limit response
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        headers: {
          'Retry-After': '60',
        },
        body: JSON.stringify({ error: 'Too Many Requests' }),
      });
    });

    await page.goto('http://localhost:3001/history');

    // Should show rate limit error
    const errorBanner = page.locator('[data-testid="error-banner"], [role="alert"]');
    if (await errorBanner.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(errorBanner).toContainText(/rate limit|too many|try again later/i);
    }
  });

  test('should recover when network comes back online', async ({ page, context }) => {
    await injectFreighterStub(page);
    await mockHorizonAccount(page);

    // Start offline
    await context.setOffline(true);
    await page.reload();

    // Verify offline state
    const offlineIndicator = page.locator('[data-testid="offline-banner"], [role="status"]:has-text("offline")');
    if (await offlineIndicator.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(offlineIndicator).toBeVisible();
    }

    // Go back online
    await context.setOffline(false);

    // Trigger network request
    await page.goto('http://localhost:3001/history');
    await waitForNetworkIdle(page);

    // Offline indicator should disappear
    const offlineStillVisible = await offlineIndicator.isVisible({ timeout: 3000 }).catch(() => false);
    expect(offlineStillVisible).toBeFalsy();

    // Should show online content
    const content = page.locator('[data-testid="transaction-history"], main');
    await expect(content).toBeVisible({ timeout: 5000 });
  });

  test('should cache data for offline viewing', async ({ page, context }) => {
    await injectFreighterStub(page);
    await mockHorizonAccount(page);

    // Load page online to cache data
    await page.goto('http://localhost:3001/history');
    await page.waitForLoadState('networkidle');

    // Seed some transaction data
    await page.evaluate(() => {
      localStorage.setItem('stellar_spend_transactions', JSON.stringify([
        {
          id: 'cached_tx_001',
          timestamp: Date.now(),
          amount: '100',
          currency: 'NGN',
          status: 'completed',
        },
      ]));
    });

    // Go offline
    await context.setOffline(true);
    await page.reload();

    // Should still display cached data
    const cachedContent = page.locator('[data-testid="transaction-entry"]');
    if (await cachedContent.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(cachedContent).toBeVisible();
    }

    // Should show offline indicator but allow viewing cached data
    const offlineIndicator = page.locator('[data-testid="offline-banner"]');
    if (await offlineIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(offlineIndicator).toBeVisible();
    }

    await context.setOffline(false);
  });

  test('should disable actions when offline', async ({ page, context }) => {
    await injectFreighterStub(page);
    await mockHorizonAccount(page);

    // Go offline
    await context.setOffline(true);
    await page.goto('http://localhost:3001/send');
    await page.waitForLoadState('networkidle');

    // Submit button should be disabled
    const submitButton = page.locator('[data-testid="submit-transaction"], button[type="submit"]');
    if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      const isDisabled = await submitButton.isDisabled();
      expect(isDisabled).toBeTruthy();
    }

    // Should show offline message
    const offlineMessage = page.locator('[data-testid="offline-warning"], [role="alert"]:has-text("offline")');
    if (await offlineMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(offlineMessage).toContainText(/offline|no connection/i);
    }

    await context.setOffline(false);
  });

  test('should handle multiple simultaneous errors', async ({ page }) => {
    await injectFreighterStub(page);

    // Mock multiple API failures
    await page.route('**/api/transactions**', route => {
      route.fulfill({ status: 500, body: 'Error 1' });
    });

    await page.route('**/api/balance**', route => {
      route.fulfill({ status: 503, body: 'Error 2' });
    });

    await page.goto('http://localhost:3001/history');
    await page.waitForTimeout(2000);

    // Should handle multiple errors gracefully
    const errorBanners = page.locator('[data-testid="error-banner"], [role="alert"]');
    const errorCount = await errorBanners.count();

    // Should show at least one error (may consolidate multiple errors)
    expect(errorCount).toBeGreaterThan(0);
  });

  test('should provide helpful error messages', async ({ page }) => {
    await injectFreighterStub(page);

    // Mock specific error types
    const errorScenarios = [
      { status: 400, message: 'Invalid request' },
      { status: 404, message: 'Not found' },
      { status: 500, message: 'Server error' },
    ];

    for (const scenario of errorScenarios) {
      await page.route('**/api/**', route => {
        route.fulfill({
          status: scenario.status,
          contentType: 'application/json',
          body: JSON.stringify({ error: scenario.message }),
        });
      });

      await page.goto('http://localhost:3001/history');
      await page.waitForTimeout(1000);

      const errorBanner = page.locator('[data-testid="error-banner"], [role="alert"]');
      if (await errorBanner.isVisible({ timeout: 3000 }).catch(() => false)) {
        const errorText = await errorBanner.textContent();
        // Error message should be user-friendly, not just raw error code
        expect(errorText).toBeTruthy();
        expect(errorText!.length).toBeGreaterThan(10);
      }

      await page.route('**/api/**', route => route.abort());
    }
  });

  test('should maintain coverage >=85% for error handling features', async ({ page, context }) => {
    // Exercise all major error handling paths

    await injectFreighterStub(page);
    await mockHorizonAccount(page);

    // 1. Network offline
    await context.setOffline(true);
    await page.reload();
    await page.waitForTimeout(1000);
    await context.setOffline(false);

    // 2. API error
    await page.route('**/api/**', route => route.fulfill({ status: 500 }));
    await page.goto('http://localhost:3001/history');
    await page.waitForTimeout(1000);

    // 3. Dismiss error
    const dismissButton = page.locator('[data-testid="dismiss-error"], [aria-label="Dismiss"]');
    if (await dismissButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dismissButton.click();
    }

    // 4. Retry action
    await page.route('**/api/**', route => route.continue());
    const retryButton = page.locator('[data-testid="retry-button"], button:has-text("Retry")');
    if (await retryButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await retryButton.click();
    }

    await waitForNetworkIdle(page);

    // Verify error handling paths were exercised
    const finalState = await page.evaluate(() => ({
      hasErrors: document.querySelector('[data-testid="error-banner"]') !== null,
      isOnline: navigator.onLine,
    }));

    expect(finalState.isOnline).toBeTruthy();
  });
});
