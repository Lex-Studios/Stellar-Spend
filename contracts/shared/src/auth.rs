//! Shared authorisation helpers for Stellar-Spend contracts.
//!
//! Both `multisig-authority` and `treasury` previously duplicated
//! signer/threshold logic.  This module provides a single, well-tested
//! implementation that every contract can depend on.
//!
//! # Design
//! - All helpers take `&Env` plus the relevant storage keys as `&str` so they
//!   remain storage-layout-agnostic; each contract controls its own key names.
//! - The helpers **only** check – they do not mutate storage.  State changes
//!   remain the responsibility of the calling contract so the control-flow
//!   stays clear.
//!
//! # Policy invariants
//! These invariants are intentional and must hold for every valid threshold setup:
//! - For any `value`, if `high_value_limit > 0 && value <= high_value_limit`, the
//!   required threshold is exactly 1.
//! - Otherwise the required threshold is the full quorum threshold.
//! - `verify_threshold` must accept iff `sig_count >= required_threshold(...)`.

use soroban_sdk::{Address, Env, Symbol, Vec};

use crate::{errors::ContractError, policy::{required_threshold, verify_threshold}};

// ── Signer / admin checks ─────────────────────────────────────────────────────

/// Returns `Ok(())` if `addr` is present in the signer list stored under
/// `signers_key`, otherwise `Err(ContractError::Unauthorized)`.
///
/// # Panics
/// Panics (via `ok_or`) only if the storage key is absent, which is a contract
/// initialisation bug rather than a user error.
pub fn assert_is_signer(env: &Env, addr: &Address, signers_key: &str) -> Result<(), ContractError> {
    let signers: Vec<Address> = env
        .storage()
        .instance()
        .get(&Symbol::new(env, signers_key))
        .ok_or(ContractError::NotFound)?;

    if signers.contains(addr.clone()) {
        Ok(())
    } else {
        Err(ContractError::Unauthorized)
    }
}

/// Returns `Ok(())` if `addr` matches the single admin address stored under
/// `admin_key`, otherwise `Err(ContractError::Unauthorized)`.
pub fn assert_is_admin(env: &Env, addr: &Address, admin_key: &str) -> Result<(), ContractError> {
    let admin: Address = env
        .storage()
        .instance()
        .get(&Symbol::new(env, admin_key))
        .ok_or(ContractError::NotFound)?;

    if admin == *addr {
        Ok(())
    } else {
        Err(ContractError::Unauthorized)
    }
}

// ── Threshold verification ────────────────────────────────────────────────────

/// Compute the required threshold for a given `value` and return it.
///
/// The policy logic is isolated in `crate::policy` so the auth layer can remain
/// storage-focused while business rules stay in one place.
pub use crate::policy::{required_threshold, verify_threshold};

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use proptest::prelude::*;

    // ── required_threshold ────────────────────────────────────────────────────

    #[test]
    fn threshold_zero_signers_is_full() {
        // high_value_limit = 0 means "always use full threshold"
        assert_eq!(required_threshold(3, 0, 1_000), 3);
    }

    #[test]
    fn threshold_value_below_limit_returns_one() {
        assert_eq!(required_threshold(3, 1_000, 500), 1);
    }

    #[test]
    fn threshold_value_at_limit_returns_one() {
        // Boundary: value == high_value_limit → 1 signature
        assert_eq!(required_threshold(3, 1_000, 1_000), 1);
    }

    #[test]
    fn threshold_value_above_limit_returns_full() {
        assert_eq!(required_threshold(3, 1_000, 1_001), 3);
    }

    #[test]
    fn threshold_full_threshold_is_one() {
        // Edge: full_threshold = 1 (single-signer quorum)
        assert_eq!(required_threshold(1, 0, 9_999), 1);
    }

    #[test]
    fn threshold_large_full_value() {
        // High-value with no limit override
        assert_eq!(required_threshold(5, 0, i128::MAX), 5);
    }

    // ── verify_threshold ──────────────────────────────────────────────────────

    #[test]
    fn verify_exact_threshold_passes() {
        assert!(verify_threshold(3, 3, 0, 9_999).is_ok());
    }

    #[test]
    fn verify_above_threshold_passes() {
        assert!(verify_threshold(4, 3, 0, 9_999).is_ok());
    }

    #[test]
    fn verify_below_threshold_fails() {
        let err = verify_threshold(2, 3, 0, 9_999).unwrap_err();
        assert_eq!(err, ContractError::BelowThreshold);
    }

    #[test]
    fn verify_zero_signers_fails() {
        // 0 signatures always below any positive threshold
        let err = verify_threshold(0, 1, 0, 0).unwrap_err();
        assert_eq!(err, ContractError::BelowThreshold);
    }

    #[test]
    fn verify_low_value_only_needs_one_sig() {
        // full_threshold = 5, but value <= high_value_limit → only 1 needed
        assert!(verify_threshold(1, 5, 1_000, 500).is_ok());
    }

    #[test]
    fn verify_low_value_zero_sigs_still_fails() {
        // Even for low-value ops, 0 sigs is insufficient
        let err = verify_threshold(0, 5, 1_000, 500).unwrap_err();
        assert_eq!(err, ContractError::BelowThreshold);
    }

    proptest! {
        #[test]
        fn required_threshold_policy_invariant_holds(
            full_threshold in 1u32..=32u32,
            high_value_limit in 0i128..=1_000_000_000i128,
            value in 0i128..=1_000_000_000i128,
        ) {
            let required = required_threshold(full_threshold, high_value_limit, value);
            if high_value_limit > 0 && value <= high_value_limit {
                prop_assert_eq!(required, 1);
            } else {
                prop_assert_eq!(required, full_threshold);
            }
        }

        #[test]
        fn verify_threshold_matches_the_policy_invariant(
            sig_count in 0u32..=32u32,
            full_threshold in 1u32..=32u32,
            high_value_limit in 0i128..=1_000_000_000i128,
            value in 0i128..=1_000_000_000i128,
        ) {
            let required = required_threshold(full_threshold, high_value_limit, value);
            let ok = verify_threshold(sig_count, full_threshold, high_value_limit, value);

            if sig_count >= required {
                prop_assert!(ok.is_ok());
            } else {
                prop_assert_eq!(ok.unwrap_err(), ContractError::BelowThreshold);
            }
        }
    }
}
