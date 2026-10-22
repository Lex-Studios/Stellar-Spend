//! Pure fee arithmetic for the fee-manager contract (issue #984).

use soroban_sdk::Env;
use stellar_spend_shared::{
    errors::ContractError,
    validation::{basis_points_of, require_basis_points, require_positive_amount, MAX_BASIS_POINTS},
};

use crate::{DataKey, SCHEMA_VERSION};

/// Fee for `amount` at an explicit rate.
pub fn calculate_fee(env: Env, amount: i128, fee_rate: u32) -> Result<i128, ContractError> {
    require_current_schema(&env)?;
    if paused_flag(&env) {
        return Err(ContractError::Paused);
    }
    require_positive_amount(amount)?;
    require_basis_points(fee_rate, MAX_BASIS_POINTS)?;

    basis_points_of(amount, fee_rate)
}

/// Fee for `amount` at the configured default rate.
pub fn calculate_default_fee(env: Env, amount: i128) -> Result<i128, ContractError> {
    let rate = crate::admin::default_rate(env.clone())?;
    calculate_fee(env, amount, rate)
}

// ── Internal helpers ──────────────────────────────────────────────────────

fn require_current_schema(env: &Env) -> Result<(), ContractError> {
    use stellar_spend_shared::validation::check_schema_version;

    check_schema_version(
        env.storage().instance().get(&DataKey::Schema),
        SCHEMA_VERSION,
    )
}

fn paused_flag(env: &Env) -> bool {
    env.storage()
        .instance()
        .get(&DataKey::Paused)
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;
    use proptest::prelude::*;

    // ── Property-based invariants for fee calculation ──

    /// Invariant: fee should never exceed the amount (with any valid basis points).
    /// For any amount A and rate R (where 0 <= R <= 10000), fee(A, R) <= A.
    proptest! {
        #[test]
        fn fee_never_exceeds_amount(
            amount in 1i128..=1_000_000_000i128,
            rate in 0u32..=MAX_BASIS_POINTS,
        ) {
            let fee = basis_points_of(amount, rate).expect("should not overflow for valid inputs");
            prop_assert!(fee <= amount, "fee {} exceeds amount {}", fee, amount);
        }
    }

    /// Invariant: fee is monotonically increasing with respect to rate.
    /// For any amount A, if R1 < R2, then fee(A, R1) < fee(A, R2).
    proptest! {
        #[test]
        fn fee_monotonic_in_rate(
            amount in 1i128..=1_000_000_000i128,
            rate1 in 0u32..MAX_BASIS_POINTS,
            rate2 in 0u32..=MAX_BASIS_POINTS,
        ) {
            prop_assume!(rate1 < rate2);
            let fee1 = basis_points_of(amount, rate1).unwrap_or(0);
            let fee2 = basis_points_of(amount, rate2).unwrap_or(0);
            prop_assert!(fee1 < fee2, "fee1 {} should be < fee2 {} for rates {} < {}", 
                         fee1, fee2, rate1, rate2);
        }
    }

    /// Invariant: fee at 0% should be 0.
    proptest! {
        #[test]
        fn zero_rate_yields_zero_fee(
            amount in 1i128..=1_000_000_000i128,
        ) {
            let fee = basis_points_of(amount, 0).expect("should not overflow");
            prop_assert_eq!(fee, 0, "0% fee should yield 0 for amount {}", amount);
        }
    }

    /// Invariant: fee at 100% should equal the amount.
    proptest! {
        #[test]
        fn full_rate_yields_full_amount(
            amount in 1i128..=1_000_000_000i128,
        ) {
            let fee = basis_points_of(amount, MAX_BASIS_POINTS).expect("should not overflow");
            prop_assert_eq!(fee, amount, "100% fee should yield amount {} itself", amount);
        }
    }

    /// Invariant: fee is monotonically increasing with respect to amount.
    /// For any rates R, if A1 < A2, then fee(A1, R) < fee(A2, R).
    proptest! {
        #[test]
        fn fee_monotonic_in_amount(
            amount1 in 1i128..=500_000_000i128,
            rate in 0u32..=MAX_BASIS_POINTS,
        ) {
            let amount2 = amount1 * 2;
            let fee1 = basis_points_of(amount1, rate).unwrap_or(0);
            let fee2 = basis_points_of(amount2, rate).unwrap_or(0);
            // We expect fee2 > fee1, but allow for rounding effects with division
            prop_assert!(fee2 >= fee1, "fee for doubled amount {} should be >= original fee {}", fee2, fee1);
        }
    }

    /// Invariant: no overflow for safe input ranges.
    /// Amounts up to 1 billion and rates up to 10000 should not overflow.
    proptest! {
        #[test]
        fn no_overflow_in_safe_range(
            amount in 1i128..=1_000_000_000i128,
            rate in 0u32..=MAX_BASIS_POINTS,
        ) {
            let result = basis_points_of(amount, rate);
            prop_assert!(result.is_ok(), "should not overflow for amount {} rate {}", amount, rate);
        }
    }

    /// Invariant: fee calculation is commutative with scaling.
    /// fee(amount * k, rate) = fee(amount, rate) * k (when no overflow).
    proptest! {
        #[test]
        fn fee_scales_linearly(
            base_amount in 1i128..=10_000_000i128,
            scale in 2i128..=100_000i128,
            rate in 1u32..=MAX_BASIS_POINTS,
        ) {
            let scaled_amount = base_amount.saturating_mul(scale);
            prop_assume!(scaled_amount <= 1_000_000_000_000_000i128); // Ensure we don't overflow
            
            let base_fee = basis_points_of(base_amount, rate).unwrap_or(0);
            let scaled_fee = basis_points_of(scaled_amount, rate).unwrap_or(0);
            let expected_scaled = base_fee.saturating_mul(scale);
            
            // Allow for rounding tolerance due to division
            prop_assert!(
                (scaled_fee - expected_scaled).abs() <= (scale.max(1) as i128),
                "scaled fee {} should approximately equal {} (rounding tolerance: {})",
                scaled_fee, expected_scaled, scale.max(1)
            );
        }
    }

    /// Invariant: small amounts with small rates yield small fees.
    /// For amount < 100 and rate < 100, fee should be < amount.
    proptest! {
        #[test]
        fn small_inputs_yield_small_fees(
            amount in 1i128..=100i128,
            rate in 0u32..=100u32,
        ) {
            let fee = basis_points_of(amount, rate).expect("should not overflow");
            prop_assert!(fee < amount || rate == 0, "small fee {} should be < amount {} for rate {}", fee, amount, rate);
        }
    }
}

