# Stellar-Spend — GitHub Issues Backlog (120 Issues)

> This document tracks all work needed to build Stellar-Spend to full production quality.
> Issues are grouped by area: Project Setup, Frontend UI, Wallet & Auth, Offramp Flow,
> Backend API, Bridge Integration, Paycrest Integration, Testing, DevOps, and Enhancements.

---

## 🏗️ PROJECT SETUP (Issues 1–8)

---

### Issue 1 — Project Setup: Initialize Next.js 15 app with full TypeScript config

**Description:**
The project currently has a `package.json` and `tsconfig.json` scaffolded but `node_modules` are not installed and the app has never been run. Complete the project initialization:

- Run `npm install` to install all dependencies listed in `package.json`
- Verify `next dev` starts without errors on `http://localhost:3000`
- Confirm TypeScript strict mode is active (`"strict": true` in `tsconfig.json`)
- Ensure `next-env.d.ts` is generated
- Add `eslint.config.js` with `eslint-config-next` rules
- Confirm Tailwind CSS v4 is working by checking `globals.css` is imported in `layout.tsx`

**Acceptance Criteria:**

- `npm run dev` starts cleanly
- `npm run build` completes without TypeScript errors
- `npm run lint` passes with zero errors

---

### Issue 2 — Project Setup: Configure environment variables and `.env.example`

**Description:**
The `.env.example` file exists but needs to be fully documented and validated at startup. Tasks:

- Document every env var with inline comments explaining what it does and where to get it
- Add `NEXT_PUBLIC_STELLAR_USDC_ISSUER` for filtering the correct USDC trustline on Horizon
- Add validation logic in a `src/lib/env.ts` module that throws a clear error at server startup if any required server-side env var is missing
- Update `README.md` with a step-by-step env setup guide
- Ensure `BASE_PRIVATE_KEY` and `PAYCREST_API_KEY` are never prefixed with `NEXT_PUBLIC_`

**Acceptance Criteria:**

- Missing env vars produce a clear error message at startup, not a cryptic runtime crash
- `.env.example` is fully commented

---

### Issue 3 — Project Setup: Add `next.config.ts` with security headers and image domains

**Description:**
The current `next.config.ts` only sets `reactStrictMode: true`. Harden it:

- Add HTTP security headers via `headers()`: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy`
- Configure `serverExternalPackages` for `@allbridge/bridge-core-sdk` and `@stellar/stellar-sdk` to prevent bundling issues
- Add `experimental.serverComponentsExternalPackages` if needed for Soroban RPC calls
- Set `output: 'standalone'` for Docker-friendly builds

**Acceptance Criteria:**

- Security headers are present on all responses (verify with curl)
- Allbridge SDK initializes without module resolution errors in production build

---

### Issue 4 — Project Setup: Configure Tailwind CSS v4 design tokens

**Description:**
The `globals.css` defines CSS custom properties (`--bg`, `--accent`, etc.) but Tailwind v4 should consume them as design tokens. Tasks:

- Define all color tokens (`--bg`, `--panel`, `--line`, `--muted`, `--accent`, `--text`) in the Tailwind config or via `@theme` directive
- Add `font-space-grotesk` and `font-ibm-plex-mono` as Tailwind font utilities
- Add custom animation utilities: `animate-spin-slow`, `animate-scale-in`, `dot-bounce`, `racing-border-wrapper`, `racing-border-content`
- Ensure all custom CSS classes used in components are either Tailwind utilities or defined in `globals.css`

**Acceptance Criteria:**

- No inline style hacks needed for design tokens
- All animations work correctly in the browser

---

### Issue 5 — Project Setup: Add `src/lib/env.ts` — centralized environment config module

**Description:**
Create a typed environment config module that centralizes all env var access:

- Export typed constants: `PAYCREST_API_KEY`, `PAYCREST_WEBHOOK_SECRET`, `BASE_PRIVATE_KEY`, `BASE_RETURN_ADDRESS`, `BASE_RPC_URL`, `STELLAR_SOROBAN_RPC_URL`, `STELLAR_HORIZON_URL`
- Throw descriptive errors at module load time if required server-side vars are missing
- Export public constants separately: `NEXT_PUBLIC_BASE_RETURN_ADDRESS`, `NEXT_PUBLIC_STELLAR_USDC_ISSUER`
- Never import server-side vars in client components (enforce with a lint rule or comment)

**Acceptance Criteria:**

- All API routes import env vars from this module, not directly from `process.env`
- Missing vars fail fast with a clear message

---

### Issue 6 — Project Setup: Add `.vscode/settings.json` and editor config

**Description:**
Add developer experience configuration:

- `.vscode/settings.json`: enable format on save, set default formatter to Prettier, configure TypeScript SDK path
- `.editorconfig`: set indent style, charset, end of line
- Add `prettier.config.js` with consistent formatting rules (single quotes, trailing commas, 100 char line width)
- Add `.prettierignore`

**Acceptance Criteria:**

- Code is auto-formatted on save in VS Code
- `npx prettier --check .` passes

---

### Issue 7 — Project Setup: Add `CONTRIBUTING.md` and `LICENSE`

**Description:**
Add project governance files:

- `LICENSE`: MIT license with correct year and author
- `CONTRIBUTING.md`: explains how to set up the dev environment, branch naming conventions, PR process, and commit message format (Conventional Commits)
- `CODE_OF_CONDUCT.md`: standard Contributor Covenant

**Acceptance Criteria:**

- Files are present and accurate

---

### Issue 8 — Project Setup: Configure GitHub Actions CI pipeline

**Description:**
Add a `.github/workflows/ci.yml` that runs on every push and PR to `main`:

- Install dependencies with `npm ci`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test` (once tests exist)
- Cache `node_modules` and `.next/cache` for speed
- Add a badge to `README.md`

**Acceptance Criteria:**

- CI passes on a clean push to `main`
- Build failures block PR merges

---

## 🎨 FRONTEND — LAYOUT & CORE UI (Issues 9–20)

---

### Issue 9 — Frontend: Build `Header` component with wallet connect button and balance display

**Description:**
Create `src/components/Header.tsx` matching the reference implementation:

- Display app title "STELLAR-SPEND" in `Space Grotesk` bold font, responsive size via `clamp()`
- Show a subtitle string passed as prop
- Wallet button: shows "CONNECT WALLET" when disconnected, truncated address (`GCFX...2YTK`) when connected, "CONNECTING..." during connection
- Button style: gold border (`#C9A962`), dark background, hover fills gold, focus ring
- When connected, show USDC balance and XLM balance below the button (right-aligned)
- Show "loading..." text while balances are fetching
- `onConnect` / `onDisconnect` callbacks
- Fully responsive: stacks vertically on mobile (`max-[720px]`)

**Props interface:**

```ts
interface HeaderProps {
  subtitle: string;
  isConnected: boolean;
  isConnecting: boolean;
  walletAddress?: string;
  stellarUsdcBalance?: string | null;
  stellarXlmBalance?: string | null;
  isBalanceLoading?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}
```

**Acceptance Criteria:**

- Renders correctly in all three wallet states
- Balance lines only appear when connected

---

### Issue 10 — Frontend: Build `FormCard` component — amount input and bank details form

**Description:**
Create `src/components/FormCard.tsx` — the main offramp form. This is the most complex UI component:

**Fields:**

- USDC amount input (number, min 0.7, step 0.000001) with live quote suffix
- Gas fee selector: two buttons (USDC / XLM), shows fee amount from API, warning text
- Currency selector (dropdown, populated from Paycrest API)
- Account number input (10 digits)
- Bank selector (dropdown, populated from Paycrest API based on selected currency)
- Account name (read-only, auto-resolved via verify-account API)

**Behavior:**

- Debounced quote fetch (500ms) on amount/currency/fee method change
- Auto-verify account when account number is 10 digits and bank is selected
- Reset all fields when `resetKey` prop increments
- Primary button: "CONNECT WALLET" → "WAITING FOR SIGNATURE..." → "INITIATE OFFRAMP →" → "INITIATING OFFRAMP..."
- Button disabled states based on connection and form validity
- Show estimated payout box when quote is available

**Sub-components:** `InputField`, `SelectField`, `Field` (read-only display)

**Acceptance Criteria:**

- All fields validate correctly
- Quote updates on debounce
- Account name resolves automatically

---

### Issue 11 — Frontend: Build `RightPanel` component — settlement breakdown and payout preview

**Description:**
Create `src/components/RightPanel.tsx`:

- Top section: gold accent panel showing hero label, hero value (estimated payout), and meta text
  - When disconnected: shows "CONNECT WALLET" button inside the panel
  - When connecting: pulsing animation
  - When connected with amount: shows formatted payout amount
- Bottom section: "SETTLEMENT BREAKDOWN" card with:
  - Network fee row
  - Platform fee row
  - Divider
  - "Payout Total" row with large accent text
- All values update reactively from `quote` prop
- Currency-aware formatting: NGN uses `₦` prefix + `Intl.NumberFormat`, others use `Intl.NumberFormat` with currency style

**Props:**

```ts
interface RightPanelProps {
  isConnected: boolean;
  isConnecting: boolean;
  amount: string;
  quote: { destinationAmount: string; rate: number; currency: string } | null;
  isLoadingQuote: boolean;
  currency: string;
  onConnect: () => void;
}
```

**Acceptance Criteria:**

- Payout total updates live as user types amount
- Correct currency formatting for all supported currencies

---

