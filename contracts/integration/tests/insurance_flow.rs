//! Negative-path integration tests for the insurance / escrow settlement flow.
//!
//! The "insurance flow" in Stellar-Spend is built on top of the escrow contract:
//! a depositor pays a premium by creating a deposit, the settlement authority can
//! `release` it to process a valid claim, and the depositor can `refund` it once
//! the timeout has elapsed if no claim was processed.
//!
//! These tests focus exclusively on **failure paths**:
//!
//! | Test | Scenario | Expected error |
//! |------|----------|----------------|
//! | `claim_after_expiry_*` | Attempting to refund before timeout, or releasing after a deposit has already been refunded | `Expired` / `AlreadyProcessed` |
//! | `double_claim_*` | Releasing or refunding a deposit that was already settled | `AlreadyProcessed` |
//! | `unpaid_premium_*` | Calling `refund` or `release` from an unauthorised address | `Unauthorized` |
//!
//! Each test is self-contained and uses [`escrow::test_utils::EscrowTest`] so
//! that the setup boilerplate stays minimal and the assertions clearly reflect the
//! domain intent.

use escrow::test_utils::{EscrowTest, START_LEDGER};
use escrow::DEFAULT_TIMEOUT_LEDGERS;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::Address;
use stellar_spend_shared::errors::ContractError;

// ── Helpers ───────────────────────────────────────────────────────────────────

/// Create a fresh escrow fixture, place a deposit, and return both together with
/// the deposit id. Using a helper keeps the noise out of each test body.
fn setup_with_deposit(amount: i128) -> (EscrowTest, u64) {
    let t = EscrowTest::setup();
    let id = t.deposit(amount);
    (t, id)
}

// ── Claim after expiry ────────────────────────────────────────────────────────
//
// "Expiry" in the escrow model means either:
//   a) The caller tried to refund *before* the timeout ledger has been reached
//      (the deposit has not yet expired from the depositor's point of view).
//   b) The settlement authority tries to release a deposit that was already
//      refunded by the depositor after the timeout (the release window has
//      effectively expired).

/// A depositor cannot reclaim their premium before the timeout ledger is reached.
///
/// Maps to: client tries to file a refund claim while the insurance policy is
/// still within its coverage window.
#[test]
fn claim_after_expiry_refund_before_timeout_returns_expired() {
    let (t, id) = setup_with_deposit(1_000);

    // Immediately after deposit — well before the deadline.
    assert_eq!(
        t.client().try_refund(&id),
        Err(Ok(ContractError::Expired)),
        "refunding immediately after deposit must fail with Expired"
    );

    // One ledger short of the deadline is still too early.
    t.advance_ledgers(DEFAULT_TIMEOUT_LEDGERS - 1);
    assert_eq!(
        t.client().try_refund(&id),
        Err(Ok(ContractError::Expired)),
        "refunding one ledger before the deadline must still fail with Expired"
    );
}

/// The settlement authority cannot release a deposit once the depositor has
/// already reclaimed it via `refund`.
///
/// Maps to: an insurance claim is submitted after the policy payout has already
/// been returned to the policyholder.
#[test]
fn claim_after_expiry_release_after_refund_returns_already_processed() {
    let (t, id) = setup_with_deposit(1_000);
    let recipient = Address::generate(&t.env);

    // The depositor waits out the timeout and refunds successfully.
    t.advance_past_timeout();
    t.client().refund(&id);
    assert!(t.client().get_deposit(&id).refunded);

    // Any subsequent release attempt must be rejected — the funds are gone.
    assert_eq!(
        t.client().try_release(&id, &recipient),
        Err(Ok(ContractError::AlreadyProcessed)),
        "releasing a refunded deposit must return AlreadyProcessed"
    );
}

// ── Double claim ──────────────────────────────────────────────────────────────
//
// Once a deposit is settled (released *or* refunded) it cannot be settled again.
// This guards against double-spending of the same insurance payout.

/// Releasing the same deposit twice must be rejected on the second attempt.
///
/// Maps to: a settlement authority (or attacker) tries to process the same
/// insurance claim twice to extract funds a second time.
#[test]
fn double_claim_release_twice_returns_already_processed() {
    let (t, id) = setup_with_deposit(2_500);
    let recipient = Address::generate(&t.env);

    // First release — succeeds.
    assert_eq!(t.client().release(&id, &recipient), 2_500);

    // Second release of the same deposit — must be rejected.
    assert_eq!(
        t.client().try_release(&id, &recipient),
        Err(Ok(ContractError::AlreadyProcessed)),
        "a second release of the same deposit must return AlreadyProcessed"
    );
}

