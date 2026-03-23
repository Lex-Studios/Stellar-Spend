import * as freighterApi from '@stellar/freighter-api';

export type WalletType = 'freighter' | 'lobstr';

export interface StellarWallet {
  type: WalletType;
  publicKey: string;
  isConnected: boolean;
}

export class StellarWalletAdapter {
  private walletType: WalletType | null = null;
  private publicKey: string | null = null;

  async isFreighterAvailable(): Promise<boolean> {
    try {
      const result = await freighterApi.isConnected();
      return result.isConnected || (typeof window !== 'undefined' && !!(window as any).freighter);
    } catch {
      return false;
    }
  }

  isLobstrAvailable(): boolean {
    return (
      typeof window !== 'undefined' &&
      (!!(window as any).lobstr || !!(window as any).stellar?.isLobstr)
    );
  }

  async connectFreighter(): Promise<StellarWallet> {
    const connectedResult = await freighterApi.isConnected();
    if (connectedResult.error) throw new Error(connectedResult.error.message);

    let { address: publicKey, error } = await freighterApi.getAddress();
    if (error) throw new Error(error.message);

    if (!publicKey) {
      const access = await freighterApi.requestAccess();
      if (access.error || !access.address)
        throw new Error(access.error?.message || 'No address returned');
      publicKey = access.address;
    }

    this.walletType = 'freighter';
    this.publicKey = publicKey;
    return { type: 'freighter', publicKey, isConnected: true };
  }

  async connectLobstr(): Promise<StellarWallet> {
    const w = window as any;
    const src = w.lobstr ?? (w.stellar?.isLobstr ? w.stellar : null);
    if (!src) throw new Error('Lobstr wallet not found');
    const result = await src.connect();
    this.walletType = 'lobstr';
    this.publicKey = result.publicKey;
    return { type: 'lobstr', publicKey: result.publicKey, isConnected: true };
  }

  async connectAuto(): Promise<StellarWallet> {
    if (await this.isFreighterAvailable()) return this.connectFreighter();
    if (this.isLobstrAvailable()) return this.connectLobstr();
    throw new Error('No Stellar wallet found. Please install Freighter or Lobstr.');
  }

  async signTransaction(xdr: string): Promise<string> {
    if (!this.walletType || !this.publicKey) throw new Error('No wallet connected');

    if (this.walletType === 'freighter') {
      const { signedTxXdr, error } = await freighterApi.signTransaction(xdr, {
        networkPassphrase: 'Public Global Stellar Network ; September 2015',
      });
      if (error || !signedTxXdr) throw new Error(error?.message || 'Signing failed');
      return signedTxXdr;
    }

    const w = window as any;
    const src = w.lobstr ?? (w.stellar?.isLobstr ? w.stellar : null);
    if (!src) throw new Error('Lobstr not available');
    const result = await src.signTransaction(xdr, {
      networkPassphrase: 'Public Global Stellar Network ; September 2015',
    });
    return result.signedXdr;
  }

  getWallet(): StellarWallet | null {
    if (!this.walletType || !this.publicKey) return null;
    return { type: this.walletType, publicKey: this.publicKey, isConnected: true };
  }

  disconnect(): void {
    this.walletType = null;
    this.publicKey = null;
  }
}

let walletAdapter: StellarWalletAdapter | null = null;

export function getStellarWalletAdapter(): StellarWalletAdapter {
  if (!walletAdapter) walletAdapter = new StellarWalletAdapter();
  return walletAdapter;
}