### Issue 12 — Frontend: Build `ProgressSteps` component — 3-step flow indicator

**Description:**
Create `src/components/ProgressSteps.tsx`:

- 3-column grid (1-column on mobile) of step cards
- Step 01: "CONNECT WALLET" / "CONNECTED ✓" based on `isConnected`
- Step 02: "FX LOCK" / "SIGNATURE PENDING" based on `isConnecting`
- Step 03: "₦ PAYOUT" (always static)
- Active step gets gold background (`var(--accent)`) with dark text
- Each card shows: step number (large bold), title, description

**Acceptance Criteria:**

- Correct step highlights for each wallet state
- Responsive grid collapses to single column on mobile

---

### Issue 13 — Frontend: Build `RecentOfframpsTable` component — transaction history table

**Description:**
Create `src/components/RecentOfframpsTable.tsx`:

- Section header "RECENT OFFRAMPS" with "VIEW ALL" button (right-aligned)
- Table columns: TX HASH, USDC, NAIRA, STATUS
- Gold header row
- Status badge: "SETTLING" = gold filled badge, "COMPLETE" = white border badge
- Horizontally scrollable on mobile
- Accepts `rows: ReadonlyArray<RecentOfframpRow>` prop
- Eventually should show real user transactions from `TransactionStorage`

**Acceptance Criteria:**

- Table renders with mock data
- Status badges styled correctly
- Mobile scroll works

---

### Issue 14 — Frontend: Build `TransactionProgressModal` component — offramp step tracker

**Description:**
Create `src/components/TransactionProgressModal.tsx` — a full-screen modal overlay that tracks the 5-step offramp process:

**Steps:** initiating → awaiting-signature → submitting → processing → settling → success/error

**Features:**

- Backdrop blur overlay (click to close only when done)
- Racing border animation on modal container (CSS `conic-gradient` + `@property`)
- Step list: past steps show gold checkmark, current step shows spinning indicator + bouncing dots, future steps are dimmed
- Success state: animated scale-in checkmark, success message
- Error state: red X icon, error message (word-wrapped)
- Close/Done button only appears in terminal states

**Type:**

```ts
export type OfframpStep =
  | 'idle'
  | 'initiating'
  | 'awaiting-signature'
  | 'submitting'
  | 'processing'
  | 'settling'
  | 'success'
  | 'error';
```

**Acceptance Criteria:**

- All step transitions animate correctly
- Modal cannot be dismissed mid-transaction
- Error message displays full text without overflow

---

### Issue 15 — Frontend: Build `StellarSpendDashboard` main orchestrator component

**Description:**
Create `src/components/StellarSpendDashboard.tsx` — the top-level client component that wires everything together:

- Manages wallet connection state via `useStellarWallet` hook
- Fetches USDC and XLM balances from Stellar Horizon on wallet connect
- Manages `pricingState` (amount, quote, isLoadingQuote, currency) lifted from FormCard
- Implements `handleExecuteTrade()` — the full offramp execution flow (see Issue 40)
- Implements `pollBridgeStatus()` and `pollPayoutStatus()` client-side polling loops
- Manages `TransactionProgressModal` open/close and step state
- Loads user transaction history from `TransactionStorage` on wallet connect
- Resets form via `formResetKey` after successful transaction
- Pre-flight balance checks before initiating trade

**Acceptance Criteria:**

- All child components receive correct props
- Trade execution flow progresses through all modal steps
- Errors are caught and displayed in modal

---

### Issue 16 — Frontend: Update `src/app/page.tsx` to render dashboard

**Description:**
Replace the placeholder `page.tsx` with the real dashboard:

```tsx
import { StellarSpendDashboard } from '@/components/StellarSpendDashboard';

export default function Page() {
  return <StellarSpendDashboard />;
}
```

Also update `layout.tsx` metadata:

- Title: "Stellar-Spend — Convert Stablecoins to Fiat"
- Description: accurate project description
- Add Open Graph tags for social sharing

**Acceptance Criteria:**

- Dashboard renders at `http://localhost:3000`
- Page title is correct in browser tab

---

### Issue 17 — Frontend: Implement `StateSwitcher` dev tool component

**Description:**
Create `src/components/StateSwitcher.tsx` for development/demo purposes:

- Tab-style switcher with three options: "Pre Connect", "Connecting", "Connected"
- Uses `role="tablist"` and `aria-selected` for accessibility
- Active tab gets gold background
- Only render in development mode or behind a feature flag

**Acceptance Criteria:**

- Switching tabs updates the displayed wallet state in the dashboard
- Accessible via keyboard

---

### Issue 18 — Frontend: Add `InputField`, `SelectField`, and `Field` sub-components

**Description:**
Extract the reusable form primitives from `FormCard` into `src/components/ui/`:

- `InputField`: label + bordered input + optional suffix text
- `SelectField`: label + styled native select with custom chevron SVG
- `Field`: label + read-only display value with tone (muted/accent)

All components:

- Use `var(--line)` border, `var(--muted)` label color
- 46px height
- IBM Plex Mono font
- Disabled state with reduced opacity

**Acceptance Criteria:**

- Components are reusable across the app
- All props are typed with TypeScript interfaces

---

### Issue 19 — Frontend: Implement responsive layout grid for dashboard

**Description:**
The dashboard uses a two-column grid layout that collapses on smaller screens:

- Desktop (>1100px): `grid-cols-[1fr_370px]` — FormCard left, RightPanel right spanning 2 rows, RecentOfframpsTable bottom-left
- Tablet/Mobile (<1100px): single column, order: FormCard → RightPanel → RecentOfframpsTable → ProgressSteps
- Outer container: `min-h-screen p-4` with inner bordered section
- Inner padding: `px-[2.6rem] py-8`, collapses to `p-4` on mobile

**Acceptance Criteria:**

- Layout matches reference at all breakpoints
- No horizontal overflow on mobile

---

### Issue 20 — Frontend: Add loading skeletons for async data states

**Description:**
Add skeleton loading states for:

- Balance display in Header (while `isBalanceLoading`)
- Bank dropdown (while `isLoadingBanks`)
- Currency dropdown (while `isLoadingCurrencies`)
- Quote suffix in amount input (while `isLoadingQuote`)
- Gas fee options (while `isLoadingFees`)
- Account name field (while `isVerifyingAccount`)

Use CSS animation (`opacity` pulse) rather than a library. Keep it minimal.

**Acceptance Criteria:**

- No layout shift when data loads
- Loading states are visually distinct from empty states

---

## 🔐 WALLET & AUTH (Issues 21–30)

---

### Issue 21 — Wallet: Implement `StellarWalletAdapter` — Freighter connection

**Description:**
Complete the Freighter wallet connection in `src/lib/stellar/wallet-adapter.ts`:

- Use `@stellar/freighter-api` v6: `isConnected()`, `getAddress()`, `requestAccess()`
- Handle the case where `isConnected()` returns false but the extension is installed (request access flow)
- If `getAddress()` returns empty, call `requestAccess()` to prompt the user
- Store `walletType` and `publicKey` in the singleton adapter instance
- Throw descriptive errors for each failure case

**Acceptance Criteria:**

- Freighter connects successfully on mainnet
- Correct public key is returned
- Error messages are user-friendly

---

### Issue 22 — Wallet: Implement `StellarWalletAdapter` — Lobstr connection

**Description:**
Complete the Lobstr wallet connection:

- Detect Lobstr via `window.lobstr` or `window.stellar?.isLobstr`
- Call `connect()` on the detected object
- Fall back gracefully if neither is present
- Store wallet type and public key

**Acceptance Criteria:**

- Lobstr connects when extension is installed
- Clear error when Lobstr is not found

---

### Issue 23 — Wallet: Implement `StellarWalletAdapter` — auto-detect and sign transaction

**Description:**
Complete the auto-detect and `signTransaction` methods:

- `connectAuto()`: try Freighter first, then Lobstr, throw if neither available
- `signTransaction(xdr)`: route to correct wallet based on stored `walletType`
- For Freighter: use `freighterApi.signTransaction(xdr, { networkPassphrase: "Public Global Stellar Network ; September 2015" })`
- For Lobstr: call `window.lobstr.signTransaction()` or `window.stellar.signTransaction()`
- Return signed XDR string

**Acceptance Criteria:**

- Signing works with both wallet types
- Network passphrase is always mainnet

---

### Issue 24 — Wallet: Implement `useStellarWallet` hook

**Description:**
Complete `src/hooks/useStellarWallet.ts`:

- `useState` for `wallet`, `isConnecting`, `error`
- `useEffect` on mount: check for existing wallet via `adapter.getWallet()`
- `connect(walletType?)`: sets `isConnecting`, calls adapter, sets wallet, handles errors
- `disconnect()`: calls `adapter.disconnect()`, clears state
- `signTransaction(xdr)`: delegates to adapter, surfaces errors via `setError`
- Return all state and handlers

**Acceptance Criteria:**

- Hook correctly reflects wallet state
- Errors are surfaced without crashing the app

---

### Issue 25 — Wallet: Implement `useWalletFlow` hook

**Description:**
Complete `src/hooks/useWalletFlow.ts`:

- Manages `WalletFlowState`: `"pre_connect" | "connecting" | "connected"`
- Returns current `variant` from `STATE_VARIANTS` lookup
- Returns `steps` array built by `buildProgressSteps(variant)`
- `steps` is memoized with `useMemo`

**Acceptance Criteria:**

- State transitions update variant and steps correctly
- No unnecessary re-renders

