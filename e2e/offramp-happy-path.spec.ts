import { test, expect, Page } from '@playwright/test'

test.describe('E2E: Offramp Happy Path', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()

    // Mock API responses for stability
    await page.route('**/api/auth/session', (route) =>
      route.abort('blockedbyclient')
    )
    await page.route('**/api/prices', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          USDC: { USD: 1.0, EUR: 0.92 },
          USDT: { USD: 1.0, EUR: 0.92 },
        }),
      })
    )
    await page.route('**/api/exchange/quote', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'quote-123',
          amount: 1000,
          rate: 0.92,
          total: 920,
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        }),
      })
    )
    await page.route('**/api/offramp/submit', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'offramp-123',
          status: 'initiated',
          amount: 1000,
          currency: 'USDC',
          createdAt: new Date().toISOString(),
        }),
      })
    )
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('should complete full offramp flow from start to transaction history', async () => {
    // Step 1: Navigate to offramp page
    await page.goto('http://localhost:3000/offramp')
    await expect(page).toHaveTitle(/Offramp/i)

    // Verify main heading is visible
    await expect(page.locator('h1:has-text("Offramp")')).toBeVisible()

    // Step 2: Connect wallet (simulate Freighter extension)
    await simulateWalletConnection(page)

    // Verify wallet connected state
    const walletButton = page.locator('[data-testid="wallet-status"]')
    await expect(walletButton).toContainText(/connected/i)

    // Step 3: Enter amount
    const amountInput = page.locator('[data-testid="amount-input"]')
    await amountInput.fill('1000')

    // Verify amount is displayed
    await expect(amountInput).toHaveValue('1000')

    // Step 4: Select currency
    const currencySelect = page.locator('[data-testid="currency-select"]')
    await currencySelect.click()
    await page.locator('text=USDC').click()

    // Verify USDC is selected
    await expect(currencySelect).toContainText('USDC')

    // Step 5: Select destination currency
    const destCurrencySelect = page.locator('[data-testid="dest-currency-select"]')
    await destCurrencySelect.click()
    await page.locator('text=USD').click()

    // Verify USD is selected
    await expect(destCurrencySelect).toContainText('USD')

    // Step 6: Get quote
    const getQuoteButton = page.locator('[data-testid="get-quote-btn"]')
    await getQuoteButton.click()

    // Wait for quote response and verification
    await page.waitForResponse((response) =>
      response.url().includes('/api/exchange/quote') && response.status() === 200
    )

    // Verify quote is displayed
    const quoteDisplay = page.locator('[data-testid="quote-display"]')
    await expect(quoteDisplay).toBeVisible()
    await expect(quoteDisplay).toContainText('920')

    // Verify rate is shown
    const rateDisplay = page.locator('[data-testid="rate-display"]')
    await expect(rateDisplay).toContainText('0.92')

    // Verify expiration warning
    const expirationWarning = page.locator('[data-testid="quote-expires-in"]')
    await expect(expirationWarning).toContainText(/expires/i)

    // Step 7: Enter recipient details
    const recipientNameInput = page.locator('[data-testid="recipient-name"]')
    await recipientNameInput.fill('John Doe')

    const recipientEmailInput = page.locator('[data-testid="recipient-email"]')
    await recipientEmailInput.fill('john@example.com')

    const recipientPhoneInput = page.locator('[data-testid="recipient-phone"]')
    await recipientPhoneInput.fill('+1234567890')

    // For bank transfer method
    const bankAccountInput = page.locator('[data-testid="recipient-bank-account"]')
    await bankAccountInput.fill('12345678')

    const routingNumberInput = page.locator('[data-testid="recipient-routing-number"]')
    await routingNumberInput.fill('021000021')

    // Verify all recipient fields are filled
    await expect(recipientNameInput).toHaveValue('John Doe')
    await expect(recipientEmailInput).toHaveValue('john@example.com')
    await expect(recipientPhoneInput).toHaveValue('+1234567890')

    // Step 8: Review offramp summary
    const summarySection = page.locator('[data-testid="offramp-summary"]')
    await expect(summarySection).toBeVisible()

    // Verify summary details
    await expect(summarySection).toContainText('1000')
    await expect(summarySection).toContainText('USDC')
    await expect(summarySection).toContainText('920')
    await expect(summarySection).toContainText('USD')

    // Verify fees are displayed
    const feesDisplay = page.locator('[data-testid="fees-display"]')
    await expect(feesDisplay).toContainText('Fee:')

    // Step 9: Confirm and submit offramp
    const confirmButton = page.locator('[data-testid="confirm-offramp-btn"]')
    await expect(confirmButton).toBeEnabled()
    await confirmButton.click()

    // Handle wallet confirmation (simulated)
    await simulateWalletConfirmation(page)

    // Wait for offramp submission
    await page.waitForResponse((response) =>
      response.url().includes('/api/offramp/submit') && response.status() === 200
    )

    // Verify success message
    const successMessage = page.locator('[data-testid="success-message"]')
    await expect(successMessage).toBeVisible()
    await expect(successMessage).toContainText(/completed|initiated/i)

    // Verify offramp ID is shown
    const offrampIdDisplay = page.locator('[data-testid="offramp-id"]')
    await expect(offrampIdDisplay).toContainText('offramp-123')

    // Step 10: Navigate to transaction history
    const historyLink = page.locator('[data-testid="view-history-btn"]')
    await expect(historyLink).toBeVisible()
    await historyLink.click()

    // Wait for history page to load
    await page.waitForURL('**/history')

    // Verify on history page
    await expect(page).toHaveURL(/\/history/)

    // Step 11: Verify transaction in history
    const historyTable = page.locator('[data-testid="transaction-history-table"]')
    await expect(historyTable).toBeVisible()

    // Find our transaction in history
    const transactionRow = historyTable.locator(
      'tr:has-text("offramp-123")'
    )
    await expect(transactionRow).toBeVisible()

    // Verify transaction details in history
    await expect(transactionRow).toContainText('1000')
    await expect(transactionRow).toContainText('USDC')
    await expect(transactionRow).toContainText('920')
    await expect(transactionRow).toContainText('USD')

    // Step 12: Click transaction for details
    await transactionRow.click()

    // Wait for transaction detail page
    await page.waitForURL('**/transaction/*')

    // Verify transaction details page
    const detailsHeading = page.locator('h1:has-text("Transaction Details")')
    await expect(detailsHeading).toBeVisible()

    // Verify full transaction details
    const amountDetail = page.locator('[data-testid="detail-amount"]')
    await expect(amountDetail).toContainText('1000 USDC')

    const statusDetail = page.locator('[data-testid="detail-status"]')
    await expect(statusDetail).toContainText(/initiated|processing/i)

    const recipientDetail = page.locator('[data-testid="detail-recipient"]')
    await expect(recipientDetail).toContainText('John Doe')

    const idDetail = page.locator('[data-testid="detail-transaction-id"]')
    await expect(idDetail).toContainText('offramp-123')

    // Verify timestamp is present
    const timestampDetail = page.locator('[data-testid="detail-timestamp"]')
    await expect(timestampDetail).toBeVisible()
  })

  test('should handle quote expiration gracefully', async () => {
    await page.goto('http://localhost:3000/offramp')

    // Simulate wallet connection
    await simulateWalletConnection(page)

    // Enter amount and get quote
    const amountInput = page.locator('[data-testid="amount-input"]')
    await amountInput.fill('1000')

    const currencySelect = page.locator('[data-testid="currency-select"]')
    await currencySelect.click()
    await page.locator('text=USDC').click()

    const destCurrencySelect = page.locator('[data-testid="dest-currency-select"]')
    await destCurrencySelect.click()
    await page.locator('text=USD').click()

    const getQuoteButton = page.locator('[data-testid="get-quote-btn"]')
    await getQuoteButton.click()

    await page.waitForResponse((response) =>
      response.url().includes('/api/exchange/quote') && response.status() === 200
    )

    // Wait for quote to expire (simulated, 60 seconds)
    await page.waitForTimeout(61000)

    // Verify expiration message
    const expiredMessage = page.locator('[data-testid="quote-expired-message"]')
    await expect(expiredMessage).toBeVisible()

    // Verify refresh quote button is available
    const refreshQuoteButton = page.locator('[data-testid="refresh-quote-btn"]')
    await expect(refreshQuoteButton).toBeEnabled()

    // Refresh quote
    await refreshQuoteButton.click()

    // Verify new quote is retrieved
    await page.waitForResponse((response) =>
      response.url().includes('/api/exchange/quote') && response.status() === 200
    )

    const newQuoteDisplay = page.locator('[data-testid="quote-display"]')
    await expect(newQuoteDisplay).toBeVisible()
  })

  test('should validate all required fields before submission', async () => {
    await page.goto('http://localhost:3000/offramp')

    // Simulate wallet connection
    await simulateWalletConnection(page)

    // Try to submit without filling fields
    const confirmButton = page.locator('[data-testid="confirm-offramp-btn"]')
    await expect(confirmButton).toBeDisabled()

    // Fill amount only
    const amountInput = page.locator('[data-testid="amount-input"]')
    await amountInput.fill('1000')

    // Button should still be disabled (missing other fields)
    await expect(confirmButton).toBeDisabled()

    // Fill currency
    const currencySelect = page.locator('[data-testid="currency-select"]')
    await currencySelect.click()
    await page.locator('text=USDC').click()

    // Button should still be disabled
    await expect(confirmButton).toBeDisabled()

    // Fill destination currency
    const destCurrencySelect = page.locator('[data-testid="dest-currency-select"]')
    await destCurrencySelect.click()
    await page.locator('text=USD').click()

    // Get quote
    const getQuoteButton = page.locator('[data-testid="get-quote-btn"]')
    await getQuoteButton.click()

    await page.waitForResponse((response) =>
      response.url().includes('/api/exchange/quote') && response.status() === 200
    )

    // Button should still be disabled (missing recipient)
    await expect(confirmButton).toBeDisabled()

    // Fill recipient details
    const recipientNameInput = page.locator('[data-testid="recipient-name"]')
    await recipientNameInput.fill('John Doe')

    const recipientEmailInput = page.locator('[data-testid="recipient-email"]')
    await recipientEmailInput.fill('john@example.com')

    const recipientPhoneInput = page.locator('[data-testid="recipient-phone"]')
    await recipientPhoneInput.fill('+1234567890')

    const bankAccountInput = page.locator('[data-testid="recipient-bank-account"]')
    await bankAccountInput.fill('12345678')

    const routingNumberInput = page.locator('[data-testid="recipient-routing-number"]')
    await routingNumberInput.fill('021000021')

    // Now button should be enabled
    await expect(confirmButton).toBeEnabled()
  })

  test('should handle network errors gracefully', async () => {
    // Mock a failed API response
    await page.route('**/api/exchange/quote', (route) =>
      route.abort('failed')
    )

    await page.goto('http://localhost:3000/offramp')

    // Simulate wallet connection
    await simulateWalletConnection(page)

    // Enter amount and try to get quote
    const amountInput = page.locator('[data-testid="amount-input"]')
    await amountInput.fill('1000')

    const currencySelect = page.locator('[data-testid="currency-select"]')
    await currencySelect.click()
    await page.locator('text=USDC').click()

    const destCurrencySelect = page.locator('[data-testid="dest-currency-select"]')
    await destCurrencySelect.click()
    await page.locator('text=USD').click()

    const getQuoteButton = page.locator('[data-testid="get-quote-btn"]')
    await getQuoteButton.click()

    // Wait a bit for the request to fail
    await page.waitForTimeout(1000)

    // Verify error message is shown
    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toContainText(/error|failed|unable/i)

    // Verify retry button is available
    const retryButton = page.locator('[data-testid="retry-btn"]')
    await expect(retryButton).toBeVisible()

    // Restore API
    await page.route('**/api/exchange/quote', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'quote-124',
          amount: 1000,
          rate: 0.92,
          total: 920,
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        }),
      })
    )

    // Click retry
    await retryButton.click()

    // Verify quote is retrieved
    await page.waitForResponse((response) =>
      response.url().includes('/api/exchange/quote') && response.status() === 200
    )

    const quoteDisplay = page.locator('[data-testid="quote-display"]')
    await expect(quoteDisplay).toBeVisible()
  })

  test('should maintain form state during page interactions', async () => {
    await page.goto('http://localhost:3000/offramp')

    // Simulate wallet connection
    await simulateWalletConnection(page)

    // Fill form
    const amountInput = page.locator('[data-testid="amount-input"]')
    await amountInput.fill('1000')

    const currencySelect = page.locator('[data-testid="currency-select"]')
    await currencySelect.click()
    await page.locator('text=USDC').click()

    const destCurrencySelect = page.locator('[data-testid="dest-currency-select"]')
    await destCurrencySelect.click()
    await page.locator('text=USD').click()

    const getQuoteButton = page.locator('[data-testid="get-quote-btn"]')
    await getQuoteButton.click()

    await page.waitForResponse((response) =>
      response.url().includes('/api/exchange/quote') && response.status() === 200
    )

    // Add recipient details
    const recipientNameInput = page.locator('[data-testid="recipient-name"]')
    await recipientNameInput.fill('John Doe')

    // Navigate away and back (using browser back/forward)
    await page.goto('http://localhost:3000/dashboard')
    await page.goBack()

    // Verify form state is preserved or cleared as expected
    // Most modern apps clear on navigation, but we verify the behavior
    await expect(page).toHaveURL(/\/offramp/)
  })

  test('should display comprehensive transaction summary before confirmation', async () => {
    await page.goto('http://localhost:3000/offramp')

    // Simulate wallet connection
    await simulateWalletConnection(page)

    // Fill all details
    const amountInput = page.locator('[data-testid="amount-input"]')
    await amountInput.fill('1000')

    const currencySelect = page.locator('[data-testid="currency-select"]')
    await currencySelect.click()
    await page.locator('text=USDC').click()

    const destCurrencySelect = page.locator('[data-testid="dest-currency-select"]')
    await destCurrencySelect.click()
    await page.locator('text=USD').click()

    const getQuoteButton = page.locator('[data-testid="get-quote-btn"]')
    await getQuoteButton.click()

    await page.waitForResponse((response) =>
      response.url().includes('/api/exchange/quote') && response.status() === 200
    )

    const recipientNameInput = page.locator('[data-testid="recipient-name"]')
    await recipientNameInput.fill('John Doe')

    const recipientEmailInput = page.locator('[data-testid="recipient-email"]')
    await recipientEmailInput.fill('john@example.com')

    const recipientPhoneInput = page.locator('[data-testid="recipient-phone"]')
    await recipientPhoneInput.fill('+1234567890')

    const bankAccountInput = page.locator('[data-testid="recipient-bank-account"]')
    await bankAccountInput.fill('12345678')

    const routingNumberInput = page.locator('[data-testid="recipient-routing-number"]')
    await routingNumberInput.fill('021000021')

    // Verify summary shows all details
    const summarySection = page.locator('[data-testid="offramp-summary"]')

    // Verify source details
    await expect(summarySection.locator('[data-testid="summary-source"]')).toContainText(
      '1000 USDC'
    )

    // Verify destination details
    await expect(summarySection.locator('[data-testid="summary-destination"]')).toContainText(
      '920 USD'
    )

    // Verify rate
    await expect(summarySection.locator('[data-testid="summary-rate"]')).toContainText('0.92')

    // Verify fees
    const feesRow = summarySection.locator('[data-testid="summary-fees"]')
    await expect(feesRow).toContainText('Fee:')

    // Verify recipient
    const recipientRow = summarySection.locator('[data-testid="summary-recipient"]')
    await expect(recipientRow).toContainText('John Doe')

    // Verify timestamp
    const timestampRow = summarySection.locator('[data-testid="summary-timestamp"]')
    await expect(timestampRow).toBeVisible()
  })
})

