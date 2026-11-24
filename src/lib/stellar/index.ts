/**
 * Stellar module exports
 */

export type { WalletType, StellarWallet } from './wallet-adapter';
export { StellarWalletAdapter, getStellarWalletAdapter } from './wallet-adapter';
export { SorobanEventIndexer } from './event-indexer';
export type { SorobanEvent, IndexerState } from './event-indexer';
export {
  createMultiSigTransaction,
  addPartialSignature,
  pruneExpiredSignatures,
  getMultiSigStatus,
  getMultiSigStatusCode,
  getPendingSigners,
  validateMultiSigConfig,
  removeMultiSigTransaction,
} from './multisig';
export type {
  MultiSigSigner,
  MultiSigConfig,
  PartialSignature,
  MultiSigTransactionStatus,
  MultiSigStatusCode,
} from './multisig';
export { ResourceFeeEstimator } from './resource-fee-estimator';
export { StellarClient, getStellarClient, _resetStellarClient } from './client';
export type { RetryConfig, TransactionResponse, AccountResponse } from './client';

// ── Generated contract bindings (issue #1498) ─────────────────────────────────
export {
  ContractError,
  EscrowStatus,
  SweepStatus,
  EscrowEntrypoint,
  FeeManagerEntrypoint,
  MultisigAuthorityEntrypoint,
  TreasuryEntrypoint,
  ScavengerEntrypoint,
  ESCROW_SCHEMA_VERSION,
  FEE_MANAGER_SCHEMA_VERSION,
  MULTISIG_AUTHORITY_SCHEMA_VERSION,
  TREASURY_SCHEMA_VERSION,
  SCAVENGER_SCHEMA_VERSION,
  WORKSPACE_CONTRACTS,
} from './generated-bindings';
export type {
  EscrowDeposit,
  ScavengerEntry,
  EscrowContractClient,
  FeeManagerContractClient,
  MultisigAuthorityContractClient,
  TreasuryContractClient,
  ScavengerContractClient,
  WorkspaceContract,
} from './generated-bindings';
