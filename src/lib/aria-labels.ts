/**
 * ARIA utilities for accessibility
 */

export const ariaLabels = {
  // Navigation
  mainNav: "Main navigation",
  skipToContent: "Skip to main content",
  
  // Forms
  amountInput: "Enter amount in USDC",
  currencySelect: "Select destination currency",
  bankSelect: "Select recipient bank",
  accountNumberInput: "Enter recipient account number",
  accountNameInput: "Enter recipient account name",
  feeMethodSelect: "Select fee payment method",
  
  // Buttons
  connectWallet: "Connect your Stellar wallet",
  disconnectWallet: "Disconnect wallet",
  submitTransaction: "Submit transaction for processing",
  confirmTransaction: "Confirm and proceed with transaction",
  cancelTransaction: "Cancel transaction",
  editTransaction: "Edit transaction details",
  
  // Status
  loadingIndicator: "Loading",
  successMessage: "Operation completed successfully",
  errorMessage: "An error occurred",
  warningMessage: "Warning",
  
  // Modals
  previewModal: "Transaction preview",
  walletModal: "Wallet selection",
  shortcutsModal: "Keyboard shortcuts",
  
  // Tables
  transactionTable: "Recent transactions",
  transactionRow: (txHash: string) => `Transaction ${txHash}`,
  
  // Live regions
  quoteUpdate: "Exchange rate and quote updated",
  transactionStatus: "Transaction status updated",
  errorNotification: "Error notification",
};

export const ariaDescriptions = {
  bridgeFee: "Fee charged by the bridge protocol for cross-chain transfer",
  payoutFee: "Fee charged by the payout provider for bank settlement",
  estimatedTime: "Approximate time for the transaction to complete",
  feeMethod: "Choose to pay fees in XLM (native) or USDC (stablecoin)",
};

export const ariaLive = {
  polite: "polite" as const,
  assertive: "assertive" as const,
};
