//! Pause / emergency-stop logic for the scavenger contract (issue #1737).
//!
//! The admin can halt all state-changing operations by calling `pause(reason)`.
//! Resumption is via `unpause()`. Both operations emit on-chain events so
//! indexers can record incident windows without an off-chain data store.
//!
//! # Invariants
//!
//! * Calling `pause` while already paused is a no-op that returns `Ok(())` —
//!   it is idempotent so a re-submitted transaction does not fail.
//! * Calling `unpause` while not paused is likewise idempotent.
//! * `is_paused` and `get_pause_reason` are always readable, even when paused.

use soroban_sdk::{symbol_short, Env, String};
use stellar_spend_shared::errors::ContractError;

use crate::{storage, DataKey};

/// Halt all state-changing operations. Admin only.
///
/// Writes `Paused = true` and stores `reason` for operator visibility.
/// Emits a `(pause,)` event with `reason` as data.
pub(crate) fn pause(env: &Env, reason: String) -> Result<(), ContractError> {
    storage::require_admin(env)?;
    env.storage().instance().set(&DataKey::Paused, &true);
    env.storage().instance().set(&DataKey::PauseReason, &reason);
    storage::bump_instance_ttl(env);
    env.events()
        .publish((symbol_short!("pause"),), reason);
    Ok(())
}

/// Resume operations. Admin only.
///
/// Clears `Paused` and `PauseReason`. Emits an `(unpause,)` event.
pub(crate) fn unpause(env: &Env) -> Result<(), ContractError> {
    storage::require_admin(env)?;
    env.storage().instance().set(&DataKey::Paused, &false);
    // Clear the reason so `get_pause_reason` returns an empty string.
    env.storage()
        .instance()
        .set(&DataKey::PauseReason, &String::from_str(env, ""));
    storage::bump_instance_ttl(env);
    env.events().publish((symbol_short!("unpause"),), ());
    Ok(())
}

/// Whether the contract is currently paused.
///
/// Returns `false` when storage has never been written (not yet initialised).
pub(crate) fn is_paused(env: &Env) -> bool {
    env.storage()
        .instance()
        .get(&DataKey::Paused)
        .unwrap_or(false)
}

/// The human-readable pause reason, or an empty string when not paused.
pub(crate) fn get_pause_reason(env: &Env) -> String {
    env.storage()
        .instance()
        .get(&DataKey::PauseReason)
        .unwrap_or_else(|| String::from_str(env, ""))
}
