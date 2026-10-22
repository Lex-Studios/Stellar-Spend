import type { HelpTopic } from '../types';

export const faqTopics: HelpTopic[] = [
  {
    id: 'faq-fees-deducted',
    category: 'faq',
    title: 'FAQ: Where Are Fees Deducted From?',
    content: `All fees are deducted from the USDC amount you send (or from XLM if you choose the XLM gas fee option).

Example for a 100 USDC transfer to NGN:
• Bridge fee (0.4%): ~0.40 USDC
• Platform fee (0.35%): ~0.35 USDC
• Network fee: ~2.50 USDC equivalent
• Net USDC reaching Paycrest: ~96.75 USDC
• Final NGN payout: 96.75 × current USDC/NGN rate

You always see the full breakdown before confirming.`,
    keywords: ['fee deducted', 'where fees', 'fee breakdown', 'total fee', 'net amount', 'example'],
  },
  {
    id: 'faq-minimum',
    category: 'faq',
    title: 'FAQ: What Is the Minimum Transfer Amount?',
    content: `The minimum transfer amount is 0.70 USDC.

This minimum exists because:
• Fixed network fees (~2.50 USDC) would exceed the transfer amount for very small sends
• The Paycrest payout system has minimum order sizes per currency

For most corridors, sending less than $5 USDC will result in a very small fiat payout after fees. We recommend transfers of at least $10 USDC for meaningful payouts.`,
    keywords: ['minimum', 'minimum amount', '0.70', 'small amount', 'min'],
  },
  {
    id: 'faq-kyc',
    category: 'faq',
    title: 'FAQ: Do I Need KYC?',
    content: `Stellar-Spend has tiered KYC requirements.

Tier 0 (no KYC):
• Transfers up to $150 USDC per transaction
• Suitable for small personal transfers

Tier 1 (basic KYC):
• Transfers up to $500 USDC per transaction
• Requires name and phone number verification

Tier 2 (full KYC):
• Transfers above $500 USDC
• Requires government-issued ID

KYC is handled in Settings → KYC & Limits. Verification is fast (usually < 5 minutes).`,
    keywords: ['kyc', 'identity', 'verification', 'limit', 'tier', 'know your customer'],
  },
];
