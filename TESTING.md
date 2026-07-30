# Testing Guide

This document covers how to write and run tests for Stellar-Spend.

---

## Table of Contents

1. [Running Tests](#running-tests)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [E2E Testing with Playwright](#e2e-testing-with-playwright)
5. [Test Coverage](#test-coverage)
6. [Mocking Strategies](#mocking-strategies)

---

## Running Tests

```bash
# Run all unit/integration tests once
npm test

# Watch mode (re-runs on file change)
npm run test:watch

# Run E2E tests
npm run test:e2e
```

---

## Unit Testing

Unit tests use **Vitest** + **React Testing Library** and live alongside the code they test.

### File conventions

| Target            | Location                                                |
| ----------------- | ------------------------------------------------------- |
| Library / utility | `src/lib/**/*.test.ts`                                  |
| React component   | `src/test/*.test.tsx` or `src/app/__tests__/*.test.tsx` |
| API route handler | `src/test/*.test.ts`                                    |

### Setup

`src/test/setup.ts` is loaded before every suite and imports `@testing-library/jest-dom` matchers (e.g. `toBeInTheDocument`, `toHaveValue`).

### Writing a unit test

```ts
import { describe, it, expect } from "vitest";
import { validateAmount } from "@/lib/offramp/utils/validation";

describe("validateAmount", () => {
  it("returns true for a valid positive number", () => {
    expect(validateAmount("10.5")).toBe(true);
  });

  it("returns false for an empty string", () => {
    expect(validateAmount("")).toBe(false);
  });
});
```

### Writing a component test

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Header } from "@/components/Header";

describe("Header", () => {
  it("renders the connect wallet button when disconnected", () => {
    render(<Header isConnected={false} onConnect={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /connect wallet/i }),
    ).toBeInTheDocument();
  });
});
```

---

## Integration Testing

Integration tests verify that multiple modules work together — for example, an API route handler calling real service logic with mocked external dependencies.

### Pattern

1. Import the Next.js route handler directly.
2. Construct a `NextRequest` with the required body/params.
3. Mock only the external boundary (SDK, env, network).
4. Assert the `Response` status and JSON body.

```ts
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/env", () => ({
  env: {
    server: { PAYCREST_API_KEY: "test-key" /* ... */ },
    public: {/* ... */},
  },
}));

const { POST } = await import("@/app/api/offramp/quote/route");

describe("POST /api/offramp/quote", () => {
  it("returns 400 for a missing amount", async () => {
    const req = new NextRequest("http://localhost/api/offramp/quote", {
      method: "POST",
      body: JSON.stringify({ currency: "NGN" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
```

---

## E2E Testing with Playwright

E2E tests live in `./e2e/` and run against a real dev server on `http://localhost:3001`.

### Configuration highlights (`playwright.config.ts`)

- Browser: Chromium (Desktop Chrome)
- Base URL: `http://localhost:3001`
- CI: 2 retries, 1 worker, `forbidOnly` enabled
- Traces captured on first retry for debugging

### Running locally

```bash
# Starts the dev server automatically, then runs tests
npm run test:e2e

# Run a specific spec file
npx playwright test e2e/smoke.spec.ts

# Open the HTML report after a run
npx playwright show-report
```

### Writing an E2E test

```ts
import { test, expect } from "@playwright/test";

test.describe("Off-ramp flow", () => {
  test("page loads with correct title and connect button", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Stellar-Spend/i);
    await expect(
      page.getByRole("button", { name: /connect wallet/i }),
    ).toBeVisible();
  });
});
```

### Wallet interactions

Freighter and Lobstr are browser extensions and cannot be installed in Playwright's Chromium. For flows that require a connected wallet, stub `window.freighter` / `window.lobstr` via `page.addInitScript` before navigation.

---

## Test Coverage

Coverage is not enforced by a hard threshold today, but the following targets are expected:

| Layer                | Target                                                  |
| -------------------- | ------------------------------------------------------- |
| `src/lib/` utilities | ≥ 80% line coverage                                     |
| API route handlers   | All happy-path + primary error branches covered         |
| React components     | Key render states and user interactions covered         |
| E2E                  | Critical user journey (load → connect → submit) covered |

To generate a coverage report locally:

```bash
npx vitest run --coverage
```

> Coverage output is written to `./coverage/`. The directory is git-ignored.

---

## Mocking Strategies

### Environment variables

Always mock `@/lib/env` rather than setting `process.env` directly to keep tests hermetic.

```ts
vi.mock("@/lib/env", () => ({
  env: {
    server: {
      PAYCREST_API_KEY: "test-api-key",
      PAYCREST_WEBHOOK_SECRET: "test-secret",
      BASE_PRIVATE_KEY: "0xdeadbeef",
      BASE_RETURN_ADDRESS: "0xreturn",
      BASE_RPC_URL: "https://base-rpc.test",
      STELLAR_SOROBAN_RPC_URL: "https://soroban.test",
      STELLAR_HORIZON_URL: "https://horizon.test",
    },
    public: {
      NEXT_PUBLIC_STELLAR_SOROBAN_RPC_URL: "https://soroban.test",
      NEXT_PUBLIC_BASE_RETURN_ADDRESS: "0xreturn",
      NEXT_PUBLIC_STELLAR_USDC_ISSUER: "GISSUER",
    },
  },
}));
```

### External SDKs (Allbridge, Stellar, viem)

Mock the SDK class/module at the top of the test file with minimal fake data.

```ts
vi.mock("@allbridge/bridge-core-sdk", () => ({
  AllbridgeCoreSdk: class {
    chainDetailsMap = vi.fn();
    buildSwapAndBridgeTx = vi.fn().mockResolvedValue({ tx: "fake-xdr" });
  },
  nodeRpcUrlsDefault: {},
}));
```

### Rate limiter

```ts
vi.mock("@/lib/offramp/utils/rate-limiter", () => ({
  buildTxLimiter: { check: () => ({ allowed: true }) },
  getClientIp: () => "127.0.0.1",
}));
```

### React component callbacks

Use `vi.fn()` for all callback props and assert with `toHaveBeenCalledWith`.

```ts
const onSubmit = vi.fn();
render(<FormCard {...baseProps} onSubmit={onSubmit} />);
await userEvent.click(screen.getByRole('button', { name: /submit/i }));
expect(onSubmit).toHaveBeenCalledOnce();
```

### `localStorage`

`jsdom` provides a real `localStorage` implementation. Clear it in `beforeEach` to prevent cross-test pollution.

```ts
beforeEach(() => localStorage.clear());
```
