//! Shared input-validation helpers (issue #816).
//!
//! Every contract entrypoint that accepts an amount, rate, or string argument runs
//! it through one of these rather than hand-rolling the check inline, so the same
//! bound is enforced the same way everywhere.

use soroban_sdk::{Address, String, Vec};

use crate::errors::ContractError;

/// Basis points denominator (100%).
pub const MAX_BASIS_POINTS: u32 = 10_000;

/// Rejects zero and negative amounts.
pub fn require_positive_amount(amount: i128) -> Result<(), ContractError> {
    if amount <= 0 {
        return Err(ContractError::InvalidAmount);
    }
    Ok(())
}

/// Rejects negative amounts while permitting zero.
pub fn require_non_negative_amount(amount: i128) -> Result<(), ContractError> {
    if amount < 0 {
        return Err(ContractError::InvalidAmount);
    }
    Ok(())
}

/// Rejects basis-point values above `max_bp`, and always above [`MAX_BASIS_POINTS`]
/// regardless of what `max_bp` permits.
pub fn require_basis_points(bp: u32, max_bp: u32) -> Result<(), ContractError> {
    if bp > max_bp || bp > MAX_BASIS_POINTS {
        return Err(ContractError::InvalidInput);
    }
    Ok(())
}

/// Rejects `value` outside the inclusive range `min..=max`.
pub fn require_range_u32(value: u32, min: u32, max: u32) -> Result<(), ContractError> {
    if !(min..=max).contains(&value) {
        return Err(ContractError::InvalidInput);
    }
    Ok(())
}

/// Rejects empty strings and strings longer than `max_len` bytes.
///
/// Unbounded strings are a storage-cost hazard once persisted or echoed into an
/// event topic.
pub fn require_string_len(value: &String, max_len: u32) -> Result<(), ContractError> {
    if value.is_empty() {
        return Err(ContractError::InvalidInput);
    }
    if value.len() > max_len {
        return Err(ContractError::InvalidInput);
    }
    Ok(())
}

/// Rejects a `Vec<Address>` containing the same address more than once.
///
/// `Vec::contains` is linear, making this quadratic; only use on small, bounded
/// sets (signer lists), not user-supplied collections.
pub fn require_unique_addresses(addresses: &Vec<Address>) -> Result<(), ContractError> {
    let len = addresses.len();
    for i in 0..len {
        let candidate = addresses.get_unchecked(i);
        for j in (i + 1)..len {
            if addresses.get_unchecked(j) == candidate {
                return Err(ContractError::InvalidInput);
            }
        }
    }
    Ok(())
}

/// Checked `amount * bp / MAX_BASIS_POINTS`.
///
/// Callers must have already validated `amount` as non-negative; this stays
/// defensive since it guards value movement.
pub fn basis_points_of(amount: i128, bp: u32) -> Result<i128, ContractError> {
    require_non_negative_amount(amount)?;
    amount
        .checked_mul(bp as i128)
        .and_then(|scaled| scaled.checked_div(MAX_BASIS_POINTS as i128))
        .ok_or(ContractError::Overflow)
}

/// Reads a stored schema version against `current`, distinguishing "never
/// initialised" from "needs migration" from "too new for this build".
pub fn check_schema_version(stored: Option<u32>, current: u32) -> Result<(), ContractError> {
    match stored {
        None => Err(ContractError::NotInitialized),
        Some(v) if v > current => Err(ContractError::SchemaVersionUnsupported),
        Some(v) if v < current => Err(ContractError::MigrationRequired),
        Some(_) => Ok(()),
    }
}

/// Upper bound on a multisig signer set, keeping [`require_unique_addresses`] and
/// similar linear scans within a predictable instruction budget.
pub const MAX_SIGNERS: u32 = 20;

/// Rejects an empty address vector.
///
/// Used in multisig initialization and similar contexts where at least one address is required.
pub fn require_non_empty_addresses(addresses: &Vec<Address>) -> Result<(), ContractError> {
    if addresses.is_empty() {
        return Err(ContractError::InvalidInput);
    }
    Ok(())
}

/// Validates that `count > 0` and `count <= max_count`.
///
/// Used for threshold validation (must be at least 1, must not exceed signer count).
pub fn require_valid_threshold(count: u32, max_count: u32) -> Result<(), ContractError> {
    if count == 0 || count > max_count {
        return Err(ContractError::InvalidInput);
    }
    Ok(())
}

