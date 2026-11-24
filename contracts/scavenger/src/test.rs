//! Scavenger unit tests.
//!
//! Every test opens from a fixture in [`crate::test_utils`]. Assertions use the
//! generated `try_*` client methods so contract errors are checked by value.

use soroban_sdk::{
    symbol_short,
    testutils::{Address as _, Events as _, MockAuth, MockAuthInvoke},
    Address, IntoVal, Vec,
};
use stellar_spend_shared::errors::ContractError;

use crate::{
    test_utils::{assert_fresh_init_is_current, ScavengerTest, START_LEDGER},
    DataKey, ScavengerEntry, SCHEMA_VERSION, SweepStatus,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

fn assert_event<T>(
    event: (
        soroban_sdk::Address,
        soroban_sdk::Vec<soroban_sdk::Val>,
        soroban_sdk::Val,
    ),
    contract: &soroban_sdk::Address,
    env: &soroban_sdk::Env,
    expected_topic: soroban_sdk::Symbol,
    expected_data: T,
) where
    T: soroban_sdk::TryFromVal<soroban_sdk::Env, soroban_sdk::Val>
        + core::cmp::PartialEq
        + core::fmt::Debug,
{
    let (addr, topics, data) = event;
    assert_eq!(addr, *contract);
    let topic_val = topics.get(0).unwrap();
    let expected_val: soroban_sdk::Val =
        soroban_sdk::IntoVal::<soroban_sdk::Env, soroban_sdk::Val>::into_val(&expected_topic, env);
    assert!(topic_val.shallow_eq(&expected_val));
    let decoded: T =
        soroban_sdk::TryFromVal::try_from_val(env, &data).expect("failed to decode event data");
    assert_eq!(decoded, expected_data);
}

// ── Initialisation ────────────────────────────────────────────────────────────

#[test]
fn init_persists_admin_and_schema() {
    let t = ScavengerTest::setup();
    assert_fresh_init_is_current(&t);
    assert_eq!(t.client().schema_version(), SCHEMA_VERSION);
}

#[test]
fn init_is_rejected_twice() {
    let t = ScavengerTest::setup();
    assert_eq!(
        t.client().try_init(&t.other),
        Err(Ok(ContractError::AlreadyInitialized))
    );
}

#[test]
fn entrypoints_reject_an_uninitialised_contract() {
    let t = ScavengerTest::registered();
    assert_eq!(
        t.client().try_register(&t.operator, &t.asset, &100, &t.destination),
        Err(Ok(ContractError::NotInitialized))
    );
}

// ── Pause / emergency-stop (issue #1737) ─────────────────────────────────────

#[test]
fn pause_sets_paused_flag_and_stores_reason() {
    let t = ScavengerTest::setup();
    assert!(!t.client().is_paused());

    t.client()
        .pause(&soroban_sdk::String::from_str(&t.env, "security incident"));

    assert!(t.client().is_paused());
    assert_eq!(
        t.client().get_pause_reason(),
        soroban_sdk::String::from_str(&t.env, "security incident")
    );
}

#[test]
fn unpause_clears_the_flag_and_reason() {
    let t = ScavengerTest::setup();
    t.client()
        .pause(&soroban_sdk::String::from_str(&t.env, "incident"));
    assert!(t.client().is_paused());

    t.client().unpause();

    assert!(!t.client().is_paused());
    assert_eq!(
        t.client().get_pause_reason(),
        soroban_sdk::String::from_str(&t.env, "")
    );
}

#[test]
fn pause_is_idempotent() {
    let t = ScavengerTest::setup();
    t.client()
        .pause(&soroban_sdk::String::from_str(&t.env, "first"));
    // A second pause must succeed without error.
    assert!(t
        .client()
        .try_pause(&soroban_sdk::String::from_str(&t.env, "second"))
        .is_ok());
    assert!(t.client().is_paused());
}

#[test]
fn unpause_is_idempotent() {
    let t = ScavengerTest::setup();
    // Calling unpause on an already-running contract must succeed.
    assert!(t.client().try_unpause().is_ok());
    assert!(!t.client().is_paused());
}

#[test]
fn register_is_blocked_while_paused() {
    let t = ScavengerTest::setup();
    t.client()
        .pause(&soroban_sdk::String::from_str(&t.env, "halt"));
    assert_eq!(
        t.client()
            .try_register(&t.operator, &t.asset, &100, &t.destination),
        Err(Ok(ContractError::Paused))
    );
}

#[test]
fn approve_sweep_is_blocked_while_paused() {
    let t = ScavengerTest::setup();
    let id = t.register(500);
    t.client()
        .pause(&soroban_sdk::String::from_str(&t.env, "halt"));
    assert_eq!(
        t.client().try_approve_sweep(&id),
        Err(Ok(ContractError::Paused))
    );
}

#[test]
fn reject_sweep_is_blocked_while_paused() {
    let t = ScavengerTest::setup();
    let id = t.register(500);
    t.client()
        .pause(&soroban_sdk::String::from_str(&t.env, "halt"));
    assert_eq!(
        t.client().try_reject_sweep(&id),
        Err(Ok(ContractError::Paused))
    );
}

#[test]
fn operations_resume_after_unpause() {
    let t = ScavengerTest::setup();
    t.client()
        .pause(&soroban_sdk::String::from_str(&t.env, "halt"));
    t.client().unpause();

    // register must succeed after unpause.
    assert!(t
        .client()
        .try_register(&t.operator, &t.asset, &100, &t.destination)
        .is_ok());
}

#[test]
fn get_entry_is_readable_while_paused() {
    let t = ScavengerTest::setup();
    let id = t.register(200);
    t.client()
        .pause(&soroban_sdk::String::from_str(&t.env, "halt"));

    // get_entry is a read-only query and must succeed even when paused.
    assert!(t.client().try_get_entry(&id).is_ok());
}

#[test]
fn is_paused_and_get_pause_reason_are_readable_while_paused() {
    let t = ScavengerTest::setup();
    t.client()
        .pause(&soroban_sdk::String::from_str(&t.env, "read-only check"));
    // These are always permitted.
    assert!(t.client().is_paused());
    assert_eq!(
        t.client().get_pause_reason(),
        soroban_sdk::String::from_str(&t.env, "read-only check")
    );
}

#[test]
fn pause_requires_admin_authorisation() {
    let t = ScavengerTest::setup();
    t.env.mock_auths(&[MockAuth {
        address: &t.other,
        invoke: &MockAuthInvoke {
            contract: &t.contract_id,
            fn_name: "pause",
            args: Vec::from_array(
                &t.env,
                [soroban_sdk::String::from_str(&t.env, "x").into_val(&t.env)],
            ),
            sub_invokes: &[],
        },
    }]);
    assert!(
        t.client()
            .try_pause(&soroban_sdk::String::from_str(&t.env, "x"))
            .is_err(),
        "pause must be rejected when a non-admin calls it"
    );
}

#[test]
fn unpause_requires_admin_authorisation() {
    let t = ScavengerTest::setup();
    t.client()
        .pause(&soroban_sdk::String::from_str(&t.env, "halt"));

    t.env.mock_auths(&[MockAuth {
        address: &t.other,
        invoke: &MockAuthInvoke {
            contract: &t.contract_id,
            fn_name: "unpause",
            args: Vec::from_array(&t.env, []),
            sub_invokes: &[],
        },
    }]);
    assert!(
        t.client().try_unpause().is_err(),
        "unpause must be rejected when a non-admin calls it"
    );
}

// ── Register ──────────────────────────────────────────────────────────────────

#[test]
fn register_rejects_zero_and_negative_amounts() {
    let t = ScavengerTest::setup();
    for bad in [0i128, -1, i128::MIN] {
        assert_eq!(
            t.client()
                .try_register(&t.operator, &t.asset, &bad, &t.destination),
            Err(Ok(ContractError::InvalidAmount)),
            "amount {bad} must be rejected"
        );
    }
}

#[test]
fn register_ids_are_unique_and_monotonic() {
    let t = ScavengerTest::setup();
    let first = t.register(100);
    let second = t.register(200);
    let third = t.register(300);
    assert_eq!((first, second, third), (0, 1, 2));
}

#[test]
fn register_persists_a_pending_entry() {
    let t = ScavengerTest::setup();
    let id = t.register(500);
    let entry: ScavengerEntry = t.client().get_entry(&id);

    assert_eq!(entry.amount, 500);
    assert_eq!(entry.asset, t.asset);
    assert_eq!(entry.destination, t.destination);
    assert_eq!(entry.operator, t.operator);
    assert_eq!(entry.registered_at, START_LEDGER);
    assert_eq!(entry.status, SweepStatus::Pending);
}

#[test]
fn get_entry_reports_a_missing_id() {
    let t = ScavengerTest::setup();
    assert_eq!(
        t.client().try_get_entry(&99),
        Err(Ok(ContractError::NotFound))
    );
}

// ── Approve sweep ─────────────────────────────────────────────────────────────

#[test]
fn approve_sweep_marks_entry_swept_and_returns_amount() {
    let t = ScavengerTest::setup();
    let id = t.register(750);
    assert_eq!(t.client().approve_sweep(&id), 750);
    assert_eq!(t.client().get_entry(&id).status, SweepStatus::Swept);
}

#[test]
fn approve_sweep_is_not_repeatable() {
    let t = ScavengerTest::setup();
    let id = t.register(750);
    t.client().approve_sweep(&id);
    assert_eq!(
        t.client().try_approve_sweep(&id),
        Err(Ok(ContractError::AlreadyProcessed))
    );
}

#[test]
fn approve_sweep_on_rejected_entry_is_blocked() {
    let t = ScavengerTest::setup();
    let id = t.register(750);
    t.client().reject_sweep(&id);
    assert_eq!(
        t.client().try_approve_sweep(&id),
        Err(Ok(ContractError::AlreadyProcessed))
    );
}

#[test]
fn approve_sweep_reports_missing_entry() {
    let t = ScavengerTest::setup();
    assert_eq!(
        t.client().try_approve_sweep(&99),
        Err(Ok(ContractError::NotFound))
    );
}

// ── Reject sweep ──────────────────────────────────────────────────────────────

#[test]
fn reject_sweep_marks_entry_rejected() {
    let t = ScavengerTest::setup();
    let id = t.register(300);
    t.client().reject_sweep(&id);
    assert_eq!(t.client().get_entry(&id).status, SweepStatus::Rejected);
}

#[test]
fn reject_sweep_is_not_repeatable() {
    let t = ScavengerTest::setup();
    let id = t.register(300);
    t.client().reject_sweep(&id);
    assert_eq!(
        t.client().try_reject_sweep(&id),
        Err(Ok(ContractError::AlreadyProcessed))
    );
}

#[test]
fn reject_sweep_on_swept_entry_is_blocked() {
    let t = ScavengerTest::setup();
    let id = t.register(300);
    t.client().approve_sweep(&id);
    assert_eq!(
        t.client().try_reject_sweep(&id),
        Err(Ok(ContractError::AlreadyProcessed))
    );
}

// ── Reentrancy guard ──────────────────────────────────────────────────────────

#[test]
fn approve_sweep_is_rejected_while_reentrancy_lock_is_held() {
    let t = ScavengerTest::setup();
    let id = t.register(500);

    t.env.as_contract(&t.contract_id, || {
        t.env.storage().instance().set(&DataKey::Lock, &true);
    });

    assert_eq!(
        t.client().try_approve_sweep(&id),
        Err(Ok(ContractError::Reentrant))
    );

    // Clearing the lock restores normal behaviour.
    t.env.as_contract(&t.contract_id, || {
        t.env.storage().instance().set(&DataKey::Lock, &false);
    });
    assert_eq!(t.client().approve_sweep(&id), 500);
}

#[test]
fn reject_sweep_is_rejected_while_reentrancy_lock_is_held() {
    let t = ScavengerTest::setup();
    let id = t.register(300);

    t.env.as_contract(&t.contract_id, || {
        t.env.storage().instance().set(&DataKey::Lock, &true);
    });

    assert_eq!(
        t.client().try_reject_sweep(&id),
        Err(Ok(ContractError::Reentrant))
    );

    t.env.as_contract(&t.contract_id, || {
        t.env.storage().instance().set(&DataKey::Lock, &false);
    });
    t.client().reject_sweep(&id);
    assert_eq!(t.client().get_entry(&id).status, SweepStatus::Rejected);
}

#[test]
fn approve_sweep_clears_the_lock_on_success() {
    let t = ScavengerTest::setup();
    let id = t.register(200);
    t.client().approve_sweep(&id);

    let locked: bool = t.env.as_contract(&t.contract_id, || {
        t.env
            .storage()
            .instance()
            .get(&DataKey::Lock)
            .unwrap_or(false)
    });
    assert!(!locked, "lock must be cleared after a successful approve_sweep");
}

#[test]
fn reject_sweep_clears_the_lock_on_success() {
    let t = ScavengerTest::setup();
    let id = t.register(200);
    t.client().reject_sweep(&id);

    let locked: bool = t.env.as_contract(&t.contract_id, || {
        t.env
            .storage()
            .instance()
            .get(&DataKey::Lock)
            .unwrap_or(false)
    });
    assert!(!locked, "lock must be cleared after a successful reject_sweep");
}

// ── Event emissions ───────────────────────────────────────────────────────────

#[test]
fn pause_emits_event_with_reason() {
    let t = ScavengerTest::setup();
    let reason = soroban_sdk::String::from_str(&t.env, "fire drill");
    t.client().pause(&reason);

    let events = t.env.events().all();
    let event = events.get(0).unwrap();
    assert_event(event, &t.contract_id, &t.env, symbol_short!("pause"), reason);
}

#[test]
fn unpause_emits_event() {
    let t = ScavengerTest::setup();
    t.client()
        .pause(&soroban_sdk::String::from_str(&t.env, "x"));
    t.client().unpause();

    let events = t.env.events().all();
    // The last event is the unpause event.
    let event = events.get(events.len() - 1).unwrap();
    assert_event(event, &t.contract_id, &t.env, symbol_short!("unpause"), ());
}

#[test]
fn approve_sweep_emits_event_with_entry_id_destination_amount() {
    let t = ScavengerTest::setup();
    let id = t.register(750);
    t.client().approve_sweep(&id);

    let events = t.env.events().all();
    let event = events.get(0).unwrap();
    assert_event(
        event,
        &t.contract_id,
        &t.env,
        symbol_short!("sweep"),
        (id, t.destination.clone(), 750i128),
    );
}

#[test]
fn reject_sweep_emits_event_with_entry_id_and_operator() {
    let t = ScavengerTest::setup();
    let id = t.register(300);
    t.client().reject_sweep(&id);

    let events = t.env.events().all();
    let event = events.get(0).unwrap();
    assert_event(
        event,
        &t.contract_id,
        &t.env,
        symbol_short!("reject"),
        (id, t.operator.clone()),
    );
}

// ── Upgrade / migration ───────────────────────────────────────────────────────

#[test]
fn schema_version_matches_expected_after_init() {
    let t = ScavengerTest::setup();
    assert_eq!(t.client().schema_version(), SCHEMA_VERSION);
}

#[test]
fn migrate_on_current_schema_reports_already_current() {
    let t = ScavengerTest::setup();
    assert_eq!(
        t.client().try_migrate(),
        Err(Ok(ContractError::SchemaAlreadyCurrent))
    );
    assert_eq!(t.client().schema_version(), SCHEMA_VERSION);
}

#[test]
fn upgrade_requires_admin_authorisation() {
    let t = ScavengerTest::setup();
    let new_wasm_hash = soroban_sdk::BytesN::from_array(&t.env, &[7u8; 32]);

    t.env.mock_auths(&[MockAuth {
        address: &t.other,
        invoke: &MockAuthInvoke {
            contract: &t.contract_id,
            fn_name: "upgrade",
            args: Vec::from_array(&t.env, [new_wasm_hash.clone().into_val(&t.env)]),
            sub_invokes: &[],
        },
    }]);

    assert!(
        t.client().try_upgrade(&new_wasm_hash).is_err(),
        "upgrade must be rejected when a non-admin calls it"
    );
}
