/**
 * Wallet Manager - Handles wallet switching and auto-detection
 */

import { WalletAdapter, WalletType, WalletConnection, SignOptions } from './adapter';
import { FreighterAdapter } from './freighter.adapter';
import { LobstrAdapter } from './lobstr.adapter';

export class WalletManager {
  private adapters: Map<WalletType, WalletAdapter> = new Map();
  private currentAdapter: WalletAdapter | null = null;

  constructor() {
    this.registerAdapter(new FreighterAdapter());
    this.registerAdapter(new LobstrAdapter());
  }

  private registerAdapter(adapter: WalletAdapter): void {
    this.adapters.set(adapter.type, adapter);
  }

  /**
   * Auto-detect and connect to the first available wallet
   */
  async autoConnect(): Promise<WalletConnection> {
    for (const [, adapter] of this.adapters) {
      if (adapter.isAvailable) {
        return this.connect(adapter.type);
      }
    }
    throw new Error('No wallet extension detected. Please install Freighter or Lobstr.');
  }

  /**
   * Connect to a specific wallet type
   */
  async connect(walletType: WalletType): Promise<WalletConnection> {
    const adapter = this.adapters.get(walletType);
    if (!adapter) {
      throw new Error(`Unknown wallet type: ${walletType}`);
    }

    const connection = await adapter.connect();
    this.currentAdapter = adapter;
    return connection;
  }

  /**
   * Disconnect from current wallet
   */
  async disconnect(): Promise<void> {
    if (this.currentAdapter) {
      await this.currentAdapter.disconnect();
      this.currentAdapter = null;
    }
  }

  /**
   * Sign a transaction with the current wallet
   */
  async signTransaction(xdr: string, opts: SignOptions): Promise<string> {
    if (!this.currentAdapter) {
      throw new Error('No wallet connected. Please connect first.');
    }
    return this.currentAdapter.signTransaction(xdr, opts);
  }

  /**
   * Get the public key of the current wallet
   */
  async getPublicKey(): Promise<string> {
    if (!this.currentAdapter) {
      throw new Error('No wallet connected. Please connect first.');
    }
    return this.currentAdapter.getPublicKey();
  }

  /**
   * Get the current wallet type
   */
  getCurrentWalletType(): WalletType | null {
    return this.currentAdapter?.type ?? null;
  }

  /**
   * Check if a wallet type is available
   */
  isWalletAvailable(walletType: WalletType): boolean {
    const adapter = this.adapters.get(walletType);
    return adapter?.isAvailable ?? false;
  }

  /**
   * Get all available wallets
   */
  getAvailableWallets(): WalletAdapter[] {
    return Array.from(this.adapters.values()).filter(adapter => adapter.isAvailable);
  }
}

export const walletManager = new WalletManager();
