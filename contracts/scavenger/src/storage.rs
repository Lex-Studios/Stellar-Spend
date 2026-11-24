//! Storage helpers for the scavenger contract.
//!
//! Centralises every operation that reads from or writes to instance storage,
//! keeping the entry-point dispatcher in `lib.rs` and the business logic in the
//! action modules free of raw storage boilerplate.
//!
//! | Function                  | Description                                        |
//! |---------------------------|----------------------------------------------------|
//! | [`load_entries`]          | Fetch the entry map or return `NotInitialized`     |
//! | [`require_admin`]         | Fetch admin address and call `require_auth`        |
//! | [`require_not_paused`]    | Return `Paused` when the circuit breaker is set    |
//! | [`acquire_lock`]          | Set the reentrancy lock or return `Reentrant`      |
//! | [`release_lock`]          | Clear the reentrancy lock                          |
//! | [`require_current_schema`]| Guard entry points against stale contract state    |
//! | [`bump_instance_ttl`]     | Extend instance TTL to keep entries accessible     |

use soroban_sdk::{Address, Env, Map};
use stellar_spend_shared::{errors::ContractError, validation::check_schema_version};

use crate::{DataKey, ScavengerEntry, INSTANCE_TTL_EXTEND_TO, INSTANCE_TTL_THRESHOLD, SCHEMA_VERSION};

/// Load the full entry map from instance storage.
///
/// Returns `ContractError::NotInitialized` if the map has never been written.
pub(crate) fn load_entries(env: &Env) -> Result<Map<u64, ScavengerEntry>, ContractError> {
    env.storage()
        .instance()
        .get(&DataKey::Entries)
        .ok_or(ContractError::NotInitialized)
}

/// Assert that `env` carries an authorised call from the stored admin and
/// return the admin address.
pub(crate) fn require_admin(env: &Env) -> Result<Address, ContractError> {
    stellar_spend_shared::auth::require_admin(env, &DataKey::Admin)
}

/// Return `ContractError::Paused` when the pause flag is set.
///
/// Every state-changing entrypoint calls this after `require_current_schema`
/// so that the caller gets a typed, predictable error during an incident.
pub(crate) fn require_not_paused(env: &Env) -> Result<(), ContractError> {
    let paused: bool = env
        .storage()
        .instance()
        .get(&DataKey::Paused)
        .unwrap_or(false);
    if paused {
        Err(ContractError::Paused)
    } else {
        Ok(())
    }
}

/// Acquire the single-entry reentrancy lock.
///
/// Returns `ContractError::Reentrant` if the lock is already held, indicating
/// a previous call is still on the stack.
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
/// `acquire_lock`, including error paths.
pub(crate) fn release_lock(env: &Env) {
    env.storage().instance().set(&DataKey::Lock, &false);
}

/// Guard that rejects calls against a contract whose storage layout has not
/// been migrated to [`SCHEMA_VERSION`].
pub(crate) fn require_current_schema(env: &Env) -> Result<(), ContractError> {
    check_schema_version(
        env.storage().instance().get(&DataKey::Schema),
        SCHEMA_VERSION,
    )
}

/// Extend the instance-storage TTL so that the entry map stays accessible.
///
/// Called on every state-changing entry point.
pub(crate) fn bump_instance_ttl(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);
}
