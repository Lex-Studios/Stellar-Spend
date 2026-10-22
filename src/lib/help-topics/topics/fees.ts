import type { HelpTopic } from '../types';

export const feesTopics: HelpTopic[] = [
  {
    id: 'fees',
    category: 'fees',
    title: 'Transaction Fees Explained',
    content: `Stellar-Spend charges transparent, itemised fees:

Bridge Fee: ~0.3%–0.5% of the transfer amount
• Paid to Allbridge for cross-chain conversion (Stellar → Base)

Platform Fee: 0.35% of the transfer amount
• Covers operational costs and compliance

Network Fee: Fixed ~2.50 USDC equivalent
• Covers Stellar and Base gas costs
• Can be paid in XLM or USDC (your choice)

Paycrest Payout Fee: 0% (no additional fee)
• Paycrest does not charge extra for fiat settlement

Total fees are shown on the quote screen before you confirm. The "You receive" amount is the final fiat payout after all deductions.

FAQ — Why does my payout differ from the displayed amount?
Minor rate changes during bridge processing (< 1 minute) may cause small differences. Rates are locked at bridge submission, not at quote time.`,
    keywords: [
      'fee',
      'cost',
      'charge',
      'gas',
      'bridge fee',
      'platform fee',
      'network fee',
      '0.35',
      'how much',
      'price',
    ],
  },
  {
    id: 'gas-fee-options',
    category: 'fees',
    title: 'Choosing Your Gas Fee Method',
    content: `You can pay the Stellar/Base network fee in XLM or USDC.

XLM method:
• Gas deducted from your XLM balance on Stellar
• Your USDC amount is fully used for the transfer
• Requires sufficient XLM above the minimum reserve

USDC method:
• Gas deducted from your USDC transfer amount
• Net USDC bridged is slightly less
• Useful when XLM is low

Recommendation: Use USDC fee if your XLM balance is near the minimum reserve.`,
    keywords: ['gas fee', 'xlm fee', 'usdc fee', 'fee method', 'gas payment', 'stablecoin fee'],
  },
];