---

### Issue 26 — Wallet: Fetch and display Stellar USDC balance from Horizon

**Description:**
In `StellarSpendDashboard`, implement balance fetching:

- On wallet connect, fetch `https://horizon.stellar.org/accounts/{publicKey}`
- Parse `balances` array for USDC trustline: `asset_type` is `credit_alphanum4`, `asset_code` is `USDC`
- If `NEXT_PUBLIC_STELLAR_USDC_ISSUER` is set, filter by `asset_issuer`
- Format balance with `toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })`
- Also fetch native XLM balance (`asset_type === "native"`)
- Handle errors gracefully (show "0.00" on failure)
- Set `isLoadingBalance` during fetch

**Acceptance Criteria:**

- Correct USDC and XLM balances shown after connect
- Loading state shown during fetch

---

### Issue 27 — Wallet: Pre-flight balance validation before trade execution

**Description:**
Before initiating a trade in `handleExecuteTrade()`:

- Parse `stellarUsdcBalance` (strip commas) and compare to `tradeData.amount`
- If USDC balance < send amount: throw `"Insufficient USDC balance. You have X USDC but are trying to send Y USDC."`
- If fee method is `"native"`: parse XLM balance, check against `MIN_XLM_RESERVE (3 XLM) + estimatedGas (2.5 XLM)`
- If XLM insufficient: throw descriptive error suggesting to switch to USDC fee payment

**Acceptance Criteria:**

- Trade is blocked with clear error before any API calls are made
- Error message includes actual and required balances

---

### Issue 28 — Wallet: Handle wallet disconnect and session cleanup

**Description:**
When user disconnects:

- Call `adapter.disconnect()` to clear stored wallet state
- Clear `userTransactions` state in dashboard
- Clear `stellarUsdcBalance` and `stellarXlmBalance`
- Reset `pricingState` to initial values
- Ensure no stale wallet state persists across page refreshes (adapter is a singleton but not persisted)

**Acceptance Criteria:**

- After disconnect, UI returns to pre-connect state
- No stale data shown

---

### Issue 29 — Wallet: Add wallet type indicator in Header

**Description:**
Show which wallet type is connected (Freighter or Lobstr) in the Header:

- Small badge or icon next to the wallet address
- "FREIGHTER" or "LOBSTR" label in muted text
- Pass `walletType` prop to Header from dashboard

**Acceptance Criteria:**

- Wallet type is visible when connected
- Does not break layout

---

### Issue 30 — Wallet: Handle Freighter network mismatch error

**Description:**
If the user has Freighter set to testnet but the app is mainnet:

- Detect network mismatch from `freighterApi.getNetworkDetails()`
- Show a clear error: "Freighter is set to [network]. Please switch to Mainnet."
- Block the connect flow until resolved

**Acceptance Criteria:**

- Network mismatch is caught before any transaction is built
- Error message is actionable

---

## ⚙️ OFFRAMP FLOW (Issues 31–45)

---

### Issue 31 — Offramp: Implement full `handleExecuteTrade` orchestration function

**Description:**
Implement the complete trade execution flow in `StellarSpendDashboard`:

1. Validate wallet connected and quote available
2. Run pre-flight balance checks (Issue 27)
3. Generate `txId` via `TransactionStorage.generateId()`
4. Save initial `Transaction` record with status `"pending"`
5. Initialize Allbridge SDK and fetch tokens (with 15s timeout)
6. Get bridge quote to compute `paycrestOrderAmount`
7. Floor `paycrestOrderAmount` to 6 decimals (avoid rounding up)
8. POST to `/api/offramp/paycrest/order` to create Paycrest order (20s timeout)
9. Extract `payoutOrderId` and `settlementAddress` from response
10. POST to `/api/offramp/bridge/build-tx` with `settlementAddress` as `toAddress` (30s timeout)
11. Extract `xdr` from response
12. Call `signTransaction(xdr)` — set modal step to `"awaiting-signature"`
13. POST signed XDR to `/api/offramp/bridge/submit-soroban` (15s timeout)
14. If status is `"PENDING"`, poll `/api/offramp/bridge/tx-status/{hash}` until `"SUCCESS"` or `"FAILED"`
15. Start parallel polling: `pollBridgeStatus()` (best-effort) and `pollPayoutStatus()` (critical path)
16. On payout success: set step to `"success"`, update transaction to `"completed"`, increment `formResetKey`
17. On any error: set step to `"error"`, update transaction to `"failed"`

**Acceptance Criteria:**

- Full flow completes end-to-end on mainnet
- Each step updates the modal correctly
- Errors at any step are caught and displayed

---

### Issue 32 — Offramp: Implement `pollBridgeStatus` client-side polling

**Description:**
Implement bridge status polling in `StellarSpendDashboard`:

- Poll `GET /api/offramp/bridge/status/{txHash}` every 5 seconds
- Max 60 attempts (5 minutes)
- Track consecutive errors; give up after 10 consecutive HTTP errors (soft exit, not throw)
- On success: update `tradeState.bridgeStatus` and `TransactionStorage`
- On `"completed"`: return
- On `"failed"`: throw
- Bridge polling is best-effort — failure should not block payout polling

**Acceptance Criteria:**

- Bridge status updates in modal during processing
- Consecutive errors don't crash the app

---

### Issue 33 — Offramp: Implement `pollPayoutStatus` client-side polling

**Description:**
Implement payout status polling in `StellarSpendDashboard`:

- Poll `GET /api/offramp/paycrest/order/{orderId}` every 10 seconds
- Max 60 attempts (10 minutes)
- Terminal states: `"validated"`, `"settled"`, `"refunded"`, `"expired"`
- On `"validated"` or `"settled"`: advance modal to `"settling"` step
- On terminal state: return (success) or throw (refunded/expired)
- Update `TransactionStorage` on each poll
- Throw `"Payout polling timeout"` after max attempts

**Acceptance Criteria:**

- Payout status drives the modal to success state
- Refunded/expired orders show appropriate error

---

### Issue 34 — Offramp: Implement `withTimeout` utility for promise timeouts

**Description:**
Add `withTimeout<T>(promise, ms, label)` utility in `src/lib/offramp/utils/timeout.ts`:

- Wraps any promise with a `setTimeout` that rejects with `"${label} timed out after ${ms/1000}s"`
- Clears the timer on both resolve and reject
- Used for: SDK init (15s), bridge quote (15s), Paycrest order (20s), build-tx (30s), submit (15s)

**Acceptance Criteria:**

- Timeout fires correctly
- Timer is always cleared (no memory leaks)

---

### Issue 35 — Offramp: Implement `TransactionStorage` class

**Description:**
Complete `src/lib/transaction-storage.ts`:

- `save(transaction)`: prepend to localStorage array, trim to 50 records
- `update(id, updates)`: find by id and merge updates
- `getAll()`: parse from localStorage, return `[]` on error
- `getByUser(userAddress)`: filter by case-insensitive address match
- `getById(id)`: find single record
- `clear()`: remove key from localStorage
- `generateId()`: `tx_${Date.now()}_${randomString}`
- All methods guard against `typeof window === "undefined"` (SSR safety)

**Acceptance Criteria:**

- Transactions persist across page refreshes
- Max 50 records enforced
- SSR-safe (no window access during server render)

---

### Issue 36 — Offramp: Display user transaction history in `RecentOfframpsTable`

**Description:**
Update `RecentOfframpsTable` to show real user transactions from `TransactionStorage`:

- In `StellarSpendDashboard`, pass `userTransactions` to the table
- Map `Transaction` records to `RecentOfframpRow` format
- Show `stellarTxHash` (truncated), `amount` (USDC), estimated fiat amount, and `status`
- Status mapping: `"pending"` → "SETTLING", `"completed"` → "COMPLETE", `"failed"` → "FAILED"
- Show "No transactions yet" empty state when list is empty
- "VIEW ALL" button: show all 50 records (expand or navigate to a detail view)

**Acceptance Criteria:**

- Real transactions appear after a successful offramp
- Empty state is shown for new users

---

### Issue 37 — Offramp: Implement quote fetching with Allbridge + Paycrest rate

**Description:**
In `FormCard`, implement the quote fetch logic:

- Debounce 500ms on amount/currency/feeMethod change
- Initialize Allbridge SDK (cached singleton promise)
- Call `getAllbridgeQuote(sdk, stellarUsdc, baseUsdc, amount)` to get `receiveAmount`
- If fee method is `"stablecoin"`: subtract stablecoin fee from amount before quoting
- Fetch Paycrest rate: `GET https://api.paycrest.io/v1/rates/USDC/{receiveAmount}/{currency}?network=base`
- Compute `destinationAmount = receiveAmount * rate * 0.99` (1% platform fee)
- Build `Quote` object and validate with `isValidQuote()`
- Call `onPricingUpdate` callback with new quote

**Acceptance Criteria:**

- Quote updates within 1 second of typing
- Invalid quotes (NaN, negative) are rejected
- Loading state shown during fetch

---

### Issue 38 — Offramp: Implement gas fee options fetch and display

**Description:**
In `FormCard`, fetch gas fee options on mount:

- Call `GET /api/offramp/bridge/gas-fee-options`
- Store `{ native: { int, float }, stablecoin: { int, float } }` in state
- Display fee amounts in the two fee selector buttons
- Show warning text when stablecoin fee is selected (amount deducted)
- Show info text when native fee is selected (full amount bridged, XLM charged separately)
- Re-fetch if SDK initialization fails (retry once)

