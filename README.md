# Stellar-Spend

[![CI](https://github.com/whiteghost0001/Stellar-Spend/workflows/CI/badge.svg)](https://github.com/whiteghost0001/Stellar-Spend/actions)

<h4>Convert your Stellar stablecoins to fiat currencies seamlessly</h4>

🚀 A modern off-ramp solution that enables users to convert Stellar stablecoins (USDC, USDT) directly to fiat currencies through Allbridge and Paycrest integrations.

⚙️ Built using Next.js 15, Stellar SDK, Freighter/Lobstr Wallet, Viem, Allbridge Core SDK, and Paycrest API.

## Key Features

- ✅ **Multi-Currency Support**: Convert to various fiat currencies
- 💱 **Real-time Exchange Rates**: Live conversion rates
- 🔄 **Seamless Cross-Chain**: Allbridge for Stellar → Base transfers
- 🏦 **Bank Direct Transfers**: Direct to beneficiary accounts
- 💰 **Multiple Token Support**: USDC, USDT on Stellar
- 🌍 **Global Coverage**: Multiple regions supported
- 🔐 **Secure Transactions**: Non-custodial solution
- 🎯 **Dual Input Mode**: Crypto or fiat input
- 📊 **Real-time Calculations**: Automatic fee calculations
- 🔍 **Order Tracking**: Real-time status monitoring
- 📱 **Responsive Design**: Desktop and mobile

## Tech Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Stellar SDK + Freighter/Lobstr API
- Allbridge Bridge Core SDK
- viem (Base chain transfer)
- Paycrest API (fiat payout)

## Flow

1. User connects Stellar wallet (Freighter auto-detect, Lobstr fallback)
2. User enters amount + beneficiary bank details
3. App fetches quote and locks FX rate
4. App builds and signs Stellar bridge transaction (XDR)
5. Stellar tx submitted → bridge status polled
6. Server executes Base USDC transfer + Paycrest payout order
7. Payout status polled until terminal state

## API Routes

| Method | Route                                  | Description               |
| ------ | -------------------------------------- | ------------------------- |
| POST   | `/api/offramp/quote`                   | Get conversion quote      |
| GET    | `/api/offramp/currencies`              | Supported fiat currencies |
| GET    | `/api/offramp/institutions/[currency]` | Banks for currency        |
| POST   | `/api/offramp/verify-account`          | Verify beneficiary        |
| POST   | `/api/offramp/execute-payout`          | Execute payout            |
| GET    | `/api/offramp/status/[orderId]`        | Poll payout status        |
| POST   | `/api/offramp/bridge/build-tx`         | Build bridge XDR          |
| GET    | `/api/offramp/bridge/status/[txHash]`  | Poll bridge status        |
| POST   | `/api/webhooks/paycrest`               | Paycrest webhook          |

## Getting Started

### 1. Install

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

### 3. Fill in `.env.local`

Use the inline comments in `.env.example` as the source of truth. The required values are:

- `PAYCREST_API_KEY`: server-only Paycrest API key from the Paycrest dashboard
- `PAYCREST_WEBHOOK_SECRET`: server-only Paycrest webhook signing secret
- `BASE_PRIVATE_KEY`: server-only private key for the Base payout wallet
- `BASE_RETURN_ADDRESS`: public Base address used for returns or treasury routing
- `BASE_RPC_URL`: Base RPC provider URL
- `STELLAR_SOROBAN_RPC_URL`: server-side Soroban RPC endpoint
- `STELLAR_HORIZON_URL`: server-side Horizon endpoint
- `NEXT_PUBLIC_STELLAR_SOROBAN_RPC_URL`: browser-safe Soroban RPC endpoint
- `NEXT_PUBLIC_BASE_RETURN_ADDRESS`: browser-safe Base return address
- `NEXT_PUBLIC_STELLAR_USDC_ISSUER`: Stellar USDC issuer account used to filter the correct Horizon trustline

### 4. Keep secrets server-only

Do not prefix secrets with `NEXT_PUBLIC_`.

- `PAYCREST_API_KEY` must never become `NEXT_PUBLIC_PAYCREST_API_KEY`
- `BASE_PRIVATE_KEY` must never become `NEXT_PUBLIC_BASE_PRIVATE_KEY`

The app validates this at startup and throws a clear error if required env vars are missing or if a secret is exposed publicly.

### 5. Run

```bash
npm run dev
```

Open `http://localhost:3001`.

## Storage

Transaction history is stored in browser `localStorage` (no database required).

- Key: `stellar_spend_transactions`
- Max records: 50
- Scoped by connected wallet address

## License

MIT License

---

## Contact

Need clarification or have questions? Reach out on Telegram: [t.me/Xoulomon](https://t.me/Xoulomon)

---

**Built with ❤️ for the Stellar ecosystem**
