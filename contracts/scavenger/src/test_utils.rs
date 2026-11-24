//! Shared test fixtures for the scavenger contract.
//!
//! Compiled only under the `testutils` feature. Every scavenger test opens from
//! a fixture here rather than repeating `Env::default()` / `register` / `init`.

use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    Address, Env,
};

use crate::{DataKey, ScavengerContract, ScavengerContractClient, SCHEMA_VERSION};

/// Ledger sequence every fixture starts at.
///
/// Non-zero so tests can assert on `registered_at` arithmetic without zero
/// masking ordering bugs, and low enough that realistic advances stay far from
/// `u32::MAX`.
pub const START_LEDGER: u32 = 1_000;

/// Entry TTL the default fixture configures.
///
/// Large enough that ledger advances in tests do not archive instance storage
/// and produce unrelated `InternalError` failures.
pub const FIXTURE_ENTRY_TTL: u32 = 12_000_000;

/// A registered scavenger contract plus the cast of addresses tests need.
pub struct ScavengerTest {
    pub env: Env,
    pub contract_id: Address,
    /// Governance administrator.
    pub admin: Address,
    /// An operator who submits sweep registrations.
    pub operator: Address,
    /// A second party for tests that need two independent actors.
    pub other: Address,
    /// A sample asset address.
    pub asset: Address,
    /// A sample sweep destination.
    pub destination: Address,
}

impl ScavengerTest {
    /// Register the contract without calling `init`.
    pub fn registered() -> Self {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().with_mut(|li| {
            li.sequence_number = START_LEDGER;
            li.min_persistent_entry_ttl = FIXTURE_ENTRY_TTL;
            li.min_temp_entry_ttl = FIXTURE_ENTRY_TTL;
            li.max_entry_ttl = FIXTURE_ENTRY_TTL;
        });

        let contract_id = env.register(ScavengerContract, ());
        Self {
            admin: Address::generate(&env),
            operator: Address::generate(&env),
            other: Address::generate(&env),
            asset: Address::generate(&env),
            destination: Address::generate(&env),
            contract_id,
            env,
        }
    }

    /// Register and `init` the contract. The common starting point.
    pub fn setup() -> Self {
        let fixture = Self::registered();
        fixture.client().init(&fixture.admin);
        fixture
    }

    /// A client bound to this fixture's env and contract.
    pub fn client(&self) -> ScavengerContractClient<'_> {
        ScavengerContractClient::new(&self.env, &self.contract_id)
    }

    /// Register a sweep entry using the fixture's default operator, asset, and destination.
    pub fn register(&self, amount: i128) -> u64 {
        self.client()
            .register(&self.operator, &self.asset, &amount, &self.destination)
    }

    /// Read a raw instance-storage value from inside the contract's context.
    pub fn read_storage<V>(&self, key: &DataKey) -> Option<V>
    where
        V: soroban_sdk::TryFromVal<Env, soroban_sdk::Val>,
    {
        self.env
            .as_contract(&self.contract_id, || self.env.storage().instance().get(key))
    }

    /// Current schema version as recorded in storage.
    pub fn stored_schema(&self) -> Option<u32> {
        self.read_storage(&DataKey::Schema)
    }

    /// Advance the ledger by `n` sequences.
    pub fn advance_ledgers(&self, n: u32) {
        self.env.ledger().with_mut(|li| li.sequence_number += n);
    }
}

/// Assert that a freshly-initialised contract records the current schema version.
pub fn assert_fresh_init_is_current(fixture: &ScavengerTest) {
    assert_eq!(
        fixture.stored_schema(),
        Some(SCHEMA_VERSION),
        "init must persist the current schema version"
    );
}
