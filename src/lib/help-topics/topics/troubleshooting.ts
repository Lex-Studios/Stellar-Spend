import type { HelpTopic } from '../types';

export const troubleshootingTopics: HelpTopic[] = [
  {
    id: 'troubleshooting',
    category: 'troubleshooting',
    title: 'Troubleshooting Common Issues',
    content: `Quick fixes for the most common problems:

Wallet won't connect:
→ Ensure the extension is installed and enabled
→ Switch to Mainnet in wallet settings
→ Refresh the page and try again

"Invalid environment configuration" on load:
→ The app is misconfigured; contact the operator

"Bridge quote unavailable":
→ Temporary Allbridge outage — retry in 30 seconds
→ Check https://allbridge.io/status

"FX rate unavailable":
→ Paycrest rate API is temporarily down — retry shortly

"Simulation failed: resulting balance not within allowed range":
→ Your USDC balance is below the transfer amount + fees
→ Reduce the transfer amount or add more USDC

Transaction shows "Complete" but bank not credited:
→ Bank processing can take up to 1 business day
→ Check if the account details were correct
→ Contact support with your transaction hash

For further help: support@stellar-spend.io`,
    keywords: [
      'troubleshoot',
      'fix',
      'error',
      'problem',
      'issue',
      'not working',
      'support',
      'help',
      'contact',
    ],
  },
];