**Acceptance Criteria:**

- Fee amounts shown in UI within 3 seconds of page load
- Warning/info text updates when fee method changes

---

### Issue 39 — Offramp: Implement currency and bank fetching from Paycrest

**Description:**
In `FormCard`:

- On mount: fetch `GET https://api.paycrest.io/v1/currencies` and populate currency dropdown
- Default to NGN if available
- On currency change: fetch `GET https://api.paycrest.io/v1/institutions/{currency}` and populate bank dropdown
- Reset bank and account name when currency changes
- Handle loading and error states for both fetches

**Acceptance Criteria:**

- Currencies load on mount
- Banks update when currency changes
- Errors don't crash the form

---

### Issue 40 — Offramp: Implement account verification via Paycrest

**Description:**
In `FormCard`, auto-verify account when account number is 10 digits and bank is selected:

- POST to `https://api.paycrest.io/v1/verify-account` with `{ institution, accountIdentifier }`
- Extract account name from `data.accountName` or `data.data`
- Show "Verifying..." in account name field during request
- Clear account name if verification fails or inputs change
- `canInitiateOfframp` requires `accountName` to be non-empty

**Acceptance Criteria:**

- Account name resolves automatically for valid Nigerian accounts
- Invalid accounts show empty account name (not an error toast)

---

### Issue 41 — Offramp: Implement `safeJson` and `decodeTxResultCode` error helpers

**Description:**
Add error decoding utilities in `src/lib/offramp/utils/errors.ts`:

- `safeJson(value)`: JSON.stringify with BigInt serialization, fallback to `String(value)`
- `decodeTxResultCode(errorResultXdr?)`: decode Stellar XDR error result to human-readable code
- `formatSorobanError(payload)`: combine status, txCode, message, and raw JSON into a readable string

These are used in `StellarSpendDashboard` to format Horizon/Soroban errors.

**Acceptance Criteria:**

- BigInt values serialize without throwing
- XDR error codes decode correctly

---

### Issue 42 — Offramp: Handle Soroban PENDING status with client-side tx polling

**Description:**
After submitting to `/api/offramp/bridge/submit-soroban`:

- If response status is `"PENDING"`: poll `GET /api/offramp/bridge/tx-status/{hash}` every 3 seconds
- Max 30 attempts (90 seconds)
- On `"SUCCESS"`: continue to bridge/payout polling
- On `"FAILED"`: throw `"Transaction failed on-chain. Your wallet was not debited."`
- On `"NOT_FOUND"`: keep polling (tx may not be indexed yet)
- On timeout: throw `"Transaction was not confirmed within 90s. It may have expired."`

**Acceptance Criteria:**

- PENDING transactions are confirmed before proceeding
- Timeout error is clear and actionable

---

### Issue 43 — Offramp: Implement form reset after successful transaction

**Description:**
After a successful offramp:

- Increment `formResetKey` in dashboard
- In `FormCard`, `useEffect` on `resetKey` change: clear amount, accountNumber, bank, accountName, quote
- Skip reset on initial mount (`if (resetKey === 0) return`)
- Reload user transactions from `TransactionStorage`

**Acceptance Criteria:**

- Form is blank after successful transaction
- User can immediately start a new offramp

---

### Issue 44 — Offramp: Add `NEXT_PUBLIC_BASE_RETURN_ADDRESS` validation

**Description:**
Before executing a trade:

- Check `process.env.NEXT_PUBLIC_BASE_RETURN_ADDRESS` is set
- If missing: throw `"NEXT_PUBLIC_BASE_RETURN_ADDRESS is missing"` before any API calls
- Validate it's a valid EVM address format (`0x` + 40 hex chars)

**Acceptance Criteria:**

- Missing env var fails fast with clear error
- Invalid format is caught before Paycrest order creation

---

### Issue 45 — Offramp: Implement `isValidQuote` type guard

**Description:**
Add `isValidQuote(data: unknown): data is Quote` in `FormCard` or a shared util:

- Check all required fields exist and have correct types
- `rate` and `estimatedTimeMs` must be finite numbers
- `sourceAmount` and `destinationAmount` must be non-empty strings
- Return `false` for any invalid shape

**Acceptance Criteria:**

- Invalid API responses don't set a broken quote in state
- Type guard narrows correctly in TypeScript

---

## 🌐 BACKEND API ROUTES (Issues 46–65)

---

### Issue 46 — API: Implement `POST /api/offramp/bridge/build-tx`

**Description:**
Implement the bridge transaction builder route:

- Parse and validate `{ amount, fromAddress, toAddress, feePaymentMethod }` from request body
- Validate `amount` with `validateAmount()`, `fromAddress` with `validateAddress("stellar")`, `toAddress` with `validateAddress("base")`
- Initialize Allbridge SDK and fetch tokens
- Get fee options via `getAllbridgeGasFeeOptions()`
- Select fee based on `feePaymentMethod` ("native" or "stablecoin", default stablecoin)
- Build Soroban XDR via `buildSwapAndBridgeTx()`
- Return `{ xdr, sourceToken, destinationToken }`
- Set `export const maxDuration = 30`
- Parse common simulation errors into user-friendly messages (e.g. insufficient XLM reserve)

**Acceptance Criteria:**

- Returns valid XDR for a real Stellar address and amount
- Returns 400 for invalid inputs
- Returns 500 with user-friendly message for simulation failures

---

### Issue 47 — API: Implement `POST /api/offramp/bridge/submit-soroban`

**Description:**
Implement the Soroban transaction submission route:

- Accept `{ signedXdr }` in request body
- Submit raw XDR directly to Soroban RPC via JSON-RPC `sendTransaction` method (no SDK re-serialization)
- Handle statuses: `"PENDING"` → return hash + PENDING, `"SUCCESS"` → return hash + SUCCESS, `"ERROR"` / `"TRY_AGAIN_LATER"` → return 400 with decoded error, `"DUPLICATE"` → return hash + PENDING
- Decode `errorResultXdr` for human-readable error codes
- Log `diagnosticEventsXdr` on error
- Set `export const maxDuration = 15`

**Acceptance Criteria:**

- PENDING transactions return immediately with hash
- ERROR status returns decoded error message
- No SDK re-serialization of the signed XDR

---

### Issue 48 — API: Implement `GET /api/offramp/bridge/tx-status/[hash]`

**Description:**
Implement the lightweight transaction status polling route:

- Accept `hash` path parameter
- Call Soroban RPC `getTransaction` method with the hash
- Return `{ status, hash }` where status is `"SUCCESS"`, `"FAILED"`, or `"NOT_FOUND"`
- Map RPC response to simplified status
- Set `export const maxDuration = 10`

**Acceptance Criteria:**

- Returns correct status for known transaction hashes
- Returns `"NOT_FOUND"` for unknown hashes (not a 404)

---

### Issue 49 — API: Implement `GET /api/offramp/bridge/status/[txHash]`

**Description:**
Implement the Allbridge bridge transfer status route:

- Accept `txHash` path parameter
- Initialize Allbridge SDK
- Call `getAllbridgeTransferStatus(sdk, "SRB", txHash)`
- Map Allbridge status to `BridgeStatus` type
- Return `{ data: { status, txHash, receiveAmount } }`
- Handle 404 from Allbridge gracefully (return `"pending"`)

**Acceptance Criteria:**

- Returns bridge status for a submitted transaction
- Allbridge 404s don't crash the route

---

### Issue 50 — API: Implement `GET /api/offramp/bridge/gas-fee-options`

**Description:**
Implement the gas fee options route:

- Initialize Allbridge SDK and fetch tokens
- Call `getAllbridgeGasFeeOptions(sdk, stellarUsdc, baseUsdc)`
- Return `{ feeOptions: { native: { int, float }, stablecoin: { int, float } } }`
- Cache the result for 60 seconds (use `next: { revalidate: 60 }` or in-memory cache)

**Acceptance Criteria:**

- Returns fee options within 5 seconds
- Cached response served on subsequent calls

---

### Issue 51 — API: Implement `POST /api/offramp/paycrest/order`

**Description:**
Implement the Paycrest order creation route:

- Parse and validate all required fields: `amount`, `rate`, `token`, `network`, `reference`, `returnAddress`, `recipient`
- Validate `amount > 0`, `rate > 0`, all recipient fields non-empty
- Instantiate `PaycrestAdapter` with `PAYCREST_API_KEY`
- Call `paycrest.createOrder(normalizedPayload)`
- Return `{ data: order }` with `id` and `receiveAddress`
- Return 400 for validation failures with detailed error object
- Return appropriate HTTP status from `PaycrestHttpError.status`

**Acceptance Criteria:**

- Creates real Paycrest order on mainnet
- Returns `receiveAddress` for bridge destination
- Validation errors return 400 with details

---

### Issue 52 — API: Implement `GET /api/offramp/paycrest/order/[orderId]`

**Description:**
Implement the Paycrest order status polling route:

- Accept `orderId` path parameter
- Instantiate `PaycrestAdapter` with `PAYCREST_API_KEY`
- Call `paycrest.getOrderStatus(orderId)`
- Return `{ data: { status, id } }`
- Return 404 if order not found

**Acceptance Criteria:**

- Returns current order status
- Handles Paycrest API errors gracefully

---

### Issue 53 — API: Implement `GET /api/offramp/currencies`

**Description:**
Implement the currencies list route:

