//! Authorisation boundary tests for the scavenger contract.
//!
//! Every admin-only entrypoint must reject calls from non-admin addresses.

use scavenger::test_utils::ScavengerTest;
use soroban_sdk::{
    testutils::{MockAuth, MockAuthInvoke},
    IntoVal, Vec,
};

#[test]
fn pause_rejects_non_admin() {
    let t = ScavengerTest::setup();
    t.env.mock_auths(&[MockAuth {
        address: &t.other,
        invoke: &MockAuthInvoke {
            contract: &t.contract_id,
            fn_name: "pause",
            args: Vec::from_array(
                &t.env,
                [soroban_sdk::String::from_str(&t.env, "hack").into_val(&t.env)],
            ),
            sub_invokes: &[],
        },
    }]);
    assert!(
        t.client()
            .try_pause(&soroban_sdk::String::from_str(&t.env, "hack"))
            .is_err()
    );
}

#[test]
fn unpause_rejects_non_admin() {
    let t = ScavengerTest::setup();
    t.client()
        .pause(&soroban_sdk::String::from_str(&t.env, "x"));

    t.env.mock_auths(&[MockAuth {
        address: &t.other,
        invoke: &MockAuthInvoke {
            contract: &t.contract_id,
            fn_name: "unpause",
            args: Vec::from_array(&t.env, []),
            sub_invokes: &[],
        },
    }]);
    assert!(t.client().try_unpause().is_err());
}

#[test]
fn approve_sweep_rejects_non_admin() {
    let t = ScavengerTest::setup();
    let id = t.register(500);

    t.env.mock_auths(&[MockAuth {
        address: &t.other,
        invoke: &MockAuthInvoke {
            contract: &t.contract_id,
            fn_name: "approve_sweep",
            args: Vec::from_array(&t.env, [id.into_val(&t.env)]),
            sub_invokes: &[],
        },
    }]);
    assert!(t.client().try_approve_sweep(&id).is_err());
}

#[test]
fn reject_sweep_rejects_non_admin() {
    let t = ScavengerTest::setup();
    let id = t.register(500);

    t.env.mock_auths(&[MockAuth {
        address: &t.other,
        invoke: &MockAuthInvoke {
            contract: &t.contract_id,
            fn_name: "reject_sweep",
            args: Vec::from_array(&t.env, [id.into_val(&t.env)]),
            sub_invokes: &[],
        },
    }]);
    assert!(t.client().try_reject_sweep(&id).is_err());
}

#[test]
fn migrate_rejects_non_admin() {
    let t = ScavengerTest::setup();

    t.env.mock_auths(&[MockAuth {
        address: &t.other,
        invoke: &MockAuthInvoke {
            contract: &t.contract_id,
            fn_name: "migrate",
            args: Vec::from_array(&t.env, []),
            sub_invokes: &[],
        },
    }]);
    assert!(t.client().try_migrate().is_err());
}

#[test]
fn upgrade_rejects_non_admin() {
    let t = ScavengerTest::setup();
    let hash = soroban_sdk::BytesN::from_array(&t.env, &[1u8; 32]);

    t.env.mock_auths(&[MockAuth {
        address: &t.other,
        invoke: &MockAuthInvoke {
            contract: &t.contract_id,
            fn_name: "upgrade",
            args: Vec::from_array(&t.env, [hash.clone().into_val(&t.env)]),
            sub_invokes: &[],
        },
    }]);
    assert!(t.client().try_upgrade(&hash).is_err());
}
