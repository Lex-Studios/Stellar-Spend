//! Property-based fuzz tests for escrow deposit amount and fee handling.
//!
//! Addresses issue #1353: "Escrow amount handling could overflow on large inputs."
//!
//! These tests use proptest to drive a wide range of `amount` and `fee_bps`
//! inputs through the deposit/release/refund flow and assert that:
//!
//! 1. No unexpected panics occur — only typed [`ContractError`] values propagate out.
//! 2. Valid inputs always produce a successful deposit.
//! 3. Invalid inputs are rejected with the correct error variant (no panic).
//! 4. Amounts that would overflow the ledger counter are caught cleanly.
//! 5. The contract never accepts zero or negative amounts.
//! 6. The fee basis-point cap of 10_000 is enforced without panicking.
//!
//! The suite runs inside `cargo test` without any special harness — proptest
//! generates inputs at test time and shrinks counterexamples on failure.

use escrow::test_utils::EscrowTest;
use escrow::{MAX_TIMEOUT_LEDGERS, EscrowStatus};
use proptest::prelude::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::Address;
use stellar_spend_shared::errors::ContractError;

// ── Strategy helpers ──────────────────────────────────────────────────────────

/// Valid positive amounts within i128 range.
fn valid_amount_strategy() -> impl Strategy<Value = i128> {
    // Cover small values, boundary values, and large values up to i64::MAX
    // to keep test execution fast while exercising meaningful ranges.
    prop_oneof![
        1i128..=i64::MAX as i128,
        Just(1i128),
        Just(i32::MAX as i128),
        Just(i64::MAX as i128),
        (1i128..=1_000_000_000i128),
    ]
}

/// Valid fee basis points: [0, 10_000].
fn valid_fee_bps_strategy() -> impl Strategy<Value = u32> {
    prop_oneof![
        0u32..=10_000u32,
        Just(0u32),
        Just(1u32),
        Just(5_000u32),
        Just(9_999u32),
        Just(10_000u32),
    ]
}

/// Invalid (non-positive) amounts: zero and negative values.
fn invalid_amount_strategy() -> impl Strategy<Value = i128> {
    prop_oneof![
        Just(0i128),
        (i128::MIN..0i128),
        Just(-1i128),
        Just(i64::MIN as i128),
    ]
}

/// Invalid fee basis points: values strictly above 10_000.
fn invalid_fee_bps_strategy() -> impl Strategy<Value = u32> {
    (10_001u32..=u32::MAX)
}

// ── Acceptance tests (valid inputs) ──────────────────────────────────────────

proptest! {
    /// Any positive amount with a valid fee is accepted without panicking.
    ///
    /// After a successful deposit:
    /// - The returned id is a non-negative integer.
    /// - `get_deposit` returns a record with the exact amount and fee_bps we
    ///   supplied.
    /// - Status is `Pending`.
    #[test]
    fn valid_deposit_never_panics_and_stores_correct_fields(
        amount in valid_amount_strategy(),
        fee_bps in valid_fee_bps_strategy(),
    ) {
        let t = EscrowTest::setup();

        let result = t.client().try_deposit(&t.depositor, &amount, &t.bridge, &fee_bps);
        prop_assert!(result.is_ok(), "valid deposit({amount}, fee={fee_bps}) must succeed, got {result:?}");

        let id = result.unwrap().unwrap();
        let record = t.client().get_deposit(&id);

        prop_assert_eq!(record.amount, amount, "stored amount must equal the input");
        prop_assert_eq!(record.fee_bps, fee_bps, "stored fee_bps must equal the input");
        prop_assert_eq!(record.depositor, t.depositor);
        prop_assert!(
            matches!(record.status, EscrowStatus::Pending),
            "fresh deposit must be Pending"
        );
    }

    /// Multiple deposits from the same depositor all get unique monotonically
    /// increasing ids without any overflow or collision.
    #[test]
    fn sequential_deposits_produce_unique_monotonic_ids(
        amounts in proptest::collection::vec(valid_amount_strategy(), 2..=10),
    ) {
        let t = EscrowTest::setup();
        let mut ids: Vec<u64> = Vec::new();

        for amount in &amounts {
            let id = t.client().deposit(&t.depositor, amount, &t.bridge, &0u32);
            ids.push(id);
        }

        // All ids are unique.
        let unique: std::collections::HashSet<u64> = ids.iter().cloned().collect();
        prop_assert_eq!(unique.len(), ids.len(), "deposit ids must be unique");

        // Ids are strictly monotonically increasing.
        for window in ids.windows(2) {
            prop_assert!(window[0] < window[1], "deposit ids must be strictly increasing");
        }
    }

    /// For valid inputs the full lifecycle (deposit → release) completes without panic.
    ///
    /// Asserts the released amount equals the deposited amount and the status
    /// transitions to Resolved.
    #[test]
    fn valid_deposit_can_be_released_without_panic(
        amount in valid_amount_strategy(),
        fee_bps in valid_fee_bps_strategy(),
    ) {
        let t = EscrowTest::setup();
        let id = t.client().deposit(&t.depositor, &amount, &t.bridge, &fee_bps);

        let recipient = Address::generate(&t.env);
        let released = t.client().release(&id, &recipient);
        prop_assert_eq!(released, amount, "released amount must match deposited amount");

        let record = t.client().get_deposit(&id);
        prop_assert!(
            matches!(record.status, EscrowStatus::Resolved),
            "deposit must be Resolved after release"
        );
    }

    /// For valid inputs the full lifecycle (deposit → refund after timeout) completes.
    #[test]
    fn valid_deposit_can_be_refunded_after_timeout(
        amount in valid_amount_strategy(),
        fee_bps in valid_fee_bps_strategy(),
    ) {
        let t = EscrowTest::setup();
        let id = t.client().deposit(&t.depositor, &amount, &t.bridge, &fee_bps);

        t.advance_past_timeout();
        let refunded = t.client().refund(&id);
        prop_assert_eq!(refunded, amount, "refunded amount must match deposited amount");

        let record = t.client().get_deposit(&id);
        prop_assert!(
            matches!(record.status, EscrowStatus::Cancelled),
            "deposit must be Cancelled after refund"
        );
    }
}

