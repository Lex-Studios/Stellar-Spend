# Stellar-Spend User Guide

Convert your Stellar stablecoins (USDC) to fiat currency and receive funds directly in your bank account.

> **Note for maintainers:** Sections marked `[SCREENSHOT]` are placeholders. Replace them with actual screenshots once the UI is stable.

---

## Table of Contents

1. [What You Need](#what-you-need)
2. [Connecting Your Wallet](#connecting-your-wallet)
3. [Making a Conversion](#making-a-conversion)
4. [Transaction Status Tracking](#transaction-status-tracking)
5. [Transaction History](#transaction-history)
6. [FAQ](#faq)
7. [Troubleshooting](#troubleshooting)

---

## What You Need

Before you start:

- A **Freighter** or **Lobstr** Stellar wallet browser extension, installed and set up
- **USDC on Stellar** (the token you'll be converting)
- A small amount of **XLM** in your wallet (required for Stellar network fees — minimum ~3 XLM reserve + ~2.5 XLM for gas, unless you pay fees in USDC)
- Your **bank account details**: account number and the name of your bank

---

## Connecting Your Wallet

### Step 1 — Open the app

Navigate to the app URL. You'll see the Offramp Dashboard with three progress steps at the bottom. Step **01 — CONNECT WALLET** will be highlighted.

`[SCREENSHOT: Dashboard on first load, step 01 highlighted, Connect Wallet button visible in the header]`

### Step 2 — Click "Connect Wallet"

Click the **Connect Wallet** button in the top-right header.

The app auto-detects your installed wallet:
- If **Freighter** is installed, it connects automatically.
- If only **Lobstr** is installed, it connects to Lobstr.
- If both are installed, Freighter takes priority.

Your wallet extension will open and ask you to approve the connection.

`[SCREENSHOT: Freighter extension popup requesting connection approval]`

### Step 3 — Approve the connection

Click **Connect** (or **Approve**) in your wallet extension.

Once connected, the header updates to show:
- Your wallet address (truncated, e.g. `GABC...XYZ`)
- Your **USDC** balance
- Your **XLM** balance
- Which wallet is connected (Freighter or Lobstr)

`[SCREENSHOT: Header showing connected wallet address, USDC and XLM balances]`

### Disconnecting

Click your wallet address in the header, then click **Disconnect**. This clears your session and local transaction history from the browser.

---

## Making a Conversion

### Step 1 — Enter the amount

In the form on the left, enter the amount of **USDC** you want to convert.

As you type, the app fetches a live quote and shows the estimated fiat amount you'll receive in the right panel.

`[SCREENSHOT: Form with amount entered, right panel showing estimated payout amount and exchange rate]`

> The quote is valid for **5 minutes**. If it expires before you submit, the form will prompt you to refresh it.

### Step 2 — Select your currency and bank

1. Choose your **fiat currency** from the dropdown (e.g. NGN, KES).
2. Select your **bank** from the list that appears.
3. Enter your **account number**.
4. Click **Verify Account** — the app will look up and display your account name for confirmation.

`[SCREENSHOT: Form with currency selected, bank selected, account number entered, verified account name shown]`

### Step 3 — Choose your fee payment method

Select how you want to pay the Allbridge bridge fee:

| Option | What it means |
|---|---|
| **USDC** (recommended) | Fee is deducted from your USDC amount. No extra XLM needed beyond the minimum reserve. |
| **XLM** | Fee is paid in XLM. Requires at least ~5.5 XLM in your wallet (3 XLM reserve + ~2.5 XLM gas). |

`[SCREENSHOT: Fee method toggle showing USDC and XLM options]`

### Step 4 — Review and confirm

Check the right panel summary:
- Amount you're sending (USDC)
- Exchange rate
- Estimated fiat amount you'll receive
- Estimated completion time

When everything looks correct, click **Send**.

`[SCREENSHOT: Right panel showing full quote summary before submission]`

### Step 5 — Sign the transaction

A progress modal appears. The app builds the bridge transaction and your wallet extension opens asking you to **sign** it.

`[SCREENSHOT: Progress modal at "Awaiting Wallet Signature" step, wallet extension open in background]`

Review the transaction details in your wallet and click **Sign** (or **Approve**).

> **Important:** Never sign a transaction you didn't initiate. The app will only ask you to sign once per conversion.

### Step 6 — Wait for completion

After signing, the modal tracks progress through these steps automatically:

| Step | What's happening |
|---|---|
| Submitting to Network | Your signed transaction is sent to the Stellar network |
| Processing On-Chain | Allbridge picks up the transfer and moves USDC to Base |
| Settling Fiat Payout | Paycrest processes the bank transfer |
| Transaction Complete ✓ | Funds are on their way to your bank account |

`[SCREENSHOT: Progress modal showing "Processing On-Chain" step with completed steps above it]`

`[SCREENSHOT: Progress modal showing "Transaction Complete" success state with green checkmark]`

The full process typically takes **5–15 minutes** depending on network conditions.

Click **Dismiss** when done. The form resets and your balances refresh automatically.

---

## Transaction Status Tracking

### Progress Modal

While a conversion is in progress, the modal stays open and updates in real time. You can see exactly which step is active and which are complete.

If something goes wrong, the modal switches to an **error state** showing a red icon and a description of what failed.

`[SCREENSHOT: Progress modal in error state with red X icon and error message]`

Click **Dismiss** to close the error modal. Your transaction is saved in history with a `failed` status.

### Stellar Explorer

On a successful transaction, the modal shows a link to view your transaction on [Stellar Expert](https://stellar.expert/explorer/public). Click **View transaction on Stellar Explorer →** to see the on-chain details.

`[SCREENSHOT: Success modal with transaction hash and Stellar Explorer link]`

---

## Transaction History

The **Recent Offramps** table below the form shows your last conversions for the connected wallet.

`[SCREENSHOT: Recent Offramps table showing a few completed and pending transactions]`

Each row shows:
- Date and time
- Amount sent (USDC)
- Currency received
- Status: `pending`, `completed`, or `failed`

History is stored locally in your browser. It is scoped to your wallet address and holds up to 50 records. Disconnecting your wallet clears the history from the current session (the data remains in `localStorage` and reloads when you reconnect).

To view full history, click **View All** (or navigate to `/history`).

---

## FAQ

**Which wallets are supported?**
Freighter and Lobstr. Freighter is auto-detected first. If you have both installed, Freighter is used.

**Which tokens can I convert?**
Currently USDC on Stellar. The bridge routes USDC from Stellar → Base before the fiat payout.

**Which fiat currencies are supported?**
The currency list is fetched live from Paycrest. Available currencies depend on your region. Select your currency in the form to see what's available.

**How long does a conversion take?**
Typically 5–15 minutes. The Allbridge bridge step (Stellar → Base) usually takes 3–10 minutes. The Paycrest bank transfer follows immediately after.

**What are the fees?**
- **Bridge fee**: paid in USDC or XLM (your choice). The exact amount is shown in the fee selector before you confirm.
- **Payout fee**: included in the exchange rate shown in the quote. There are no hidden fees.

**Is there a minimum or maximum amount?**
Minimums and maximums are enforced by Allbridge and Paycrest. If your amount is outside the accepted range, you'll see an error when the quote is fetched.

**What happens if the transaction fails mid-way?**
- If the Stellar transaction fails before submission: your wallet is not debited.
- If the bridge fails after submission: Allbridge will return funds to your Stellar address (this can take up to 24 hours).
- If the Paycrest payout fails: the order status will show `refunded` or `expired` and funds are returned via the configured return address.

**Is my private key ever sent to the server?**
No. Your private key never leaves your wallet extension. The app only asks your wallet to sign a transaction — the signing happens locally in the extension.

**Why does the app need my account name?**
Paycrest requires a verified account name to process the bank transfer. The app looks it up automatically when you enter your account number — you don't need to type it manually.

---

## Troubleshooting

### "Connect Wallet" button does nothing

Your wallet extension is not installed or not detected. Install [Freighter](https://www.freighter.app/) or [Lobstr](https://lobstr.co/), refresh the page, and try again.

### "Insufficient USDC balance"

Your wallet has less USDC than the amount you entered. Check your balance in the header and enter a lower amount.

### "Insufficient XLM for gas"

You selected XLM as the fee method but don't have enough XLM. You need at least ~5.5 XLM (3 XLM minimum reserve + ~2.5 XLM for gas). Either:
- Add more XLM to your wallet, or
- Switch the fee method to **USDC**

### "Bridge quote unavailable" or "FX rate unavailable"

The Allbridge or Paycrest service is temporarily unreachable. Wait a minute and try refreshing the quote. If the issue persists, check the [Allbridge status page](https://allbridge.io) or [Paycrest status](https://paycrest.io).

### Transaction stuck on "Processing On-Chain"

The Allbridge bridge can take up to 10 minutes under normal conditions. If it has been more than 20 minutes:
1. Copy your Stellar transaction hash from the success/history screen.
2. Check the transfer status at [Allbridge Explorer](https://core.allbridge.io/explorer).
3. If the bridge shows the transfer as failed, Allbridge will automatically refund your Stellar address.

### Transaction stuck on "Settling Fiat Payout"

Bank transfers can occasionally take longer due to processing windows. If the status has not changed after 30 minutes, contact Paycrest support with your order ID (visible in transaction history).

### The page shows an error on load

The app validates its configuration at startup. If you see a startup error, the deployment is misconfigured — contact the platform operator. This is not something you can fix as a user.

### My transaction history is empty after reconnecting

Transaction history is stored in your browser's `localStorage`. If you cleared your browser data or are using a different browser/device, the history will not be available. The funds are not affected — only the local display record is missing.
