import type { HelpTopic } from '../types';

export const currenciesTopics: HelpTopic[] = [
  {
    id: 'supported-currencies',
    category: 'currencies',
    title: 'Supported Currencies & Countries',
    content: `Stellar-Spend currently supports the following fiat currencies:

• NGN — Nigerian Naira (Nigeria)
• KES — Kenyan Shilling (Kenya)
• GHS — Ghanaian Cedi (Ghana)
• ZAR — South African Rand (South Africa)
• Additional corridors are added regularly

Each currency supports specific banks and mobile money operators. Select your currency to see the available institutions.

To request a new corridor, open an issue on the project repository or contact support.`,
    keywords: [
      'currency',
      'country',
      'fiat',
      'ngn',
      'kes',
      'ghs',
      'zar',
      'nigeria',
      'kenya',
      'ghana',
      'south africa',
      'corridor',
    ],
  },
  {
    id: 'bank-verification',
    category: 'currencies',
    title: 'Bank Account Verification',
    content: `When you enter a bank account number, Stellar-Spend verifies it in real time.

How verification works:
1. You select the bank and enter the account number
2. The app calls the Paycrest verification API
3. The account holder's name is returned and displayed
4. Confirm the name matches your intended recipient before proceeding

Common verification errors:
• "Account not found" — check the account number and selected bank
• "Verification unavailable" — retry; this is usually a temporary API issue
• Name mismatch — verify you selected the correct bank and entered the right number

Important: Always confirm the displayed account name before sending funds. Transactions to the wrong account cannot be reversed once the bridge has settled.`,
    keywords: ['bank', 'verification', 'account number', 'account name', 'verify', 'beneficiary'],
  },
];
