import type { HelpTopic } from '../types';

export const walletTopics: HelpTopic[] = [
  {
    id: 'wallet-connection',
    category: 'wallet',
    title: 'Connecting Your Wallet',
    content: `Stellar-Spend supports Freighter and Lobstr wallets.

To connect:
1. Click "CONNECT WALLET" in the top-right corner
2. Choose Freighter or Lobstr
3. Approve the connection request in your wallet extension
4. Your public key will appear in the header

Freighter setup:
• Install from freighter.app
• Create or import a Stellar account
• Switch the network to Mainnet (Settings → Network → Mainnet)

Lobstr setup:
• Use the Lobstr browser extension or mobile companion
• Approve the WalletConnect pairing request

Troubleshooting:
• "Extension not installed" — install the extension and refresh
• "Wrong network" — switch to Mainnet in wallet settings
• Connection lost — click the wallet address to reconnect`,
    keywords: [
      'wallet',
      'connect',
      'freighter',
      'lobstr',
      'extension',
      'walletconnect',
      'disconnect',
      'pairing',
    ],
  },
  {
    id: 'wallet-balance',
    category: 'wallet',
    title: 'Wallet Balance & Minimum Reserve',
    content: `Your Stellar account must maintain a minimum XLM reserve.

Stellar requires every account to hold a base reserve (currently 1 XLM) plus 0.5 XLM per trustline. Attempting to drop below the reserve will cause the transaction to fail.

If you see "Insufficient XLM balance for native gas fee":
• Switch the gas fee payment to USDC instead of XLM
• Add more XLM to your account
• Reduce the transfer amount slightly

USDC balance shown in the app is your Stellar USDC (not Base USDC). Make sure you have the USDC trustline established on your Stellar account.`,
    keywords: ['balance', 'reserve', 'xlm', 'minimum', 'trustline', 'insufficient', 'xlm reserve'],
  },
];
