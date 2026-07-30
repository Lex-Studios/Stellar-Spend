import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";

test.describe("Production Smoke Tests", () => {
  test("health check endpoint returns healthy status", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toMatch(/healthy|degraded/);
    expect(data.timestamp).toBeDefined();
    expect(data.version).toBeDefined();
  });

  test("page loads with correct title and connect button", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    await expect(page).toHaveTitle(/Stellar-Spend/i);

    const connectButton = page.getByRole("button", { name: /connect wallet/i });
    await expect(connectButton).toBeVisible();
  });

  test("critical API endpoints are accessible", async ({ request }) => {
    const endpoints = [
      "/api/offramp/currencies",
      "/api/offramp/rate",
      "/api/health",
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(`${BASE_URL}${endpoint}`);
      expect(response.status()).toBeLessThan(500);
    }
  });

  test("quote endpoint returns valid response", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/offramp/quote`, {
      data: {
        amount: "100",
        currency: "NGN",
        feeMethod: "USDC",
      },
    });

    expect(response.status()).toBeLessThan(500);
    if (response.status() === 200) {
      const data = await response.json();
      expect(data.destinationAmount).toBeDefined();
      expect(data.rate).toBeGreaterThan(0);
    }
  });

  test("gas fee options endpoint returns valid data", async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/api/offramp/bridge/gas-fee-options`,
    );

    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    }
  });

  test("post-deployment smoke test - UI renders without errors", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/`);

    // Check for console errors
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Wait for page to stabilize
    await page.waitForLoadState("networkidle");

    expect(errors.length).toBe(0);
  });

  test("service worker registration succeeds", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const swRegistered = await page.evaluate(() => {
      return navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.length > 0);
    });

    expect(swRegistered).toBe(true);
  });
});
