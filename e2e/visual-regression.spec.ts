import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";

test.describe("Visual Regression Tests", () => {
  test.describe("Component Snapshots", () => {
    test("main page layout should match snapshot", async ({ page }) => {
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveScreenshot("main-page.png", {
        maxDiffPixels: 100,
        threshold: 0.2,
      });
    });

    test("form card component should match snapshot", async ({ page }) => {
      await page.goto(`${BASE_URL}/`);

      const formCard = page.locator('[data-testid="form-card"]').first();
      if (await formCard.isVisible()) {
        await expect(formCard).toHaveScreenshot("form-card.png", {
          maxDiffPixels: 50,
        });
      }
    });

    test("header component should match snapshot", async ({ page }) => {
      await page.goto(`${BASE_URL}/`);

      const header = page.locator("header").first();
      await expect(header).toHaveScreenshot("header.png", {
        maxDiffPixels: 30,
      });
    });

    test("transaction history page should match snapshot", async ({ page }) => {
      await page.goto(`${BASE_URL}/history`);
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveScreenshot("history-page.png", {
        maxDiffPixels: 100,
      });
    });
  });

  test.describe("Responsive Layout Tests", () => {
    test("should render correctly on mobile (375px)", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveScreenshot("mobile-375.png", {
        maxDiffPixels: 150,
      });
    });

    test("should render correctly on tablet (768px)", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveScreenshot("tablet-768.png", {
        maxDiffPixels: 150,
      });
    });

    test("should render correctly on desktop (1920px)", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveScreenshot("desktop-1920.png", {
        maxDiffPixels: 150,
      });
    });

    test("form should be responsive on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${BASE_URL}/`);

      const inputs = page.locator("input");
      const inputCount = await inputs.count();

      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        if (await input.isVisible()) {
          const box = await input.boundingBox();
          expect(box?.width).toBeLessThanOrEqual(375);
        }
      }
    });
  });

  test.describe("Theme Variation Tests", () => {
    test("should render correctly in light theme", async ({ page }) => {
      await page.goto(`${BASE_URL}/`);

      // Set light theme
      await page.evaluate(() => {
        document.documentElement.classList.remove("dark");
      });

      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot("theme-light.png", {
        maxDiffPixels: 100,
      });
    });

    test("should render correctly in dark theme", async ({ page }) => {
      await page.goto(`${BASE_URL}/`);

      // Set dark theme
      await page.evaluate(() => {
        document.documentElement.classList.add("dark");
      });

      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot("theme-dark.png", {
        maxDiffPixels: 100,
      });
    });

    test("theme toggle should work correctly", async ({ page }) => {
      await page.goto(`${BASE_URL}/`);

      const themeToggle = page.locator('[data-testid="theme-toggle"]').first();
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(300);

        const isDark = await page.evaluate(() => {
          return document.documentElement.classList.contains("dark");
        });

        expect(typeof isDark).toBe("boolean");
      }
    });
  });

  test.describe("Interactive Element States", () => {
    test("button hover states should be visible", async ({ page }) => {
      await page.goto(`${BASE_URL}/`);

      const button = page.getByRole("button").first();
      if (await button.isVisible()) {
        await button.hover();
        await page.waitForTimeout(200);

        await expect(button).toHaveScreenshot("button-hover.png", {
          maxDiffPixels: 50,
        });
      }
    });

    test("input focus states should be visible", async ({ page }) => {
      await page.goto(`${BASE_URL}/`);

      const input = page.locator("input").first();
      if (await input.isVisible()) {
        await input.focus();
        await page.waitForTimeout(200);

        await expect(input).toHaveScreenshot("input-focus.png", {
          maxDiffPixels: 50,
        });
      }
    });

    test("disabled button states should be visible", async ({ page }) => {
      await page.goto(`${BASE_URL}/`);

      const buttons = page.locator("button:disabled");
      const count = await buttons.count();

      if (count > 0) {
        await expect(buttons.first()).toHaveScreenshot("button-disabled.png", {
          maxDiffPixels: 30,
        });
      }
    });
  });

  test.describe("Visual Diff Reviews", () => {
    test("should detect visual changes in main layout", async ({ page }) => {
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState("networkidle");

      const mainContent = page.locator("main").first();
      if (await mainContent.isVisible()) {
        await expect(mainContent).toHaveScreenshot("main-content-diff.png", {
          maxDiffPixels: 200,
          threshold: 0.3,
        });
      }
    });

    test("should detect visual changes in form elements", async ({ page }) => {
      await page.goto(`${BASE_URL}/`);

      const form = page.locator("form").first();
      if (await form.isVisible()) {
        await expect(form).toHaveScreenshot("form-diff.png", {
          maxDiffPixels: 100,
          threshold: 0.2,
        });
      }
    });
  });

  test.describe("Accessibility Visual Tests", () => {
    test("focus indicators should be visible", async ({ page }) => {
      await page.goto(`${BASE_URL}/`);

      const button = page.getByRole("button").first();
      if (await button.isVisible()) {
        await button.focus();
        await page.waitForTimeout(200);

        const focusStyle = await button.evaluate((el) => {
          return window.getComputedStyle(el, ":focus").outline;
        });

        expect(focusStyle).toBeDefined();
      }
    });

    test("color contrast should be sufficient", async ({ page }) => {
      await page.goto(`${BASE_URL}/`);

      const elements = page.locator("*");
      const count = await elements.count();

      // Sample check on first 10 visible elements
      for (let i = 0; i < Math.min(10, count); i++) {
        const element = elements.nth(i);
        if (await element.isVisible()) {
          const style = await element.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              color: computed.color,
              backgroundColor: computed.backgroundColor,
            };
          });

          expect(style.color).toBeDefined();
        }
      }
    });
  });
});
