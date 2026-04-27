import type { HelpTopic } from "@/components/HelpModal";

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    content: `Welcome to Stellar-Spend! Here's how to get started:

1. Connect your Stellar wallet (Freighter or Lobstr)
2. Enter the amount of USDC you want to convert
3. Select your destination currency and bank
4. Review the exchange rate and fees
5. Confirm the transaction in your wallet
6. Your funds will be settled to your bank account

The entire process typically takes 5-15 minutes.`,
    keywords: ["start", "begin", "first time", "setup"],
  },
  {
    id: "wallet-connection",
    title: "Connecting Your Wallet",
    content: `To connect your wallet:

1. Click "CONNECT WALLET" button
2. Choose between Freighter or Lobstr
3. Approve the connection in your wallet extension
4. Your wallet address will appear in the header

Make sure you have:
- At least 0.7 USDC for the minimum transaction
- Enough XLM for network fees (if paying in XLM)
- Your wallet set to Mainnet (not Testnet)`,
    keywords: ["wallet", "connect", "freighter", "lobstr", "extension"],
  },
  {
    id: "exchange-rate",
    title: "Understanding Exchange Rates",
    content: `The exchange rate shown is the live rate between USDC and your selected currency.

- Rates update in real-time as you type
- The rate includes all fees (bridge, platform, settlement)
- Rates are locked when you initiate the transaction
- You'll see the final payout amount before confirming

Factors affecting rates:
- Market volatility
- Network congestion
- Currency demand`,
    keywords: ["rate", "exchange", "price", "conversion", "fee"],
  },
  {
    id: "fees",
    title: "Transaction Fees",
    content: `Stellar-Spend charges transparent fees:

Network Fee: 2.50 USDC
- Covers Stellar bridge and Base settlement costs

Platform Fee: 0.35% of transaction amount
- Covers operational costs and compliance

You can choose to pay gas fees in:
- XLM (Stellar native token)
- USDC (stablecoin)

The fee method affects your total payout amount.`,
    keywords: ["fee", "cost", "charge", "gas", "expense"],
  },
  {
    id: "supported-currencies",
    title: "Supported Currencies",
    content: `Stellar-Spend currently supports:

- NGN (Nigerian Naira)
- KES (Kenyan Shilling)
- GHS (Ghanaian Cedi)
- ZAR (South African Rand)
- And more...

Each currency has specific banks and institutions available. Select your currency to see available options.`,
    keywords: ["currency", "country", "fiat", "supported", "available"],
  },
  {
    id: "transaction-status",
    title: "Tracking Your Transaction",
    content: `After initiating a transaction:

1. Pending: Waiting for Stellar confirmation
2. Bridging: Converting USDC from Stellar to Base
3. Settling: Sending funds to Paycrest
4. Processing: Converting to fiat currency
5. Complete: Funds sent to your bank account

You can view transaction history in the "Recent Offramps" section or visit /history for full details.`,
    keywords: ["status", "track", "progress", "pending", "complete"],
  },
  {
    id: "security",
    title: "Security & Safety",
    content: `Stellar-Spend prioritizes your security:

- Non-custodial: We never hold your funds
- All transactions are signed by your wallet
- Encrypted connections (HTTPS)
- Regular security audits
- Compliance with financial regulations

Never share your private keys or seed phrases. We will never ask for them.`,
    keywords: ["security", "safe", "private key", "seed phrase", "protection"],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    content: `Common issues and solutions:

Wallet won't connect:
- Ensure extension is installed
- Check that you're on Mainnet
- Try refreshing the page

Transaction stuck:
- Check Stellar.Expert for transaction status
- Network congestion may cause delays
- Contact support if stuck for >30 minutes

Rate unavailable:
- Temporary service issue
- Try again in a few moments
- Check our status page

For more help, contact support@stellar-spend.io`,
    keywords: ["help", "problem", "issue", "error", "stuck", "support"],
  },
];
