import type { HelpTopic } from '../types';

export const securityTopics: HelpTopic[] = [
  {
    id: 'security',
    category: 'security',
    title: 'Security & Safety',
    content: `Stellar-Spend is designed with security as a priority.

How we protect you:
• Non-custodial — your private keys never leave your wallet
• All transactions are signed in your local wallet extension
• HTTPS-only communication
• Server never stores private keys or seed phrases
• Regular third-party security audits
• HMAC-verified webhooks to prevent spoofing

What you should do:
• Never share your private keys or seed phrase with anyone
• Verify the URL is stellar-spend.io before connecting your wallet
• Only install wallet extensions from official sources (freighter.app, lobstr.co)
• Enable 2FA in Settings → Security if available

We will NEVER ask for your seed phrase or private key.`,
    keywords: [
      'security',
      'safe',
      'private key',
      'seed phrase',
      'protection',
      '2fa',
      'non-custodial',
      'audit',
    ],
  },
];
