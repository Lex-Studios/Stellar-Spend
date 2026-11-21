//! Shared storage-key and TTL management helpers.
//!
//! # Typed storage keys
//!
//! All contracts in this workspace follow the convention defined in `lib.rs`:
//! use a `#[contracttype]` enum named `DataKey` instead of plain `Symbol` or
//! string literals. This module provides the shared TTL constants and an
//! `extend_ttl` helper so every contract extends TTL the same way.
//!
//! # TTL policy
//!
//! | Constant                    | Ledgers      | ≈ Wall time (5s close) |
//! |-----------------------------|--------------|------------------------|
//! | [`INSTANCE_TTL_EXTEND_TO`]  | 518 400      | ≈ 30 days              |
//! | [`INSTANCE_TTL_THRESHOLD`]  | 103 680      | ≈ 6 days               |
//! | [`PERSISTENT_TTL_EXTEND_TO`]| 3 110 400    | ≈ 180 days             |
//! | [`PERSISTENT_TTL_THRESHOLD`]| 518 400      | ≈ 30 days              |
//!
//! Call [`extend_instance_ttl`] on every state-changing entrypoint so the
//! contract instance is never evicted while it is in active use.
//! Call [`extend_persistent_ttl`] after writing any persistent storage entry.

use soroban_sdk::Env;

// ── Instance TTL ──────────────────────────────────────────────────────────────

/// Target TTL for instance storage: extend *to* this ledger count (~30 days).
pub const INSTANCE_TTL_EXTEND_TO: u32 = 518_400;

/// Only pay the extension fee when remaining TTL drops below this threshold (~6 days).
pub const INSTANCE_TTL_THRESHOLD: u32 = 103_680;

// ── Persistent TTL ────────────────────────────────────────────────────────────

/// Target TTL for persistent storage entries (~180 days).
pub const PERSISTENT_TTL_EXTEND_TO: u32 = 3_110_400;

/// Only extend persistent entries when remaining TTL drops below ~30 days.
pub const PERSISTENT_TTL_THRESHOLD: u32 = 518_400;

// ── Helpers ───────────────────────────────────────────────────────────────────

/// Extend the contract instance TTL.
///
/// Call this on every state-changing entrypoint. Uses [`INSTANCE_TTL_THRESHOLD`]
/// and [`INSTANCE_TTL_EXTEND_TO`] so all contracts extend by the same amount.
#[inline]
pub fn extend_instance_ttl(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);
}

/// Extend a persistent storage entry's TTL.
///
/// Call this immediately after writing a persistent entry.
#[inline]
pub fn extend_persistent_ttl<K>(env: &Env, key: &K)
where
    K: soroban_sdk::IntoVal<Env, soroban_sdk::Val>,
{
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND_TO);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn instance_threshold_is_less_than_extend_to() {
        assert!(
            INSTANCE_TTL_THRESHOLD < INSTANCE_TTL_EXTEND_TO,
            "threshold must be less than extend_to so TTL is ever actually extended"
        );
    }

    #[test]
    fn persistent_threshold_is_less_than_extend_to() {
        assert!(
            PERSISTENT_TTL_THRESHOLD < PERSISTENT_TTL_EXTEND_TO,
            "threshold must be less than extend_to so TTL is ever actually extended"
        );
    }

    #[test]
    fn instance_extend_to_is_approximately_30_days() {
        // 30 days × 24 h × 60 min × 60 s / 5 s per ledger = 518_400 ledgers
        assert_eq!(INSTANCE_TTL_EXTEND_TO, 518_400);
    }

    #[test]
    fn persistent_extend_to_is_approximately_180_days() {
        // 180 days × 24 h × 60 min × 60 s / 5 s per ledger = 3_110_400 ledgers
        assert_eq!(PERSISTENT_TTL_EXTEND_TO, 3_110_400);
    }
}
