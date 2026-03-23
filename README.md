# Stellar-Spend

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

### 2. Configure env

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

- `PAYCREST_API_KEY`
- `PAYCREST_WEBHOOK_SECRET`
- `BASE_PRIVATE_KEY`
- `BASE_RETURN_ADDRESS`
- `BASE_RPC_URL` (defaults to `https://mainnet.base.org`)
- `STELLAR_SOROBAN_RPC_URL`
- `STELLAR_HORIZON_URL`
- `NEXT_PUBLIC_BASE_RETURN_ADDRESS`

### 3. Run

```bash
npm run dev
```

Open `http://localhost:3000`.

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
