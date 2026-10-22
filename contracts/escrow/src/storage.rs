//! Storage helpers for the escrow contract (issue #1318).
//!
//! This module centralises every operation that reads from or writes to instance
//! storage, keeping the entry-point dispatcher in `lib.rs` and the business logic
//! in the action modules (`create`, `release`, `refund`, `dispute`) free of
//! raw storage boilerplate.
//!
//! # Helpers provided
//!
//! | Function             | Description                                              |
//! |----------------------|----------------------------------------------------------|
//! | [`load_deposits`]    | Fetch the deposit map or return `NotInitialized`         |
//! | [`require_admin`]    | Fetch admin address and call `require_auth`              |
//! | [`acquire_lock`]     | Set the reentrancy lock or return `Reentrant`            |
//! | [`release_lock`]     | Clear the reentrancy lock                                |
//! | [`require_current_schema`] | Guard entry points against stale contract state    |
//! | [`bump_instance_ttl`] | Extend instance TTL to keep deposits accessible        |

use soroban_sdk::{Address, Env, Map};
use stellar_spend_shared::{errors::ContractError, validation::check_schema_version};

use crate::{DataKey, EscrowDeposit, INSTANCE_TTL_EXTEND_TO, INSTANCE_TTL_THRESHOLD, SCHEMA_VERSION};

/// Load the full deposit map from instance storage.
///
/// Returns `ContractError::NotInitialized` if the map has never been written,
/// which indicates the contract has not yet been initialised.
pub(crate) fn load_deposits(env: &Env) -> Result<Map<u64, EscrowDeposit>, ContractError> {
    env.storage()
        .instance()
        .get(&DataKey::Deposits)
        .ok_or(ContractError::NotInitialized)
}

/// Assert that `env` carries an authorised call from the stored settlement
/// authority and return the admin address.
///
/// Delegates to `stellar_spend_shared::auth::require_admin` so the auth check
/// is performed by the Soroban host, not in application code.
pub(crate) fn require_admin(env: &Env) -> Result<Address, ContractError> {
    stellar_spend_shared::auth::require_admin(env, &DataKey::Admin)
}

/// Acquire the single-entry reentrancy lock.
///
/// Returns `ContractError::Reentrant` if the lock is already held, which
/// means a previous call is still on the stack — only possible when the
/// contract is called re-entrantly from another contract.
pub(crate) fn acquire_lock(env: &Env) -> Result<(), ContractError> {
    let locked: bool = env
        .storage()
        .instance()
        .get(&DataKey::Lock)
        .unwrap_or(false);
    if locked {
        return Err(ContractError::Reentrant);
    }
    env.storage().instance().set(&DataKey::Lock, &true);
    Ok(())
}

/// Release the reentrancy lock acquired by [`acquire_lock`].
///
/// Must be called in every code path that exits after a successful
/// `acquire_lock`, including error paths — failure to do so permanently
/// bricks the contract.
pub(crate) fn release_lock(env: &Env) {
    env.storage().instance().set(&DataKey::Lock, &false);
}

/// Guard that rejects calls against a contract whose storage layout has not
/// been migrated to [`SCHEMA_VERSION`].
///
/// Every public entry point except `schema_version` and `migrate` must call
/// this at the top of its implementation.
pub(crate) fn require_current_schema(env: &Env) -> Result<(), ContractError> {
    check_schema_version(
        env.storage().instance().get(&DataKey::Schema),
        SCHEMA_VERSION,
    )
}

/// Extend the instance-storage TTL so that the deposit map stays accessible.
///
/// Called on every state-changing entry point.  The ledger count constants are
/// documented in `lib.rs`; extending only when remaining TTL is below
/// [`INSTANCE_TTL_THRESHOLD`] avoids paying the extension fee on every call.
pub(crate) fn bump_instance_ttl(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);
}
