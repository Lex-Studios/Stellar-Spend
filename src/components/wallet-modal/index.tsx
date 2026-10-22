import { useCallback, useState } from "react";
import { WalletList } from "./WalletList";
import { WalletConnectStatus } from "./WalletConnectStatus";
import { WalletError } from "./WalletError";
import type {
  Wallet,
  WalletConnectState,
  WalletErrorInfo,
} from "./types";

export type { Wallet, WalletConnectState, WalletErrorInfo };
export { WalletList, WalletConnectStatus, WalletError };

export interface WalletModalProps {
  open: boolean;
  wallets: Wallet[];
  onClose: () => void;
  onConnect?: (wallet: Wallet) => void | Promise<void>;
}

export function WalletModal({
  open,
  wallets,
  onClose,
  onConnect,
}: WalletModalProps) {
  const [connectState, setConnectState] = useState<WalletConnectState>({
    status: "idle",
  });
  const [error, setError] = useState<WalletErrorInfo | null>(null);

  const handleSelect = useCallback(
    async (wallet: Wallet) => {
      setError(null);
      setConnectState({ status: "connecting", walletId: wallet.id });

      try {
        await onConnect?.(wallet);
        setConnectState({ status: "connected", walletId: wallet.id });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to connect wallet";
        setConnectState({ status: "error", walletId: wallet.id, message });
        setError({ message });
      }
    },
    [onConnect],
  );

  const handleRetry = useCallback(() => {
    setError(null);
    setConnectState({ status: "idle" });
  }, []);

  if (!open) {
    return null;
  }

  return (
    <div className="wallet-modal" role="dialog" aria-modal="true">
      <div className="wallet-modal__content">
        <header className="wallet-modal__header">
          <h2 className="wallet-modal__title">Connect a wallet</h2>
          <button
            type="button"
            className="wallet-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <WalletConnectStatus state={connectState} />
        <WalletError error={error} onRetry={handleRetry} />
        <WalletList
          wallets={wallets}
          onSelect={handleSelect}
          selectedId={connectState.walletId}
          disabled={connectState.status === "connecting"}
        />
      </div>
    </div>
  );
}

export default WalletModal;
