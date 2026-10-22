import type { ReactNode } from 'react';
import type { WalletType } from '@/lib/stellar';

export interface WalletModalProps {
  isOpen: boolean;
  isConnecting: boolean;
  connectingWallet: WalletType | null;
  error: string | null;
  onConnect: (walletType: WalletType) => void;
  onClose: () => void;
}

export interface WalletOption {
  type: WalletType;
  name: string;
  description: string;
  icon: ReactNode;
  installUrl: string;
}

export interface WalletListProps {
  wallets: WalletOption[];
  isConnecting: boolean;
  connectingWallet: WalletType | null;
  onConnect: (walletType: WalletType) => void;
}

export interface WalletConnectStatusProps {
  isConnecting: boolean;
  connectingWallet: WalletType | null;
  wallets: WalletOption[];
}

export interface WalletErrorProps {
  error: string | null;
}