// ── Rejection tests (invalid inputs must not panic) ───────────────────────────

proptest! {
    /// Non-positive amounts are always rejected with `InvalidAmount` — never a panic.
    #[test]
    fn invalid_amount_is_rejected_with_typed_error_not_panic(
        amount in invalid_amount_strategy(),
    ) {
        let t = EscrowTest::setup();

        let result = t.client().try_deposit(&t.depositor, &amount, &t.bridge, &0u32);
        prop_assert_eq!(
            result,
            Err(Ok(ContractError::InvalidAmount)),
            "non-positive amount {amount} must yield InvalidAmount"
        );
    }

    /// Fee basis points above 10_000 are always rejected with `InvalidInput` —
    /// never a panic.
    #[test]
    fn invalid_fee_bps_is_rejected_with_typed_error_not_panic(
        fee_bps in invalid_fee_bps_strategy(),
    ) {
        let t = EscrowTest::setup();

        let result = t.client().try_deposit(&t.depositor, &1i128, &t.bridge, &fee_bps);
        prop_assert_eq!(
            result,
            Err(Ok(ContractError::InvalidInput)),
            "fee_bps {fee_bps} above 10_000 must yield InvalidInput"
        );
    }

    /// Combinations of invalid amount AND invalid fee produce a typed error.
    ///
    /// The validation order in `create::deposit` checks amount first, so the
    /// expected error is `InvalidAmount`.
    #[test]
    fn combined_invalid_inputs_produce_typed_error_not_panic(
        amount in invalid_amount_strategy(),
        fee_bps in invalid_fee_bps_strategy(),
    ) {
        let t = EscrowTest::setup();

        let result = t.client().try_deposit(&t.depositor, &amount, &t.bridge, &fee_bps);
        // Amount is validated before fee_bps in create::deposit.
        prop_assert_eq!(
            result,
            Err(Ok(ContractError::InvalidAmount)),
            "amount validation should take precedence over fee validation"
        );
    }
}

// ── Boundary / edge-case property tests ──────────────────────────────────────

