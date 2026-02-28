# Security Policy

## Table of Contents

- [Supported Versions](#supported-versions)
- [Private Key Handling](#private-key-handling)
- [API Key Security](#api-key-security)
- [Transaction Validation](#transaction-validation)
- [Input Sanitization](#input-sanitization)
- [Security Audit Checklist](#security-audit-checklist)
- [Reporting a Vulnerability](#reporting-a-vulnerability)

---

## Supported Versions

| Version | Supported |
|---------|-----------|
| `main`  | ✅ Active  |

Only the latest commit on `main` is actively maintained. Please update before reporting issues.

---

## Private Key Handling

Stellar-Spend is a **non-custodial** application. Private keys are **never** accessed, stored, or transmitted by this application.

### How it works

- All transaction signing is delegated entirely to the **Freighter Wallet** browser extension.
- The app constructs an unsigned transaction (XDR), passes it to Freighter via the Freighter JS API, and receives back a signed XDR — **the private key never leaves the user's device**.
- No seed phrases or secret keys are ever requested by the UI.

### Developer guidelines

- **Never** add any input field or form that requests a user's secret key or seed phrase.
- **Never** log transaction objects that might contain signing metadata.
- If integrating a new wallet adapter, verify it follows the same pattern of in-extension signing.
- Do not store `publicKey` values in `localStorage` beyond the active session without explicit user consent.

```ts
// ✅ Correct — let Freighter sign
const signedXdr = await signTransaction(unsignedXdr, { networkPassphrase });

// ❌ Never do this
const keypair = StellarSdk.Keypair.fromSecret(userSecretKey);
```

---

## API Key Security

Stellar-Spend integrates with the **Paycrest API** and **Allbridge Core SDK**, both of which require API credentials.

### Rules

- All API keys must be stored in environment variables and **never** hard-coded in source files.
- The `.env.example` file must contain placeholder values only — never real credentials.
- API keys used server-side (e.g., Paycrest) must never be bundled into the client-side build.
- Vite's `import.meta.env` exposes variables prefixed with `VITE_` to the browser — **do not prefix server-only secrets with `VITE_`**.

### Environment variable usage

```bash
# .env.example — placeholders only
VITE_ALLBRIDGE_API_URL=https://allbridge-api-url
PAYCREST_API_KEY=your_paycrest_api_key_here   # server-side only, no VITE_ prefix
```

```ts
// ✅ Safe — server-side only key
const paycrestKey = process.env.PAYCREST_API_KEY;

// ❌ Unsafe — exposed to browser bundle
const paycrestKey = import.meta.env.VITE_PAYCREST_API_KEY;
```

### Rotation policy

- Rotate API keys immediately if a key is accidentally committed to the repository.
- Use GitHub's secret scanning alerts to catch leaked keys early.
- Revoke compromised keys via the respective provider dashboards (Paycrest, Allbridge) before rotating.

---

## Transaction Validation

All transactions involving token transfers on Stellar must be validated before submission.

### Amount validation

- Validate that amounts are positive numbers with a maximum of **7 decimal places** (Stellar's precision limit).
- Enforce minimum and maximum transfer limits as defined by the off-ramp provider.
- Never trust amounts returned from the UI without re-validating on the service/API layer.

```ts
function isValidStellarAmount(amount: string): boolean {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) return false;
  const decimals = amount.split('.')[1];
  return !decimals || decimals.length <= 7;
}
```

### Transaction construction

- Always verify the **source account**, **sequence number**, and **network passphrase** before signing.
- Use `StellarSdk.Networks.PUBLIC` for mainnet and `StellarSdk.Networks.TESTNET` for testnet — never mix them.
- Validate that the **destination account** exists on the network before sending (use `loadAccount`).
- Always set a reasonable **fee** — use `fetchBaseFee()` and apply a multiplier for congestion.

```ts
const fee = await server.fetchBaseFee();
const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
  fee: String(fee * 2),  // 2x base fee for reliability
  networkPassphrase: StellarSdk.Networks.PUBLIC,
})
```

### Post-submission

- Always store and display the transaction hash so users can verify on a Stellar explorer.
- Handle `tx_bad_seq` errors by refreshing the account sequence number and retrying once.
- Do **not** retry failed transactions automatically without user confirmation.

---

## Input Sanitization

All user-supplied inputs must be sanitized before being used in API calls, transaction construction, or display.

### General rules

- Treat all user inputs as untrusted strings.
- Validate types, ranges, and formats before use.
- Use allowlists (not denylists) for accepted characters where possible.

### Specific fields

| Field | Validation rule |
|---|---|
| Transfer amount | Positive number, max 7 decimal places, within min/max limits |
| Stellar public key | Must match `/^G[A-Z2-7]{55}$/` |
| Bank account number | Alphanumeric only, length per region standard |
| Currency code | Must be in a predefined allowlist (e.g., `["NGN", "GHS", "KES"]`) |
| Token symbol | Must be in a predefined allowlist (e.g., `["USDC", "USDT", "AQUA"]`) |

```ts
const ALLOWED_TOKENS = ["USDC", "USDT", "AQUA"] as const;
const ALLOWED_CURRENCIES = ["NGN", "GHS", "KES"] as const;

if (!ALLOWED_TOKENS.includes(token)) {
  throw new Error("Invalid token selected");
}
```

### XSS prevention

- Never render raw user input as HTML.
- When displaying account addresses or payment references, use text nodes or safely escape output.
- Avoid `dangerouslySetInnerHTML` in React components unless absolutely necessary and always sanitize with `DOMPurify` if used.

---

## Security Audit Checklist

Use this checklist before every major release or PR that touches financial or auth logic.

### Environment & secrets
- [ ] No API keys or secrets are hard-coded in any source file
- [ ] `.env` is listed in `.gitignore` and not tracked
- [ ] `.env.example` contains only placeholder values
- [ ] Server-only secrets are not prefixed with `VITE_`

### Private key & wallet
- [ ] No UI element requests a secret key or seed phrase
- [ ] Transaction signing goes exclusively through Freighter
- [ ] No private key material is logged anywhere

### Transaction security
- [ ] Amounts are validated before transaction construction
- [ ] Network passphrase is set correctly (mainnet vs testnet)
- [ ] Destination accounts are verified to exist on-chain
- [ ] Transaction fees are dynamically fetched, not hard-coded

### Input handling
- [ ] All user inputs are validated by type, format, and range
- [ ] Token and currency values are checked against allowlists
- [ ] No raw user input is rendered as HTML

### Rust smart contracts (`/contracts`)
- [ ] Integer arithmetic uses checked/saturating math to prevent overflow
- [ ] Authorization is validated per function entry point
- [ ] All panics are intentional and documented
- [ ] Dependencies are pinned and audited with `cargo audit`

### Dependency hygiene
- [ ] `npm audit` passes with no critical/high vulnerabilities
- [ ] `cargo audit` passes with no critical/high vulnerabilities
- [ ] No dependency fetches resources from untrusted domains at runtime

---

## Reporting a Vulnerability

We take security seriously. If you discover a vulnerability in Stellar-Spend, please follow responsible disclosure.

### How to report

**Do not** open a public GitHub issue for security vulnerabilities.

Use GitHub's private security advisory feature:
1. Go to the [Security tab](https://github.com/Lex-Studios/Stellar-Spend/security/advisories)
2. Click **"New draft security advisory"**
3. Fill in the details and submit

### What to include

- A clear description of the vulnerability
- Steps to reproduce it
- The potential impact (e.g., fund loss, data exposure)
- Any suggested fix if you have one