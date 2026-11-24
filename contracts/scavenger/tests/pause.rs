//! Integration tests for the pause/emergency-stop feature (issue #1737).
//!
//! These tests verify the pause mechanism from the outside — through the public
//! entrypoint surface — rather than accessing internals directly.

use scavenger::test_utils::ScavengerTest;
use stellar_spend_shared::errors::ContractError;

#[test]
fn fresh_contract_is_not_paused() {
    let t = ScavengerTest::setup();
    assert!(!t.client().is_paused());
}

#[test]
fn pause_then_unpause_restores_full_operations() {
    let t = ScavengerTest::setup();

    t.client()
        .pause(&soroban_sdk::String::from_str(&t.env, "testing"));
    assert!(t.client().is_paused());

    // All mutating operations must fail while paused.
    assert_eq!(
        t.client()
            .try_register(&t.operator, &t.asset, &100, &t.destination),
        Err(Ok(ContractError::Paused))
    );

    t.client().unpause();
    assert!(!t.client().is_paused());

    // After unpause, operations must succeed.
    let id = t
        .client()
        .register(&t.operator, &t.asset, &100, &t.destination);
    t.client().approve_sweep(&id);
    assert_eq!(
        t.client().get_entry(&id).status,
        scavenger::SweepStatus::Swept
    );
}

#[test]
fn multiple_pause_unpause_cycles_are_stable() {
    let t = ScavengerTest::setup();

    for i in 0u32..3 {
        let reason = soroban_sdk::String::from_str(
            &t.env,
            match i {
                0 => "cycle 1",
                1 => "cycle 2",
                _ => "cycle 3",
            },
        );
        t.client().pause(&reason);
        assert!(t.client().is_paused());
        t.client().unpause();
        assert!(!t.client().is_paused());
    }

    // Should still be fully operational after cycles.
    assert!(t
        .client()
        .try_register(&t.operator, &t.asset, &50, &t.destination)
        .is_ok());
}

#[test]
fn approve_and_reject_are_blocked_while_paused() {
    let t = ScavengerTest::setup();
    let approve_id = t.register(100);
    let reject_id = t.register(200);

    t.client()
        .pause(&soroban_sdk::String::from_str(&t.env, "halt"));

    assert_eq!(
        t.client().try_approve_sweep(&approve_id),
        Err(Ok(ContractError::Paused))
    );
    assert_eq!(
        t.client().try_reject_sweep(&reject_id),
        Err(Ok(ContractError::Paused))
    );

    t.client().unpause();

    // Both succeed after unpause.
    assert!(t.client().try_approve_sweep(&approve_id).is_ok());
    assert!(t.client().try_reject_sweep(&reject_id).is_ok());
}

#[test]
fn pause_does_not_affect_read_only_queries() {
    let t = ScavengerTest::setup();
    let id = t.register(400);

    t.client()
        .pause(&soroban_sdk::String::from_str(&t.env, "read check"));

    // These must all succeed even while paused.
    assert!(t.client().is_paused());
    assert!(t.client().try_get_entry(&id).is_ok());
    assert!(t.client().try_schema_version().is_ok());
    assert_ne!(
        t.client().get_pause_reason(),
        soroban_sdk::String::from_str(&t.env, "")
    );
}
