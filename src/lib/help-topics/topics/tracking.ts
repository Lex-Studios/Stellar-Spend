import type { HelpTopic } from '../types';

export const trackingTopics: HelpTopic[] = [
  {
    id: 'transaction-status',
    category: 'tracking',
    title: 'Tracking Your Transaction',
    content: `After initiating a transfer, you can track progress in real time.

Status stages:
1. Pending — Waiting for Stellar network confirmation (30–60 seconds)
2. Bridging — Allbridge converting USDC from Stellar to Base (1–5 minutes)
3. Settling — Server creating Paycrest payout order
4. Processing — Paycrest converting USDC to fiat and initiating bank transfer
5. Complete — Funds sent to beneficiary's bank account

Where to track:
• Live status bar shown on the main page during the transaction
• /history page — full transaction history with status badges
• Email / push notification (if notifications are enabled)

If status is stuck for more than 30 minutes, see the Troubleshooting section or contact support.`,
    keywords: [
      'status',
      'track',
      'progress',
      'pending',
      'bridging',
      'settling',
      'processing',
      'complete',
      'history',
    ],
  },
  {
    id: 'transaction-history',
    category: 'tracking',
    title: 'Transaction History',
    content: `Your full transaction history is available at /history.

Features:
• Filter by date range, currency, status, or amount
• Export to CSV, PDF, or JSON for accounting
• View transaction receipts with exchange rate details
• Copy transaction hash to verify on Stellar Explorer or Base Scan
• File a dispute for transactions with issues

Transaction data is stored locally in your browser (localStorage) and optionally synced to the server if you enable account sync.

Note: Clearing browser data or switching devices will remove locally stored history unless sync is enabled.`,
    keywords: ['history', 'transactions', 'past', 'export', 'receipt', 'filter', 'records'],
  },
];