/// Refunding the same deposit twice must be rejected on the second attempt.
///
/// Maps to: a depositor (or relay) attempts to claw back their premium twice
/// after the policy window has elapsed.
#[test]
fn double_claim_refund_twice_returns_already_processed() {
    let (t, id) = setup_with_deposit(2_500);

    t.advance_past_timeout();

    // First refund — succeeds.
    assert_eq!(t.client().refund(&id), 2_500);

    // Second refund of the same deposit — must be rejected.
    assert_eq!(
        t.client().try_refund(&id),
        Err(Ok(ContractError::AlreadyProcessed)),
        "a second refund of the same deposit must return AlreadyProcessed"
    );
}

/// After a successful release, any refund attempt (even past the timeout) must
/// also be rejected — the deposit is already consumed.
///
/// Maps to: a depositor tries to recover funds that were already paid out as a
/// settled insurance claim.
#[test]
fn double_claim_refund_after_release_returns_already_processed() {
    let (t, id) = setup_with_deposit(2_500);
    let recipient = Address::generate(&t.env);

    // Settlement authority releases the deposit.
    t.client().release(&id, &recipient);

    // Advance past the timeout so the `Expired` check would not interfere.
    t.advance_past_timeout();

    // Depositor's refund attempt must still be blocked.
    assert_eq!(
        t.client().try_refund(&id),
        Err(Ok(ContractError::AlreadyProcessed)),
        "refunding after a release must return AlreadyProcessed even past the timeout"
    );
}

// ── Unpaid premium (unauthorised claim) ──────────────────────────────────────
//
// "Unpaid premium" in this context means: a caller who is not authorised for the
// operation attempts to claim the funds. There are two sub-cases:
//
//   a) A stranger calls `refund` on a deposit that is not theirs — they have not
//      paid the premium, so they cannot reclaim it.
//   b) A non-admin address calls `release` — only the settlement authority may
//      approve and release an insurance payout.

/// A `refund` call from any address other than the deposit's depositor must be
/// rejected, regardless of whether the timeout has elapsed.
///
/// Maps to: a third party attempts to claw back a premium they did not pay.
#[test]
fn unpaid_premium_refund_by_non_depositor_returns_unauthorized() {
    let (t, id) = setup_with_deposit(500);

    // Advance past the timeout so the `Expired` guard is out of the way — only
    // the auth check should fire.
    t.advance_past_timeout();

    // Simulate a call from a stranger: `mock_all_auths` is already active (set up
    // in `EscrowTest::setup`), so we need to call `refund` *without* the depositor
    // address being the signer. We do this by temporarily switching off mock auth
    // and using a fresh address that has no recorded authorisation.
    //
    // Because `Env::mock_all_auths` cannot be selectively disabled after it is set,
    // we create an independent fixture and seed the deposit manually, using the
    // default `registered_at` which still mocks all auths but inverts who the
    // depositor is so the test exercises the `require_auth` path under mocking.
    //
    // A simpler approach: call `try_refund` from a fixture where the deposit was
    // created by `t.depositor` but we reassert that only `t.depositor` is
    // permitted. The escrow contract calls `depositor.require_auth()` inside
    // `refund`, which under `mock_all_auths` means the call must be *invoked as*
    // the depositor address. We verify this by checking that a second, independent
    // address (t.other) — who did not create the deposit — cannot refund it.
    //
    // Concretely: create a fresh environment *without* mock_all_auths and attempt
    // the refund from a different signer.
    {
        // Fresh fixture without universal auth mocking.
        let env = soroban_sdk::Env::default();
        env.ledger().with_mut(|li| {
            li.sequence_number = START_LEDGER;
            li.min_persistent_entry_ttl = 12_000_000;
            li.min_temp_entry_ttl = 12_000_000;
            li.max_entry_ttl = 12_000_000;
        });

        let contract_id = env.register(escrow::EscrowContract, ());

        let admin = Address::generate(&env);
        let depositor = Address::generate(&env);
        let bridge = Address::generate(&env);
        let stranger = Address::generate(&env);

        // Initialise with explicit auth for each actor.
        env.mock_auths(&[soroban_sdk::testutils::MockAuth {
            address: &admin,
            invoke: &soroban_sdk::testutils::MockAuthInvoke {
                contract: &contract_id,
                fn_name: "init",
                args: (&admin,).into_val(&env),
                sub_invokes: &[],
            },
        }]);
        let client = escrow::EscrowContractClient::new(&env, &contract_id);
        client.init(&admin);

        // Create the deposit as the depositor.
        env.mock_auths(&[soroban_sdk::testutils::MockAuth {
            address: &depositor,
            invoke: &soroban_sdk::testutils::MockAuthInvoke {
                contract: &contract_id,
                fn_name: "deposit",
                args: (&depositor, &500i128, &bridge, &0u32).into_val(&env),
                sub_invokes: &[],
            },
        }]);
        let deposit_id = client.deposit(&depositor, &500, &bridge, &0);

        // Advance past the timeout.
        env.ledger()
            .with_mut(|li| li.sequence_number += DEFAULT_TIMEOUT_LEDGERS + 1);

        // Attempt refund as a stranger — auth for the *stranger* is mocked,
        // but the contract checks that the *depositor*'s auth is present.
        env.mock_auths(&[soroban_sdk::testutils::MockAuth {
            address: &stranger,
            invoke: &soroban_sdk::testutils::MockAuthInvoke {
                contract: &contract_id,
                fn_name: "refund",
                args: (&deposit_id,).into_val(&env),
                sub_invokes: &[],
            },
        }]);

        assert_eq!(
            client.try_refund(&deposit_id),
            Err(Ok(ContractError::Unauthorized)),
            "a stranger calling refund must be rejected with Unauthorized"
        );
    }
}

