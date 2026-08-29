//! Shared numeric constants reused across Stellar-Spend contracts.

/// Instance TTL extension (~30 days) applied on state-changing calls.
pub const INSTANCE_TTL_EXTEND_TO: u32 = 518_400;

/// Only pay to extend when remaining TTL drops below ~6 days.
pub const INSTANCE_TTL_THRESHOLD: u32 = 103_680;

/// Basis points denominator (100%).
pub const MAX_BASIS_POINTS: u32 = 10_000;

/// Upper bound on a multisig signer set, keeping signer-list scans within a
/// predictable instruction budget.
pub const MAX_SIGNERS: u32 = 20;
