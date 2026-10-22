import type { HelpTopic } from '../types';

export const sendingTopics: HelpTopic[] = [
  {
    id: 'how-to-send',
    category: 'sending',
    title: 'How to Send an Off-Ramp Transfer',
    content: `Step-by-step guide to converting USDC to fiat:

Step 1 — Enter Amount
• Type the USDC amount, or switch the input mode to enter the fiat amount instead
• The estimated payout updates in real time as you type

Step 2 — Select Currency & Bank
• Choose your destination fiat currency (NGN, KES, GHS, …)
• Select the bank or financial institution from the list
• Enter the beneficiary account number; it will be verified automatically

Step 3 — Choose Gas Fee Method
• XLM: Network fee deducted from your XLM balance
• USDC: Network fee deducted from your USDC balance

Step 4 — Review & Confirm
• Check the rate, fees, and final payout amount
• Click "Send" and sign the transaction in your wallet
• Do not close the browser while the transaction is in progress

Step 5 — Wait for Settlement
• Typical time: 5–15 minutes
• Track progress in the status bar or visit /history`,
    keywords: [
      'send',
      'transfer',
      'convert',
      'offramp',
      'off-ramp',
      'fiat',
      'bank',
      'step by step',
      'how to send',
    ],
  },
  {
    id: 'dual-input-mode',
    category: 'sending',
    title: 'Crypto Amount vs Fiat Amount Input',
    content: `You can enter either the crypto (USDC) amount or the fiat amount.

Switching modes:
• Click the toggle icon next to the amount field to switch between USDC and fiat input
• When entering in fiat, the app calculates the required USDC amount including fees

Dual input is useful when:
• You need an exact fiat payout (e.g., paying an exact bill)
• You want to send your full USDC balance (enter in USDC mode)

Note: The displayed fiat amount is an estimate based on the live rate. Final settlement may vary by ±0.5% due to rate fluctuations during bridge confirmation.`,
    keywords: [
      'dual input',
      'fiat amount',
      'crypto amount',
      'switch',
      'toggle',
      'usdc input',
      'fiat input',
    ],
  },
];