- Instantiate `PaycrestAdapter`
- Call `paycrest.getCurrencies()`
- Return `{ data: currencies }` array
- Cache for 5 minutes

**Acceptance Criteria:**

- Returns list of supported fiat currencies
- Includes `code`, `name`, `symbol` for each

---

### Issue 54 — API: Implement `GET /api/offramp/institutions/[currency]`

**Description:**
Implement the institutions list route:

- Accept `currency` path parameter
- Instantiate `PaycrestAdapter`
- Call `paycrest.getInstitutions(currency)`
- Return `{ data: institutions }` array
- Return 400 for unsupported currency

**Acceptance Criteria:**

- Returns banks for NGN
- Returns appropriate error for unsupported currencies

---

### Issue 55 — API: Implement `POST /api/offramp/verify-account`

**Description:**
Implement the account verification route:

- Parse `{ institution, accountIdentifier }` from body
- Instantiate `PaycrestAdapter`
- Call `paycrest.verifyAccount(institution, accountIdentifier)`
- Return `{ data: { accountName } }`
- Return 400 for missing fields

**Acceptance Criteria:**

- Returns account name for valid Nigerian bank accounts
- Returns 400 for missing institution or account number

---

### Issue 56 — API: Implement `POST /api/offramp/quote`

**Description:**
Implement the server-side quote route (alternative to client-side quoting):

- Accept `{ amount, currency, feePaymentMethod }` from body
- Initialize Allbridge SDK, get tokens
- Get bridge quote via `getAllbridgeQuote()`
- Get Paycrest rate
- Compute destination amount with 1% platform fee
- Return full quote object with `quoteId`, `sourceAmount`, `destinationAmount`, `rate`, `estimatedTimeMs`

**Acceptance Criteria:**

- Returns valid quote for 1 USDC → NGN
- Handles Allbridge and Paycrest errors

---

### Issue 57 — API: Implement `POST /api/webhooks/paycrest`

**Description:**
Implement the Paycrest webhook handler:

- Verify webhook signature using `PAYCREST_WEBHOOK_SECRET` (HMAC-SHA256)
- Parse event type from payload
- Map event to `PayoutStatus` using `mapPaycrestStatus()`
- Update `TransactionStorage` if a matching `payoutOrderId` is found (note: server-side storage would require a DB; for now, log the event)
- Return 200 immediately to acknowledge receipt
- Return 401 for invalid signatures

**Acceptance Criteria:**

- Invalid signatures return 401
- Valid events are logged with order ID and status
- Returns 200 within 1 second

---

### Issue 58 — API: Add request timeout handling to all API routes

**Description:**
All API routes that call external services should have explicit timeouts:

- Wrap Allbridge SDK calls with `AbortController` + `setTimeout` (15-30s)
- Wrap Paycrest API calls with 15s timeout (already in `PaycrestAdapter`)
- Wrap Soroban RPC calls with 15s timeout
- Return 504 Gateway Timeout with clear message when timeout fires

**Acceptance Criteria:**

- No API route hangs indefinitely
- Timeout errors return 504 with descriptive message

---

### Issue 59 — API: Add structured error responses across all routes

**Description:**
Standardize error response format across all API routes:

```ts
{ error: string; message?: string; details?: unknown }
```

- `error`: machine-readable error code or short message
- `message`: human-readable description
- `details`: additional context (only in development)
- Never expose stack traces in production

**Acceptance Criteria:**

- All error responses follow the standard format
- Stack traces are hidden in production

---

### Issue 60 — API: Implement in-memory SDK singleton caching

**Description:**
The Allbridge SDK takes 3-5 seconds to initialize. Cache the initialized SDK:

- In `allbridge-adapter.ts`, cache the SDK instance in a module-level variable
- Cache `chainDetailsMap()` result for 5 minutes
- Cache token info for 5 minutes
- Invalidate cache on error

**Acceptance Criteria:**

- Second SDK call returns cached instance immediately
- Cache invalidates after 5 minutes

---

### Issue 61 — API: Add CORS headers for API routes

**Description:**
Configure CORS for API routes that may be called from different origins:

- Add `Access-Control-Allow-Origin` header
- Handle `OPTIONS` preflight requests
- Restrict to known origins in production

**Acceptance Criteria:**

- API routes respond correctly to CORS preflight
- No CORS errors in browser console

---

### Issue 62 — API: Implement rate limiting on sensitive routes

**Description:**
Add basic rate limiting to prevent abuse:

- Limit `/api/offramp/bridge/build-tx` to 10 requests per minute per IP
- Limit `/api/offramp/paycrest/order` to 5 requests per minute per IP
- Return 429 Too Many Requests with `Retry-After` header
- Use in-memory store (or Vercel KV if available)

**Acceptance Criteria:**

- Excessive requests return 429
- Legitimate requests are not blocked

---

### Issue 63 — API: Add request logging middleware

**Description:**
Add structured request logging to all API routes:

- Log: method, path, status code, duration, error (if any)
- Use `console.log` with structured JSON format
- Include request ID for tracing
- Mask sensitive fields (API keys, private keys)

**Acceptance Criteria:**

- All API requests are logged
- Sensitive data is never logged

---

### Issue 64 — API: Implement `GET /api/offramp/bridge/tx-status/[hash]` Soroban RPC polling

**Description:**
Complete the tx-status route using direct Soroban JSON-RPC:

- Call `getTransaction` method on Soroban RPC
- Parse response: `status` field is `"SUCCESS"`, `"FAILED"`, or `"NOT_FOUND"`
- Return simplified `{ status, hash }`
- Do not use the Stellar SDK (avoid version conflicts)
- Set `maxDuration = 10`

**Acceptance Criteria:**

- Returns correct status for a known transaction hash
- Does not import `@stellar/stellar-sdk` (raw JSON-RPC only)

---

### Issue 65 — API: Add `maxDuration` exports to all long-running routes

**Description:**
Vercel serverless functions have a default 10s timeout. Add `export const maxDuration` to routes that need more time:

- `build-tx`: 30s (SDK init + simulation)
- `submit-soroban`: 15s (RPC call)
- `gas-fee-options`: 20s (SDK init)
- `paycrest/order`: 20s (Paycrest API)
- All other routes: 10s (default)

**Acceptance Criteria:**

- No Vercel timeout errors on production
- `maxDuration` is set correctly on each route file

---

## 🌉 BRIDGE INTEGRATION — ALLBRIDGE (Issues 66–78)

---

### Issue 66 — Bridge: Implement `initializeAllbridgeSdk` with correct RPC URLs

**Description:**
Complete `initializeAllbridgeSdk()` in `allbridge-adapter.ts`:

- Import `AllbridgeCoreSdk` and `nodeRpcUrlsDefault` dynamically
- Map env vars: `STELLAR_SOROBAN_RPC_URL` → `SRB`, `STELLAR_HORIZON_URL` → `STLR`
- Support legacy `STELLAR_RPC_URL` fallback (horizon URL → STLR, otherwise → SRB)
- Log the RPC URLs being used
- Return initialized SDK instance

**Critical:** `SRB` must point to Soroban RPC (not Horizon). Pointing `SRB` to Horizon causes 405 errors during `rawTxBuilder.send()`.

**Acceptance Criteria:**

- SDK initializes without errors
- Correct RPC URLs are used for each chain key

---

### Issue 67 — Bridge: Implement `getAllbridgeTokens` — fetch Stellar and Base USDC token info

**Description:**
Complete `getAllbridgeTokens(sdk)`:

- Call `sdk.chainDetailsMap()` to get all chain details
- Extract Stellar chain (`"SRB"`) and find USDC token by `symbol === "USDC"`
- Extract Base chain (`"BAS"`) and find USDC token by `symbol === "USDC"`
- Return `{ stellar: { chain, usdc }, base: { chain, usdc } }`
- Throw if either USDC token is not found

**Acceptance Criteria:**

- Returns valid token objects for both chains
- Token objects include `tokenAddress`, `bridgeAddress`, `decimals`, `allbridgeChainId`

---

### Issue 68 — Bridge: Implement `getAllbridgeQuote` — get bridge receive amount

**Description:**
Complete `getAllbridgeQuote(sdk, sourceToken, destinationToken, amount)`:

- Call `sdk.getAmountToBeReceived(amount, sourceToken, destinationToken)`
- Compute fee as `parseFloat(amount) - parseFloat(amountToBeReceived)`
- Get estimated time via `sdk.getAverageTransferTime(sourceToken, destinationToken, Messenger.ALLBRIDGE)`
- Return `{ receiveAmount, fee, estimatedTime }`

**Acceptance Criteria:**

- Returns valid receive amount for 1 USDC
- Fee is non-negative
- Estimated time is in milliseconds

---

### Issue 69 — Bridge: Implement `buildSwapAndBridgeTx` — Soroban transaction builder

**Description:**
Implement the core Soroban transaction builder in `soroban-tx-builder.ts`:

- Connect to Soroban RPC via `StellarSdk.rpc.Server`
- Load source account
- Convert amount to on-chain integer using `floatToInt(amount, decimals)`
- Encode recipient (EVM address) as 32-byte buffer (left-pad 20-byte address)
- Encode receive token address as 32-byte buffer
- Generate random nonce via `randomBytes(32).readBigInt64BE()` (absolute value)
- Build `swap_and_bridge` contract call using `StellarSdk.contract.Spec` with the ABI spec
- Create `invokeHostFunction` operation
- Build transaction with `TransactionBuilder`
- Simulate with `rpcServer.simulateTransaction(tx)`
- Extend auth entry expiration by +500 ledgers
- Assemble with `rpc.assembleTransaction()` with bumped fee (1.5x of base + minResourceFee)
- Return base64 XDR