/// A `release` call from any address other than the settlement authority (admin)
/// must be rejected.
///
/// Maps to: a third party (e.g., the depositor themselves, or an attacker) tries
/// to approve an insurance payout they are not authorised to grant.
#[test]
fn unpaid_premium_release_by_non_admin_returns_unauthorized() {
    // Build an environment where the caller is explicitly *not* the admin.
    let env = soroban_sdk::Env::default();
    env.ledger().with_mut(|li| {
        li.sequence_number = START_LEDGER;
        li.min_persistent_entry_ttl = 12_000_000;
        li.min_temp_entry_ttl = 12_000_000;
        li.max_entry_ttl = 12_000_000;
    });

    let contract_id = env.register(escrow::EscrowContract, ());

    let admin = Address::generate(&env);
    let depositor = Address::generate(&env);
    let bridge = Address::generate(&env);
    let impostor = Address::generate(&env); // not the admin

    // Init.
    env.mock_auths(&[soroban_sdk::testutils::MockAuth {
        address: &admin,
        invoke: &soroban_sdk::testutils::MockAuthInvoke {
            contract: &contract_id,
            fn_name: "init",
            args: (&admin,).into_val(&env),
            sub_invokes: &[],
        },
    }]);
    let client = escrow::EscrowContractClient::new(&env, &contract_id);
    client.init(&admin);

    // Deposit.
    env.mock_auths(&[soroban_sdk::testutils::MockAuth {
        address: &depositor,
        invoke: &soroban_sdk::testutils::MockAuthInvoke {
            contract: &contract_id,
            fn_name: "deposit",
            args: (&depositor, &800i128, &bridge, &0u32).into_val(&env),
            sub_invokes: &[],
        },
    }]);
    let deposit_id = client.deposit(&depositor, &800, &bridge, &0);

    // Attempt release as the impostor — their auth is mocked, but the contract
    // checks that the *admin*'s auth is present via `require_admin`.
    let recipient = Address::generate(&env);
    env.mock_auths(&[soroban_sdk::testutils::MockAuth {
        address: &impostor,
        invoke: &soroban_sdk::testutils::MockAuthInvoke {
            contract: &contract_id,
            fn_name: "release",
            args: (&deposit_id, &recipient).into_val(&env),
            sub_invokes: &[],
        },
    }]);

    assert_eq!(
        client.try_release(&deposit_id, &recipient),
        Err(Ok(ContractError::Unauthorized)),
        "a non-admin calling release must be rejected with Unauthorized"
    );
}

/// Confirm that the positive cases still hold after the negative ones — this is a
/// sanity guard ensuring the test fixture itself is not broken.
#[test]
fn positive_sanity_valid_release_and_refund_succeed() {
    // Release by the legitimate admin succeeds.
    let (t, id_a) = setup_with_deposit(300);
    let recipient = Address::generate(&t.env);
    assert_eq!(t.client().release(&id_a, &recipient), 300);

    // Refund by the depositor after timeout succeeds.
    let (t, id_b) = setup_with_deposit(300);
    t.advance_past_timeout();
    assert_eq!(t.client().refund(&id_b), 300);
}
