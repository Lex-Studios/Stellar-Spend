/**
 * @deprecated (#1044) — Moved to src/features/wallet/.
 *
 * Re-export shim — keeps existing imports working without changes.
 * New code should import from '@/features/wallet' instead.
 */
export { WalletProvider, useWalletContext } from '@/features/wallet/context/WalletContext';
export type { WalletContextValue } from '@/features/wallet/context/WalletContext';