proptest! {
    /// Fee exactly at the boundary (10_000 = 100%) is always accepted.
    #[test]
    fn fee_at_boundary_10000_is_always_valid(amount in valid_amount_strategy()) {
        let t = EscrowTest::setup();
        let result = t.client().try_deposit(&t.depositor, &amount, &t.bridge, &10_000u32);
        prop_assert!(result.is_ok(), "fee=10_000 must always be valid");
    }

    /// Amount of exactly 1 (minimum positive) is always accepted regardless of fee.
    #[test]
    fn amount_1_with_any_valid_fee_is_always_accepted(fee_bps in valid_fee_bps_strategy()) {
        let t = EscrowTest::setup();
        let result = t.client().try_deposit(&t.depositor, &1i128, &t.bridge, &fee_bps);
        prop_assert!(result.is_ok(), "amount=1 with fee={fee_bps} must be accepted");
    }

    /// Depositing the same amount twice from different depositors gives each
    /// their own independent record with the correct depositor address.
    #[test]
    fn two_depositors_have_independent_records(amount in valid_amount_strategy()) {
        let t = EscrowTest::setup();

        let id_a = t.client().deposit(&t.depositor, &amount, &t.bridge, &0u32);
        let id_b = t.client().deposit(&t.other, &amount, &t.bridge, &0u32);

        prop_assert_ne!(id_a, id_b);

        let record_a = t.client().get_deposit(&id_a);
        let record_b = t.client().get_deposit(&id_b);

        prop_assert_eq!(record_a.depositor, t.depositor);
        prop_assert_eq!(record_b.depositor, t.other);
        prop_assert_ne!(record_a.depositor, record_b.depositor);
    }

    /// Release and refund are mutually exclusive for every valid input.
    ///
    /// If a deposit is released, a subsequent refund must return `AlreadyProcessed`.
    /// If a deposit is refunded, a subsequent release must return `AlreadyProcessed`.
    #[test]
    fn release_and_refund_are_mutually_exclusive(amount in 1i128..=1_000_000i128) {
        // Test release-then-refund
        {
            let t = EscrowTest::setup();
            let id = t.client().deposit(&t.depositor, &amount, &t.bridge, &0u32);
            let recipient = Address::generate(&t.env);
            t.client().release(&id, &recipient);
            t.advance_past_timeout();

            let result = t.client().try_refund(&id);
            prop_assert_eq!(
                result,
                Err(Ok(ContractError::AlreadyProcessed)),
                "refund after release must yield AlreadyProcessed"
            );
        }

        // Test refund-then-release
        {
            let t2 = EscrowTest::setup();
            let id2 = t2.client().deposit(&t2.depositor, &amount, &t2.bridge, &0u32);
            t2.advance_past_timeout();
            t2.client().refund(&id2);

            let recipient2 = Address::generate(&t2.env);
            let result2 = t2.client().try_release(&id2, &recipient2);
            prop_assert_eq!(
                result2,
                Err(Ok(ContractError::AlreadyProcessed)),
                "release after refund must yield AlreadyProcessed"
            );
        }
    }
}

// ── Large-value overflow regression tests ────────────────────────────────────
//
// These are targeted non-proptest regression tests that complement the property
// suite with precise boundary values.

/// `i128::MAX` as amount must succeed (no arithmetic in `deposit` involves
/// the amount in a way that could overflow i128 itself).
#[test]
fn amount_i128_max_is_stored_and_returned_correctly() {
    let t = EscrowTest::setup();
    let id = t.client().deposit(&t.depositor, &i128::MAX, &t.bridge, &0u32);
    let record = t.client().get_deposit(&id);
    assert_eq!(record.amount, i128::MAX);
}

/// `i128::MAX` can be released: the returned amount must equal the deposited one.
#[test]
fn amount_i128_max_can_be_released() {
    let t = EscrowTest::setup();
    let id = t.client().deposit(&t.depositor, &i128::MAX, &t.bridge, &0u32);
    let recipient = Address::generate(&t.env);
    let released = t.client().release(&id, &recipient);
    assert_eq!(released, i128::MAX);
}

/// `i128::MAX` can be refunded after the timeout elapses.
#[test]
fn amount_i128_max_can_be_refunded() {
    let t = EscrowTest::setup();
    let id = t.client().deposit(&t.depositor, &i128::MAX, &t.bridge, &0u32);
    t.advance_past_timeout();
    let refunded = t.client().refund(&id);
    assert_eq!(refunded, i128::MAX);
}

/// Ledger-counter overflow is caught and returned as `ContractError::Overflow`.
///
/// Mirrors the arithmetic-guards test in `src/test.rs` but is also exercised
/// here so the fuzz suite explicitly covers the overflow path.
#[test]
fn ledger_overflow_produces_overflow_error_not_panic() {
    let t = EscrowTest::registered_at(u32::MAX - 5_000_000, 1_000_000);
    t.client().init(&t.admin);
    t.client().set_timeout(&MAX_TIMEOUT_LEDGERS);

    let result = t.client().try_deposit(&t.depositor, &1i128, &t.bridge, &0u32);
    assert_eq!(
        result,
        Err(Ok(ContractError::Overflow)),
        "ledger counter overflow must produce ContractError::Overflow, not a panic"
    );
}