**Acceptance Criteria:**

- Returns valid XDR that Freighter can sign
- Simulation succeeds for valid inputs
- Auth expiration is extended

---

### Issue 70 — Bridge: Implement `getAllbridgeGasFee` — select fee payment method

**Description:**
Implement `getAllbridgeGasFee(sdk, sourceToken, destinationToken)`:

- Call `sdk.getGasFeeOptions(sourceToken, destinationToken, Messenger.ALLBRIDGE)`
- Prefer `WITH_STABLECOIN` fee (no extra XLM needed)
- Fall back to `WITH_NATIVE_CURRENCY` if stablecoin fee unavailable
- Return `{ gasAmount: string, feeTokenAmount: string }` where unused fee is `"0"`

**Acceptance Criteria:**

- Returns stablecoin fee when available
- Falls back to native fee correctly

---

### Issue 71 — Bridge: Implement `getAllbridgeGasFeeOptions` — return both fee options for UI

**Description:**
Implement `getAllbridgeGasFeeOptions(sdk, sourceToken, destinationToken)`:

- Return both fee options: `{ native: { int, float }, stablecoin: { int, float } }`
- Use `FeePaymentMethod.WITH_NATIVE_CURRENCY` and `FeePaymentMethod.WITH_STABLECOIN`
- Use `AmountFormat.INT` and `AmountFormat.FLOAT`
- Default to `"0"` if a fee option is unavailable

**Acceptance Criteria:**

- Returns both fee options with int and float representations
- UI can display human-readable fee amounts

---

### Issue 72 — Bridge: Implement `getBridgeFeeForMethod` — select fee by user preference

**Description:**
Implement `getBridgeFeeForMethod(feeOptions, method)`:

- If `method === "stablecoin"`: return `{ gasAmount: "0", feeTokenAmount: feeOptions.stablecoin.int }`
- If `method === "native"`: return `{ gasAmount: feeOptions.native.int, feeTokenAmount: "0" }`

**Acceptance Criteria:**

- Returns correct fee params for each method
- Unused fee is always `"0"`

---

### Issue 73 — Bridge: Implement `getAllbridgeTransferStatus` — poll bridge status

**Description:**
Implement `getAllbridgeTransferStatus(sdk, chainSymbol, txHash)`:

- Call `sdk.getTransferStatus(chainSymbol, txHash)`
- Map Allbridge status strings to `BridgeStatus` type:
  - `"completed"` / `"success"` → `"completed"`
  - `"failed"` / `"error"` → `"failed"`
  - `"processing"` / `"in_progress"` → `"processing"`
  - `"pending"` / `"waiting"` → `"pending"`
  - default → `"pending"`