/// Rejects negative amounts and performs an overflow-safe checked addition.
///
/// Used when computing timeout ledgers, proposal expiry, and similar future ledger calculations.
pub fn checked_add_ledgers(current: u32, offset: u32) -> Result<u32, ContractError> {
    current.checked_add(offset).ok_or(ContractError::Overflow)
}

/// Rejects amounts outside the range [0, max_value].
///
/// Used for bounded integer values like thresholds and configuration parameters.
pub fn require_bounded_amount(amount: i128, max_value: i128) -> Result<(), ContractError> {
    if amount < 0 || amount > max_value {
        return Err(ContractError::InvalidInput);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use proptest::prelude::*;
    use soroban_sdk::{testutils::Address as _, vec, Env};

    #[test]
    fn positive_amount_rejects_zero_and_negative() {
        assert_eq!(
            require_positive_amount(0),
            Err(ContractError::InvalidAmount)
        );
        assert_eq!(
            require_positive_amount(-1),
            Err(ContractError::InvalidAmount)
        );
        assert_eq!(require_positive_amount(1), Ok(()));
    }

    #[test]
    fn basis_points_respects_both_ceilings() {
        assert_eq!(require_basis_points(500, 500), Ok(()));
        assert_eq!(
            require_basis_points(501, 500),
            Err(ContractError::InvalidInput)
        );
        assert_eq!(
            require_basis_points(20_000, u32::MAX),
            Err(ContractError::InvalidInput),
            "a caller ceiling above 100% cannot widen the absolute cap"
        );
    }

    #[test]
    fn string_len_rejects_empty_and_oversize() {
        let env = Env::default();
        assert_eq!(
            require_string_len(&String::from_str(&env, ""), 8),
            Err(ContractError::InvalidInput)
        );
        assert_eq!(
            require_string_len(&String::from_str(&env, "abcdefghi"), 8),
            Err(ContractError::InvalidInput)
        );
        assert_eq!(
            require_string_len(&String::from_str(&env, "abcdefgh"), 8),
            Ok(())
        );
    }

    #[test]
    fn unique_addresses_detects_a_repeat() {
        let env = Env::default();
        let a = Address::generate(&env);
        let b = Address::generate(&env);
        assert_eq!(
            require_unique_addresses(&vec![&env, a.clone(), b.clone()]),
            Ok(())
        );
        assert_eq!(
            require_unique_addresses(&vec![&env, a.clone(), b, a]),
            Err(ContractError::InvalidInput)
        );
    }

    #[test]
    fn basis_points_of_computes_and_guards_overflow() {
        assert_eq!(basis_points_of(1_000_000, 50), Ok(5_000));
        assert_eq!(
            basis_points_of(i128::MAX, 10_000),
            Err(ContractError::Overflow)
        );
        assert_eq!(basis_points_of(-1, 50), Err(ContractError::InvalidAmount));
    }

    #[test]
    fn schema_version_distinguishes_forward_and_backward_drift() {
        assert_eq!(
            check_schema_version(None, 2),
            Err(ContractError::NotInitialized)
        );
        assert_eq!(
            check_schema_version(Some(1), 2),
            Err(ContractError::MigrationRequired)
        );
        assert_eq!(check_schema_version(Some(2), 2), Ok(()));
        assert_eq!(
            check_schema_version(Some(3), 2),
            Err(ContractError::SchemaVersionUnsupported)
        );
    }

    #[test]
    fn non_empty_addresses_rejects_empty_vec() {
        let env = Env::default();
        let empty_vec: Vec<Address> = vec![&env];
        assert_eq!(
            require_non_empty_addresses(&empty_vec),
            Err(ContractError::InvalidInput)
        );

        let addr = Address::generate(&env);
        let non_empty = vec![&env, addr];
        assert_eq!(require_non_empty_addresses(&non_empty), Ok(()));
    }

    #[test]
    fn valid_threshold_rejects_zero_and_overflow() {
        assert_eq!(
            require_valid_threshold(0, 5),
            Err(ContractError::InvalidInput),
            "threshold must not be zero"
        );
        assert_eq!(
            require_valid_threshold(6, 5),
            Err(ContractError::InvalidInput),
            "threshold must not exceed max_count"
        );
        assert_eq!(require_valid_threshold(1, 5), Ok(()));
        assert_eq!(require_valid_threshold(5, 5), Ok(()));
    }

    #[test]
    fn checked_add_ledgers_handles_overflow() {
        assert_eq!(checked_add_ledgers(100, 200), Ok(300));
        assert_eq!(
            checked_add_ledgers(u32::MAX, 1),
            Err(ContractError::Overflow)
        );
    }

    #[test]
    fn bounded_amount_validates_range() {
        assert_eq!(require_bounded_amount(-1, 1000), Err(ContractError::InvalidInput));
        assert_eq!(require_bounded_amount(1001, 1000), Err(ContractError::InvalidInput));
        assert_eq!(require_bounded_amount(0, 1000), Ok(()));
        assert_eq!(require_bounded_amount(500, 1000), Ok(()));
        assert_eq!(require_bounded_amount(1000, 1000), Ok(()));
    }

    // ── Property-based invariants for basis_points_of ──

    proptest! {
        /// Invariant: basis_points_of never overflows for reasonable input sizes.
        /// Amounts up to 1 billion and basis points up to 10000 should always succeed.
        #[test]
        fn basis_points_no_overflow_in_safe_range(
            amount in 0i128..=1_000_000_000i128,
            bp in 0u32..=MAX_BASIS_POINTS,
        ) {
            let result = basis_points_of(amount, bp);
            prop_assert!(result.is_ok(), "should not overflow for amount {} bp {}", amount, bp);
        }

        /// Invariant: basis_points_of(0, rate) = 0 for any valid rate.
        #[test]
        fn basis_points_zero_amount_yields_zero(bp in 0u32..=MAX_BASIS_POINTS) {
            let result = basis_points_of(0, bp).expect("should not overflow");
            prop_assert_eq!(result, 0);
        }

        /// Invariant: basis_points_of(amount, 0) = 0 for any valid amount.
        #[test]
        fn basis_points_zero_rate_yields_zero(amount in 0i128..=1_000_000_000i128) {
            let result = basis_points_of(amount, 0).expect("should not overflow");
            prop_assert_eq!(result, 0);
        }

        /// Invariant: basis_points_of(amount, MAX_BASIS_POINTS) = amount.
        #[test]
        fn basis_points_full_rate_yields_amount(amount in 0i128..=1_000_000_000i128) {
            let result = basis_points_of(amount, MAX_BASIS_POINTS).expect("should not overflow");
            prop_assert_eq!(result, amount);
        }

        /// Invariant: result is monotonically increasing with rate.
        /// For amount A and rates R1 < R2: basis_points_of(A, R1) <= basis_points_of(A, R2).
        #[test]
        fn basis_points_monotonic_in_rate(
            amount in 0i128..=1_000_000_000i128,
            rate1 in 0u32..MAX_BASIS_POINTS,
            rate2 in 0u32..=MAX_BASIS_POINTS,
        ) {
            prop_assume!(rate1 < rate2);
            let result1 = basis_points_of(amount, rate1).unwrap_or(0);
            let result2 = basis_points_of(amount, rate2).unwrap_or(0);
            prop_assert!(result1 <= result2, "{} should be <= {}", result1, result2);
        }

        /// Invariant: result is monotonically increasing with amount.
        /// For rate R and amounts A1 < A2: basis_points_of(A1, R) <= basis_points_of(A2, R).
        #[test]
        fn basis_points_monotonic_in_amount(
            amount1 in 0i128..=500_000_000i128,
            rate in 0u32..=MAX_BASIS_POINTS,
        ) {
            let amount2 = amount1 * 2;
            let result1 = basis_points_of(amount1, rate).unwrap_or(0);
            let result2 = basis_points_of(amount2, rate).unwrap_or(0);
            prop_assert!(result1 <= result2, "{} should be <= {}", result1, result2);
        }

        /// Invariant: result never exceeds amount.
        /// For any amount A and rate R: basis_points_of(A, R) <= A.
        #[test]
        fn basis_points_never_exceeds_amount(
            amount in 0i128..=1_000_000_000i128,
            rate in 0u32..=MAX_BASIS_POINTS,
        ) {
            let result = basis_points_of(amount, rate).unwrap_or(0);
            prop_assert!(result <= amount, "{} exceeds {}", result, amount);
        }
    }
}
