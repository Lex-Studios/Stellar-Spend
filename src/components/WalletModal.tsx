/**
 * @deprecated (#1044) — Moved to src/features/wallet/.
 *
 * This file is a re-export shim that keeps existing import paths working.
 * New code should import from '@/features/wallet' instead.
 *
 * Migration:
 *   Before: import { WalletModal } from '@/components/WalletModal'
 *   After:  import { WalletModal } from '@/features/wallet'
 */
export { WalletModal, WALLET_OPTIONS, default } from '@/features/wallet/components/WalletModal';
export type { WalletModalProps, WalletOption } from '@/features/wallet/components/modal/types';