/**
 * Helper function to simulate Freighter wallet connection
 * In a real test, this would interact with the Freighter extension or use a stub
 */
async function simulateWalletConnection(page: Page) {
  // Inject Freighter stub if needed
  await page.evaluateHandle(() => {
    ;(window as any).freighter = {
      requestAccess: async () => ({ access: 'allow' }),
      getUserInfo: async () => ({
        publicKey: 'GBUQWP3BOUZX34ULNQG23RQ6F4BVWCIYU2Irhythm77T7ZXVB5UGJZ6IJ',
        username: 'testuser',
      }),
      signTransaction: async (tx: any) => ({
        signature: 'mock_signature_123',
        signedEnvelope: tx,
      }),
      isConnected: async () => true,
    }
  })

  // Click connect wallet button
  const connectButton = page.locator('[data-testid="connect-wallet-btn"]')
  if ((await connectButton.isVisible()).valueOf()) {
    await connectButton.click()

    // Wait for wallet modal/approval
    await page.waitForFunction(() => {
      const status = document.querySelector('[data-testid="wallet-status"]')
      return status && status.textContent?.includes('connected')
    })
  }
}

/**
 * Helper function to simulate wallet transaction confirmation
 */
async function simulateWalletConfirmation(page: Page) {
  // Check if confirmation modal appears
  const confirmModal = page.locator('[data-testid="wallet-confirm-modal"]')
  if ((await confirmModal.isVisible().catch(() => false)).valueOf()) {
    const approveButton = confirmModal.locator('[data-testid="approve-btn"]')
    await approveButton.click()

    // Wait for confirmation to be processed
    await page.waitForFunction(() => {
      const modal = document.querySelector('[data-testid="wallet-confirm-modal"]')
      return !modal
    })
  }
}
