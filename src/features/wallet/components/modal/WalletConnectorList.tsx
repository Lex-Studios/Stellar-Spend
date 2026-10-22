'use client';

import type { RefObject } from 'react';
import { WalletOptionButton } from './WalletOptionButton';
import type { WalletOption } from './types';

export interface WalletConnectorListProps {
  wallets: WalletOption[];
  /** Ref for the first option, so the modal can focus it on open. */
  firstButtonRef: RefObject<HTMLButtonElement>;
  isConnecting: boolean;
  connectingWallet: WalletOption['type'] | null;
  onConnect: (wallet: WalletOption['type']) => void;
}

/** The list of wallet connector buttons in the wallet modal. */
export function WalletConnectorList({
  wallets,
  firstButtonRef,
  isConnecting,
  connectingWallet,
  onConnect,
}: WalletConnectorListProps) {
  return (
    <div className="p-4 flex flex-col gap-3">
      {wallets.map((wallet, i) => (
        <WalletOptionButton
          key={wallet.type}
          ref={i === 0 ? firstButtonRef : undefined}
          wallet={wallet}
          isConnecting={isConnecting}
          connectingWallet={connectingWallet}
          onConnect={onConnect}
        />
      ))}
    </div>
  );
}
