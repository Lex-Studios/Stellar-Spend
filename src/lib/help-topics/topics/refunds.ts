import type { HelpTopic } from '../types';

export const refundsTopics: HelpTopic[] = [
  {
    id: 'refunds',
    category: 'refunds',
    title: 'Refunds & Failed Transactions',
    content: `What happens when a transaction fails?

If the bridge fails (before Base confirmation):
• Your Stellar USDC is automatically refunded to your wallet
• Refund typically arrives within 30 minutes
• Check /history for the refund entry

If the Paycrest payout fails (after bridge):
• The USDC held on Base is returned to the refund address
• Contact support with your transaction hash for manual resolution

Refund eligibility:
• Transactions qualify for refund within 24 hours of initiation
• Bridge fees may not be refundable if the bridge partially completed

To request a refund manually:
1. Go to /history
2. Click the transaction
3. Click "Request Refund" if eligible
4. Provide the reason and submit`,
    keywords: ['refund', 'failed', 'failure', 'error', 'money back', 'return', 'stuck', 'reversed'],
  },
  {
    id: 'faq-timing',
    category: 'refunds',
    title: 'FAQ: Why Is My Transfer Taking So Long?',
    content: `Typical transfer time is 5–15 minutes. Here's what can cause delays:

Stellar network congestion:
• High transaction volume may slow bridge confirmation
• Usually resolves within 15 minutes

Allbridge bridge processing:
• The bridge waits for multiple confirmations on both chains
• Peak hours may add 5–10 minutes

Paycrest bank processing:
• Bank transfers depend on your bank's clearing schedule
• Weekend and holiday transfers may take until the next business day
• Mobile money (M-Pesa, etc.) typically settles faster

If your transfer is stuck for more than 30 minutes at "Bridging":
• Check the Allbridge status page
• Check Stellar.Expert for the transaction hash
• Contact support if the transaction is not visible on-chain`,
    keywords: [
      'slow',
      'delay',
      'time',
      'how long',
      '30 minutes',
      'stuck',
      'congestion',
      'weekend',
      'timing',
    ],
  },
];
