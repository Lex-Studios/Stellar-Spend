import type { Wallet } from "./types";

export interface WalletListProps {
  wallets: Wallet[];
  onSelect: (wallet: Wallet) => void;
  selectedId?: string;
  disabled?: boolean;
}

export function WalletList({
  wallets,
  onSelect,
  selectedId,
  disabled = false,
}: WalletListProps) {
  if (wallets.length === 0) {
    return <p className="wallet-list__empty">No wallets available.</p>;
  }

  return (
    <ul className="wallet-list">
      {wallets.map((wallet) => (
        <li key={wallet.id} className="wallet-list__item">
          <button
            type="button"
            className="wallet-list__button"
            onClick={() => onSelect(wallet)}
            disabled={disabled}
            aria-pressed={selectedId === wallet.id}
          >
            {wallet.icon ? (
              <img
                className="wallet-list__icon"
                src={wallet.icon}
                alt=""
                width={24}
                height={24}
              />
            ) : null}
            <span className="wallet-list__name">{wallet.name}</span>
            {wallet.description ? (
              <span className="wallet-list__description">
                {wallet.description}
              </span>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  );
}

export default WalletList;