- Return `{ status, txHash, receiveAmount }`
- On error: return `{ status: "pending", txHash }` (don't throw)

**Acceptance Criteria:**

- Status is correctly mapped for all Allbridge status strings
- Errors return pending status (not throw)

---

### Issue 74 — Bridge: Handle Soroban simulation errors with user-friendly messages

**Description:**
In `build-tx` route, parse common simulation error messages:

- `"resulting balance is not within the allowed range"` → "Insufficient XLM balance for native gas fee. Your remaining XLM would fall below Stellar's minimum account reserve. Switch to USDC fee payment or add more XLM."
- `"contract call failed" + "transfer"` → "A token transfer in the bridge contract failed during simulation. This usually means insufficient balance for the amount + fees."
- Generic simulation error → include raw error message

**Acceptance Criteria:**

- Users see actionable error messages for common failures
- Raw error is still logged server-side

---

### Issue 75 — Bridge: Implement `floatToInt` amount conversion utility

**Description:**
Implement `floatToInt(amount: string, decimals: number): string` in `soroban-tx-builder.ts`:

- Split on decimal point
- Pad fractional part to `decimals` digits
- Truncate fractional part if longer than `decimals`
- Compute: `BigInt(intPart) * 10^decimals + BigInt(fracPart)`
- Return as string

Example: `floatToInt("10.5", 7)` → `"105000000"`

**Acceptance Criteria:**

- Correct conversion for amounts with 0-7 decimal places
- No floating point precision errors

---

### Issue 76 — Bridge: Implement nonce generation for `swap_and_bridge`

**Description:**
Implement `getNonceBigInt()` in `soroban-tx-builder.ts`:

- Generate 32 random bytes via Node.js `crypto.randomBytes(32)`
- Read as BigInt64 (big-endian)
- Return absolute value (negate if negative)

**Acceptance Criteria:**

- Returns a positive BigInt
- Different value on each call

---

### Issue 77 — Bridge: Implement auth entry expiration extension

**Description:**
In `buildSwapAndBridgeTx`, after simulation:

- Check if `simSuccess.result?.auth` exists
- For each auth entry with `sorobanCredentialsAddress` credentials:
  - Get current `signatureExpirationLedger`
  - Set to `latestLedger + 500` (approximately 40 minutes)
  - Log old and new expiration values
- Pass modified auth entries to `assembleTransaction`

**Acceptance Criteria:**

- Auth entries have extended expiration after build
- Users have ~40 minutes to sign without expiry

---

### Issue 78 — Bridge: Implement transaction fee bumping before assembly

**Description:**
In `buildSwapAndBridgeTx`, compute and apply bumped fee:

- Get `originalFee` from initial `TransactionBuilder` (BASE_FEE)
- Get `simMinFee` from `simSuccess.minResourceFee`
- Compute `targetFee = ceil((originalFee + simMinFee) * 1.5)`
- Compute `preAssemblyFee = max(targetFee - simMinFee, originalFee)`
- Mutate `tx._fee = preAssemblyFee.toString()` before calling `assembleTransaction`
- Log all fee values

**Acceptance Criteria:**

- Final transaction fee is approximately 1.5x the minimum required
- Transaction is not rejected for insufficient fee

---

## 💳 PAYCREST INTEGRATION (Issues 79–88)

---

### Issue 79 — Paycrest: Implement `PaycrestAdapter` — HTTP client with auth

**Description:**
Complete `PaycrestAdapter` in `paycrest-adapter.ts`:

- Private `fetch<T>(endpoint, options)` method:
  - Prepend `https://api.paycrest.io/v1` to endpoint
  - Add `"API-Key": this.apiKey` header
  - Add `"Content-Type": "application/json"` header
  - 15s `AbortController` timeout
  - On non-OK response: parse error JSON, throw `PaycrestHttpError(message, status, details)`
  - On network error: throw `PaycrestHttpError` with 502 status
  - On timeout: throw `PaycrestHttpError` with 504 status
  - Return `data.data || data` from response

**Acceptance Criteria:**

- All Paycrest API calls use this method
- Errors include HTTP status code for correct response mapping

---

### Issue 80 — Paycrest: Implement `PaycrestAdapter.createOrder`

**Description:**
Implement `createOrder(request: PayoutOrderRequest)`:

- POST to `/sender/orders`
- Request body: `{ amount, token, rate, network, recipient, reference, returnAddress }`
- `recipient` includes: `institution`, `accountIdentifier`, `accountName`, `memo`, `metadata`, `currency`
- Return `PayoutOrderResponse` with `id`, `receiveAddress`, `amount`, `senderFee`, `transactionFee`, `validUntil`, `status`

**Acceptance Criteria:**

- Creates a real order on Paycrest mainnet
- Returns `receiveAddress` (Base USDC address for bridge destination)

---

### Issue 81 — Paycrest: Implement `PaycrestAdapter.getOrderStatus`

**Description:**
Implement `getOrderStatus(orderId)`:

- GET `/sender/orders/{orderId}`
- Return `{ status: PayoutStatus, id: string }`
- Map response status to `PayoutStatus` type

**Acceptance Criteria:**

- Returns current order status
- Status is one of the defined `PayoutStatus` values

---

### Issue 82 — Paycrest: Implement `PaycrestAdapter.getRate`

**Description:**
Implement `getRate(token, amount, currency, options?)`:

- GET `/rates/{token}/{amount}/{currency}?network={network}&provider_id={providerId}`
- Parse response: `data` field may be string or number
- Return parsed float rate
- Throw if rate is not finite

**Acceptance Criteria:**

- Returns valid NGN/USDC rate
- Throws on invalid response

---

### Issue 83 — Paycrest: Implement `PaycrestAdapter.getCurrencies` and `getInstitutions`

**Description:**
Implement:

- `getCurrencies()`: GET `/currencies`, return array of `{ code, name, symbol }`
- `getInstitutions(currency)`: GET `/institutions/{currency}`, return array of `{ code, name }`

**Acceptance Criteria:**

- Returns NGN in currencies list
- Returns Nigerian banks for NGN

---

### Issue 84 — Paycrest: Implement `PaycrestAdapter.verifyAccount`

**Description:**
Implement `verifyAccount(institution, accountIdentifier)`:

- POST `/verify-account` with `{ institution, accountIdentifier }`
- Extract account name from `result.accountName || result.data`
- Return account name string

**Acceptance Criteria:**

- Returns account name for valid GTBank account
- Returns empty string for invalid account

---

### Issue 85 — Paycrest: Implement `mapPaycrestStatus` webhook status mapper

**Description:**
Implement `mapPaycrestStatus(webhookStatus: string): PayoutStatus`:

- `"payment_order.pending"` → `"pending"`
- `"payment_order.validated"` → `"validated"`
- `"payment_order.settled"` → `"settled"`
- `"payment_order.refunded"` → `"refunded"`
- `"payment_order.expired"` → `"expired"`
- default → `"pending"`

**Acceptance Criteria:**

- All Paycrest webhook event types are mapped correctly

---

### Issue 86 — Paycrest: Implement webhook signature verification

**Description:**
In `/api/webhooks/paycrest/route.ts`:

- Read `X-Paycrest-Signature` header
- Compute HMAC-SHA256 of raw request body using `PAYCREST_WEBHOOK_SECRET`
- Compare signatures using `crypto.timingSafeEqual` (prevent timing attacks)
- Return 401 if signature doesn't match
- Parse event body and log `{ eventType, orderId, status }`

**Acceptance Criteria:**

- Invalid signatures return 401
- Valid signatures are processed
- Timing-safe comparison used

---

### Issue 87 — Paycrest: Handle Paycrest order amount normalization

**Description:**
Before creating a Paycrest order, normalize the amount:

- Floor to 6 decimal places: `Math.floor(amount * 1e6) / 1e6`
- Do NOT use `toFixed(6)` which can round UP (causing bridge deposit < order amount)
- Normalize rate to 6 decimal places: `Number(rate.toFixed(6))`
- Log normalized values

**Acceptance Criteria:**

- Normalized amount is always ≤ bridge receive amount
- No Paycrest order failures due to amount mismatch

---

### Issue 88 — Paycrest: Add `PaycrestHttpError` custom error class

**Description:**
Implement `PaycrestHttpError` in `paycrest-adapter.ts`:

```ts
class PaycrestHttpError extends Error {
  status: number;
  details: unknown;
  constructor(message: string, status: number, details?: unknown) { ... }
}
```

- Used throughout `PaycrestAdapter` for typed error handling
- API routes check `error.status` to return correct HTTP status code

**Acceptance Criteria:**

- All Paycrest errors are instances of `PaycrestHttpError`
- HTTP status is preserved through the error chain

---

## 🧪 TESTING (Issues 89–103)

---

### Issue 89 — Testing: Set up Jest and React Testing Library

**Description:**
Configure the testing infrastructure:

- Install: `jest`, `@testing-library/react`, `@testing-library/user-event`, `jest-environment-jsdom`, `ts-jest`
- Add `jest.config.ts` with Next.js preset
- Add `jest.setup.ts` with `@testing-library/jest-dom` matchers
- Add `"test": "jest"` script to `package.json`
- Configure module name mapper for `@/*` path alias

**Acceptance Criteria:**

- `npm test` runs without errors
- A simple smoke test passes

---

### Issue 90 — Testing: Unit tests for `TransactionStorage`

**Description:**
Write unit tests for all `TransactionStorage` methods:

- `save()`: saves transaction, prepends to array, trims to 50
- `update()`: updates existing transaction by id
- `getAll()`: returns empty array when localStorage is empty
- `getByUser()`: filters by address (case-insensitive)
- `getById()`: returns correct transaction
- `clear()`: removes all transactions
- `generateId()`: returns unique IDs
- Mock `localStorage` using `jest-localstorage-mock` or manual mock

**Acceptance Criteria:**

- All methods have at least one passing test
- Edge cases covered (empty storage, missing id)

---

### Issue 91 — Testing: Unit tests for `validateAmount`, `validateAddress`, `validateToken`

**Description:**
Write unit tests for all validation utilities:

- `validateAmount`: valid floats, zero, negative, NaN, Infinity, empty string
- `validateAddress("stellar")`: valid G-key, invalid length, wrong prefix
- `validateAddress("base")`: valid 0x address, wrong length, missing 0x
- `validateToken`: USDC, USDT, lowercase, invalid token

**Acceptance Criteria:**

- All edge cases covered
- 100% branch coverage for validation functions

---

### Issue 92 — Testing: Unit tests for `pollWithTimeout`

**Description:**
Write unit tests for `pollWithTimeout`:

- Resolves when condition is met on first attempt
- Resolves when condition is met after N attempts
- Throws `"Polling timeout exceeded"` after timeout
- Calls `onProgress` callback on each attempt
- Uses fake timers (`jest.useFakeTimers()`)

**Acceptance Criteria:**

- Timeout behavior is tested without real delays
- Progress callback is called correct number of times

---

### Issue 93 — Testing: Unit tests for `floatToInt` and `getNonceBigInt`

**Description:**
Write unit tests for Soroban utility functions:

- `floatToInt("10.5", 7)` → `"105000000"`
- `floatToInt("1", 7)` → `"10000000"`
- `floatToInt("0.0000001", 7)` → `"1"`
- `floatToInt("10.12345678", 7)` → truncates to 7 decimals
- `getNonceBigInt()`: returns positive BigInt, different values on each call

**Acceptance Criteria:**

- All conversion cases pass
- Nonce is always positive

---

### Issue 94 — Testing: Unit tests for `mapPaycrestStatus`

**Description:**
Write unit tests for `mapPaycrestStatus`:

- All known event types map to correct `PayoutStatus`
- Unknown event type maps to `"pending"`

**Acceptance Criteria:**

- All 5 known statuses tested
- Default case tested

---

### Issue 95 — Testing: Unit tests for `cn` utility

**Description:**
Write unit tests for the `cn` class name utility:

- Joins multiple strings
- Filters out `false`, `null`, `undefined`
- Returns empty string for all falsy inputs
- Handles single string

**Acceptance Criteria:**

- All cases pass

---

### Issue 96 — Testing: Component tests for `Header`

**Description:**
Write React Testing Library tests for `Header`:

- Renders "CONNECT WALLET" button when disconnected
- Renders truncated address when connected
- Renders "CONNECTING..." when connecting
- Shows balance lines when connected
- Calls `onConnect` when button clicked (disconnected state)
- Calls `onDisconnect` when button clicked (connected state)
- Button is disabled when `isConnecting`

**Acceptance Criteria:**

- All interaction tests pass
- No accessibility violations

---

### Issue 97 — Testing: Component tests for `ProgressSteps`

**Description:**
Write tests for `ProgressSteps`:

- Step 01 shows "CONNECT WALLET" when not connected
- Step 01 shows "CONNECTED ✓" when connected
- Step 02 shows "SIGNATURE PENDING" when connecting
- Active step has gold background class
- All 3 steps always render

**Acceptance Criteria:**

- All state combinations tested

---

### Issue 98 — Testing: Component tests for `TransactionProgressModal`

**Description:**
Write tests for `TransactionProgressModal`:

- Does not render when `isOpen` is false
- Renders all 5 steps
- Current step shows spinner
- Past steps show checkmark
- Success state shows success message
- Error state shows error message
- Close button only appears in terminal states
- `onClose` called when close button clicked

**Acceptance Criteria:**

- All step states tested
- Modal accessibility (role="dialog") verified

---

### Issue 99 — Testing: Integration test for `POST /api/offramp/bridge/build-tx`

**Description:**
Write integration tests for the build-tx route using `jest` and mocked dependencies:

- Mock `initializeAllbridgeSdk` and `getAllbridgeTokens`
- Mock `buildSwapAndBridgeTx` to return a fake XDR
- Test: valid request returns `{ xdr, sourceToken, destinationToken }`
- Test: invalid amount returns 400
- Test: invalid Stellar address returns 400
- Test: invalid Base address returns 400
- Test: SDK error returns 500 with user-friendly message

**Acceptance Criteria:**

- All test cases pass with mocked dependencies

---

### Issue 100 — Testing: Integration test for `POST /api/offramp/paycrest/order`

**Description:**
Write integration tests for the Paycrest order route:

- Mock `PaycrestAdapter.createOrder`
- Test: valid payload creates order and returns `{ data: { id, receiveAddress } }`
- Test: missing `amount` returns 400
- Test: missing `recipient.institution` returns 400
- Test: Paycrest API error returns correct HTTP status
- Test: missing `PAYCREST_API_KEY` returns 500

**Acceptance Criteria:**

- All validation cases tested
- Error propagation from adapter tested

---

### Issue 101 — Testing: Integration test for `POST /api/webhooks/paycrest`

**Description:**
Write tests for the webhook handler:

- Test: valid signature processes event and returns 200
- Test: invalid signature returns 401
- Test: missing signature header returns 401
- Test: valid `payment_order.settled` event is logged correctly

**Acceptance Criteria:**

- Signature verification logic is tested
- All event types handled

---

### Issue 102 — Testing: E2E test setup with Playwright

**Description:**
Set up Playwright for end-to-end testing:

- Install `@playwright/test`
- Add `playwright.config.ts` targeting `http://localhost:3000`
- Write a basic smoke test: page loads, title is correct, "CONNECT WALLET" button is visible
- Add `"test:e2e": "playwright test"` script

**Acceptance Criteria:**

- Playwright installs and runs
- Smoke test passes against dev server

---

### Issue 103 — Testing: E2E test for wallet connect flow (mock wallet)

**Description:**
Write a Playwright test that simulates the wallet connect flow:

- Mock `window.freighter` with a fake implementation
- Click "CONNECT WALLET" button
- Verify modal or connecting state appears
- Verify wallet address appears in header after mock connect
- Verify USDC balance is fetched (mock Horizon API)

**Acceptance Criteria:**

- Connect flow works end-to-end in browser
- No real wallet extension required

---

## 🚀 DEVOPS & DEPLOYMENT (Issues 104–110)

---

### Issue 104 — DevOps: Configure Vercel deployment

**Description:**
Set up Vercel deployment for the project:

- Add `vercel.json` with function timeout overrides for long-running routes
- Configure environment variables in Vercel dashboard (document which vars are needed)
- Set `NODE_ENV=production` in Vercel
- Configure build command: `npm run build`
- Configure output directory: `.next`
- Add deployment preview for PRs

**Acceptance Criteria:**

- App deploys successfully to Vercel
- All API routes work in production
- Environment variables are set correctly

---

### Issue 105 — DevOps: Add Docker support for self-hosting

**Description:**
Add Docker configuration for self-hosted deployments:

- `Dockerfile`: multi-stage build (deps → builder → runner)
- Use `output: 'standalone'` in `next.config.ts`
- `docker-compose.yml`: app service with env file
- `.dockerignore`: exclude `node_modules`, `.next`, `.env.local`
- Document Docker deployment in README

**Acceptance Criteria:**

- `docker build` succeeds
- `docker run` starts the app on port 3000
- Environment variables are passed via `--env-file`

---

### Issue 106 — DevOps: Add GitHub Actions deployment workflow

**Description:**
Add `.github/workflows/deploy.yml`:

- Trigger on push to `main`
- Run CI checks first (lint, build, test)
- Deploy to Vercel using `vercel` CLI and `VERCEL_TOKEN` secret
- Send deployment notification (optional)

**Acceptance Criteria:**

- Successful CI triggers deployment
- Failed CI blocks deployment

---

### Issue 107 — DevOps: Add `dependabot.yml` for dependency updates

**Description:**
Add `.github/dependabot.yml`:

- Weekly npm dependency updates
- Weekly GitHub Actions updates
- Group minor/patch updates together
- Ignore major version bumps for `@stellar/stellar-sdk` and `@allbridge/bridge-core-sdk` (breaking changes)

**Acceptance Criteria:**

- Dependabot PRs are created weekly
- Major version bumps require manual review

---

### Issue 108 — DevOps: Add bundle size analysis

**Description:**
Add bundle size monitoring:

- Install `@next/bundle-analyzer`
- Add `ANALYZE=true npm run build` script
- Document bundle size baseline in README
- Add CI check that fails if bundle size increases by >10%

**Acceptance Criteria:**

- Bundle analysis report generated on build
- Large dependencies identified and documented

---

### Issue 109 — DevOps: Configure error monitoring (Sentry)

**Description:**
Add Sentry error monitoring:

- Install `@sentry/nextjs`
- Run `npx @sentry/wizard@latest -i nextjs`
- Configure `sentry.client.config.ts` and `sentry.server.config.ts`
- Add `SENTRY_DSN` to env vars
- Capture unhandled errors in API routes
- Add source maps upload in CI

**Acceptance Criteria:**

- Errors appear in Sentry dashboard
- Source maps are uploaded for readable stack traces

---

### Issue 110 — DevOps: Add health check endpoint

**Description:**
Add `GET /api/health` route:

- Returns `{ status: "ok", timestamp: ISO string, version: package.json version }`
- Check Allbridge SDK can initialize (optional, with timeout)
- Check Paycrest API is reachable (optional, with timeout)
- Return 200 if healthy, 503 if degraded

**Acceptance Criteria:**

- Returns 200 with status object
- Used by Vercel/Docker health checks

---

## ✨ ENHANCEMENTS (Issues 111–120)

---

### Issue 111 — Enhancement: Add multi-currency support beyond NGN

**Description:**
Extend the offramp to support currencies beyond NGN:

- Update `RecentOfframpsTable` column header to show dynamic currency name
- Update `RightPanel` to format payout in selected currency
- Update `FormCard` to show correct currency prefix in quote suffix
- Test with KES (Kenya), GHS (Ghana), ZAR (South Africa) if supported by Paycrest
- Update `validateCurrency` to accept all Paycrest-supported currencies

**Acceptance Criteria:**

- Switching currency updates all UI elements
- Payout amount formatted correctly for each currency

---

### Issue 112 — Enhancement: Add transaction detail view / history page

**Description:**
Create a transaction history page at `/history`:

- List all transactions from `TransactionStorage.getByUser()`
- Show: date, amount, currency, status, tx hash (linked to Stellar Explorer)
- Filter by status
- "Clear History" button
- Empty state for new users
- Link from "VIEW ALL" button in `RecentOfframpsTable`

**Acceptance Criteria:**

- All user transactions are listed
- Stellar Explorer links work
- History persists across page refreshes

---

### Issue 113 — Enhancement: Add Stellar Explorer links for transaction hashes

**Description:**
Make transaction hashes clickable throughout the UI:

- In `RecentOfframpsTable`: link TX HASH to `https://stellar.expert/explorer/public/tx/{hash}`
- In `TransactionProgressModal`: show link after successful submission
- In transaction history page: link all hashes
- Open in new tab with `rel="noopener noreferrer"`

**Acceptance Criteria:**

- All tx hashes are clickable links
- Links open correct Stellar Explorer page

---

### Issue 114 — Enhancement: Add copy-to-clipboard for wallet address and tx hashes

**Description:**
Add copy functionality:

- In Header: click on truncated wallet address to copy full address
- In transaction history: click tx hash to copy
- Show brief "Copied!" tooltip after copying
- Use `navigator.clipboard.writeText()` with fallback

**Acceptance Criteria:**

- Copy works in modern browsers
- Visual feedback shown after copy

---

### Issue 115 — Enhancement: Add dark/light mode toggle

**Description:**
Add theme switching:

- Default: dark mode (current design)
- Light mode: invert color scheme
- Store preference in `localStorage`
- Toggle button in Header
- Use CSS custom properties for all colors (already done)
- Update `globals.css` with light mode overrides via `[data-theme="light"]`

**Acceptance Criteria:**

- Theme persists across page refreshes
- All components look correct in both themes

---

### Issue 116 — Enhancement: Add toast notification system

**Description:**
Add a lightweight toast notification system:

- `src/components/ui/Toast.tsx`: positioned top-right, auto-dismiss after 4s
- Types: success (green), error (red), info (blue), warning (yellow)
- Used for: wallet connect success, copy confirmation, non-blocking errors
- Max 3 toasts visible at once
- Accessible: `role="alert"`, `aria-live="polite"`

**Acceptance Criteria:**

- Toasts appear and auto-dismiss
- Multiple toasts stack correctly
- Accessible to screen readers

---

### Issue 117 — Enhancement: Add keyboard navigation and accessibility audit

**Description:**
Audit and fix accessibility issues:

- All interactive elements are keyboard-focusable
- Focus ring visible on all buttons and inputs
- `aria-label` on icon-only buttons
- `aria-disabled` on disabled buttons (not just `disabled` attribute)
- Color contrast ratio ≥ 4.5:1 for all text
- `TransactionProgressModal` traps focus when open
- Run `axe-core` audit and fix all violations

**Acceptance Criteria:**

- Zero axe-core violations
- Full keyboard navigation works

---

### Issue 118 — Enhancement: Add PWA support (Progressive Web App)

**Description:**
Make the app installable as a PWA:

- Add `public/manifest.json` with app name, icons, theme color
- Add service worker via `next-pwa` or manual implementation
- Cache static assets
- Add `<link rel="manifest">` in `layout.tsx`
- Add Apple touch icon

**Acceptance Criteria:**

- App is installable on mobile
- Lighthouse PWA score ≥ 80

---

### Issue 119 — Enhancement: Add real-time FX rate ticker in Header

**Description:**
Add a live FX rate display in the Header:

- Fetch current USDC/NGN rate from Paycrest every 30 seconds
- Display as a chip: "LIVE RATE: ₦1,598 / USDC"
- Animate on update (brief flash)
- Show "—" while loading
- Stop polling when tab is not visible (`document.visibilityState`)

**Acceptance Criteria:**

- Rate updates every 30 seconds
- No polling when tab is hidden
- Smooth update animation

---

### Issue 120 — Enhancement: Add comprehensive README with architecture diagram

**Description:**
Rewrite `README.md` to be production-quality:

- Project overview with screenshot/GIF
- Architecture diagram (Mermaid or image) showing: Stellar → Allbridge → Base → Paycrest → Bank
- Complete setup guide (clone, install, env, run)
- API reference table (all routes with method, path, description, request/response)
- Tech stack with version numbers
- Flow diagram for the 7-step offramp process
- Troubleshooting section for common errors
- Contributing guide link
- Contact: Telegram [t.me/Xoulomon](https://t.me/Xoulomon)
- License badge

**Acceptance Criteria:**

- README is comprehensive and accurate
- Architecture diagram is included
- All API routes are documented

---

## Summary

| Area                 | Issues  | Count   |
| -------------------- | ------- | ------- |
| Project Setup        | 1–8     | 8       |
| Frontend UI          | 9–20    | 12      |
| Wallet & Auth        | 21–30   | 10      |
| Offramp Flow         | 31–45   | 15      |
| Backend API          | 46–65   | 20      |
| Bridge (Allbridge)   | 66–78   | 13      |
| Paycrest Integration | 79–88   | 10      |
| Testing              | 89–103  | 15      |
| DevOps               | 104–110 | 7       |
| Enhancements         | 111–120 | 10      |
| **Total**            |         | **120** |

---

_Need clarification or have questions? Reach out on Telegram: [t.me/Xoulomon](https://t.me/Xoulomon)_
