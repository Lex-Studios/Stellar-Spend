import type { HelpTopic } from '../types';

export const gettingStartedTopics: HelpTopic[] = [
  {
    id: 'getting-started',
    category: 'getting-started',
    title: 'Getting Started',
    content: `Welcome to Stellar-Spend!

Stellar-Spend lets you convert Stellar stablecoins (USDC / USDT) into local fiat currency and receive funds directly in your bank account.

Quick start:
1. Connect your Stellar wallet (Freighter or Lobstr)
2. Enter the USDC amount you want to convert
3. Select your destination currency and bank
4. Enter your bank account details
5. Review the rate and fees, then confirm in your wallet
6. Funds settle to your bank in 5–15 minutes

Requirements:
• Minimum transfer: 0.70 USDC
• A Stellar wallet with USDC balance
• Enough XLM for network fees (if paying gas in XLM)
• Your wallet must be on Mainnet (not Testnet)`,
    keywords: ['start', 'begin', 'first time', 'setup', 'how to', 'new user', 'quick start'],
  },
  {
    id: 'what-is-stellar-spend',
    category: 'getting-started',
    title: 'What is Stellar-Spend?',
    content: `Stellar-Spend is a non-custodial off-ramp application.

Non-custodial means:
• We never hold your funds at any point
• All transactions are signed by you in your own wallet
• You remain in full control of your assets

How it works:
1. Your USDC travels from Stellar → Base chain via Allbridge
2. The server sends Base USDC to Paycrest
3. Paycrest converts it to fiat and initiates a bank transfer
4. Your beneficiary receives local currency (NGN, KES, GHS, …)

Supported stablecoins: USDC, USDT (Stellar-issued)`,
    keywords: ['what is', 'about', 'non-custodial', 'how it works', 'overview', 'introduction'],
  },
];
