// Re-export the shared type
export type { HelpTopic } from './types';

// Re-export category metadata
export { HELP_CATEGORIES } from './categories';

// Re-export per-category topic arrays (useful for consumers that want a single category)
export { gettingStartedTopics } from './topics/getting-started';
export { walletTopics } from './topics/wallet';
export { sendingTopics } from './topics/sending';
export { feesTopics } from './topics/fees';
export { currenciesTopics } from './topics/currencies';
export { trackingTopics } from './topics/tracking';
export { refundsTopics } from './topics/refunds';
export { securityTopics } from './topics/security';
export { faqTopics } from './topics/faq';
export { troubleshootingTopics } from './topics/troubleshooting';

// Assemble the canonical flat list in user-journey order
import { gettingStartedTopics } from './topics/getting-started';
import { walletTopics } from './topics/wallet';
import { sendingTopics } from './topics/sending';
import { feesTopics } from './topics/fees';
import { currenciesTopics } from './topics/currencies';
import { trackingTopics } from './topics/tracking';
import { refundsTopics } from './topics/refunds';
import { securityTopics } from './topics/security';
import { faqTopics } from './topics/faq';
import { troubleshootingTopics } from './topics/troubleshooting';
import type { HelpTopic } from './types';

// Topics are organized by user journey:
// 1. Getting Started  2. Wallet  3. Sending Money  4. Fees  5. Currencies & Banks
// 6. Status & Tracking  7. Refunds & Failures  8. Security  9. FAQs  10. Troubleshooting
export const HELP_TOPICS: HelpTopic[] = [
  ...gettingStartedTopics,
  ...walletTopics,
  ...sendingTopics,
  ...feesTopics,
  ...currenciesTopics,
  ...trackingTopics,
  ...refundsTopics,
  ...securityTopics,
  ...faqTopics,
  ...troubleshootingTopics,
];
