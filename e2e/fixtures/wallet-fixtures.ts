/**
 * Wallet fixtures for E2E tests
 * Provides mock wallet implementations and test data
 */

import type { Page } from '@playwright/test';

export const WALLET_ADDRESSES = {
  freighter: 'GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI',
  albedo: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
  test1: 'GCZJM35NKGVK47BB4SPBDV25477PZYIYPVVG453LPYFNXLS3FGHDXOCM',
  test2: 'GC2BKLYOOYPDEFJKLKY6FNNRQMGFLVHJKQRGNSSRRGSMPGF32LHCQVGF',
};

/**
 * Inject Freighter wallet stub for testing
 */
export async function injectFreighterStub(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Mock Freighter API
    (window as any).freighterApi = {
      isConnected: async () => true,
      getPublicKey: async () => 'GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI',
      signTransaction: async (xdr: string) => xdr,
      signAuthEntry: async (xdr: string) => xdr,
      getNetwork: async () => 'TESTNET',
      getNetworkDetails: async () => ({
        network: 'TESTNET',
        networkPassphrase: 'Test SDF Network ; September 2015',
        networkUrl: 'https://horizon-testnet.stellar.org',
      }),
    };

    // Indicate Freighter is installed
    (window as any).isFreighterInstalled = true;
  });
}

/**
 * Inject Albedo wallet stub for testing
 */
export async function injectAlbedoStub(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Mock Albedo API
    (window as any).albedo = {
      publicKey: async () => ({
        pubkey: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        signed_message: '',
      }),
      tx: async ({ xdr }: { xdr: string }) => ({
        xdr,
        tx_hash: 'mock_tx_hash_' + Date.now(),
        network: 'testnet',
      }),
      trust: async () => ({
        result: 'success',
      }),
    };
  });
}

/**
 * Mock Horizon account data
 */
export async function mockHorizonAccount(
  page: Page,
  address: string = WALLET_ADDRESSES.freighter,
  options: {
    balance?: string;
    sequenceNumber?: string;
  } = {}
): Promise<void> {
  const { balance = '10000', sequenceNumber = '123456789' } = options;

  await page.route('**/horizon/**/accounts/**', async (route) => {
    if (route.request().url().includes(address)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: address,
          account_id: address,
          sequence: sequenceNumber,
          balances: [
            {
              balance: balance,
              asset_type: 'native',
            },
            {
              balance: '5000.0000000',
              asset_type: 'credit_alphanum4',
              asset_code: 'USDC',
              asset_issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
            },
          ],
          subentry_count: 0,
          thresholds: {
            low_threshold: 0,
            med_threshold: 0,
            high_threshold: 0,
          },
          flags: {
            auth_required: false,
            auth_revocable: false,
            auth_immutable: false,
          },
          signers: [
            {
              weight: 1,
              key: address,
              type: 'ed25519_public_key',
            },
          ],
        }),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock Horizon transaction submission
 */
export async function mockHorizonSubmit(
  page: Page,
  options: {
    success?: boolean;
    txHash?: string;
  } = {}
): Promise<void> {
  const { success = true, txHash = 'mock_tx_' + Date.now() } = options;

  await page.route('**/horizon/**/transactions', async (route) => {
    if (route.request().method() === 'POST') {
      if (success) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            hash: txHash,
            ledger: 123456,
            envelope_xdr: 'mock_envelope_xdr',
            result_xdr: 'mock_result_xdr',
            result_meta_xdr: 'mock_meta_xdr',
          }),
        });
      } else {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            type: 'transaction_failed',
            title: 'Transaction Failed',
            status: 400,
            detail: 'Mock transaction failure for testing',
          }),
        });
      }
    } else {
      await route.continue();
    }
  });
}

/**
 * Setup complete wallet environment (Freighter + Horizon)
 */
export async function setupWalletEnvironment(
  page: Page,
  options: {
    walletType?: 'freighter' | 'albedo';
    balance?: string;
    mockSubmit?: boolean;
  } = {}
): Promise<void> {
  const { walletType = 'freighter', balance = '10000', mockSubmit = false } = options;

  if (walletType === 'freighter') {
    await injectFreighterStub(page);
  } else {
    await injectAlbedoStub(page);
  }

  const address = walletType === 'freighter' ? WALLET_ADDRESSES.freighter : WALLET_ADDRESSES.albedo;
  await mockHorizonAccount(page, address, { balance });

  if (mockSubmit) {
    await mockHorizonSubmit(page);
  }
}

/**
 * Wait for wallet connection to complete
 */
export async function waitForWalletConnection(page: Page, timeout = 10000): Promise<void> {
  await page.waitForSelector('[data-testid="wallet-button"]', { timeout });
}

/**
 * Connect wallet via UI
 */
export async function connectWallet(
  page: Page,
  walletType: 'freighter' | 'albedo' = 'freighter'
): Promise<void> {
  await page.click('[data-testid="connect-wallet-button"]');
  await page.waitForSelector('[data-testid="wallet-modal"]', { timeout: 5000 });
  
  const walletOption = page.locator(`[data-testid="wallet-option-${walletType}"]`);
  await walletOption.click();
  
  await waitForWalletConnection(page);
}

/**
 * Disconnect wallet via UI
 */
export async function disconnectWallet(page: Page): Promise<void> {
  await page.click('[data-testid="wallet-button"]');
  
  const disconnectButton = page.locator('[data-testid="disconnect-wallet-button"], button:has-text("Disconnect")');
  await disconnectButton.click();
  
  await page.waitForSelector('[data-testid="connect-wallet-button"]', { timeout: 5000 });
}
