//! Sweep registration and approval logic for the scavenger contract.
//!
//! # Lifecycle
//!
//! 1. An operator calls `register(operator, asset, amount, destination)` to
//!    record a sweep-target entry. The entry starts with status `Pending`.
//! 2. The admin calls `approve_sweep(entry_id)` to mark the entry as `Swept`.
//!    This is the signal that an off-chain sweep transaction has executed.
//! 3. The admin calls `reject_sweep(entry_id)` to close the entry as `Rejected`
//!    without a sweep (e.g. the asset is too small to be worth sweeping).
//!
//! # CEI order
//!
//! `approve_sweep` and `reject_sweep` follow strict Check-Effects-Interactions:
//! validate inputs → acquire reentrancy lock → mutate storage → release lock →
//! emit event.

use soroban_sdk::{symbol_short, Address, Env};
use stellar_spend_shared::{errors::ContractError, validation::require_positive_amount};

use crate::{storage, DataKey, ScavengerEntry, SweepStatus};

/// Register a new sweep-target entry and return its id.
///
/// The caller (operator) must authorise the call. Amount must be strictly
/// positive. Status is set to `Pending`.
pub(crate) fn register(
    env: &Env,
    operator: Address,
    asset: Address,
    amount: i128,
    destination: Address,
) -> Result<u64, ContractError> {
    operator.require_auth();
    require_positive_amount(amount)?;

    let mut entries = storage::load_entries(env)?;
    let id: u64 = env
        .storage()
        .instance()
        .get(&DataKey::NextId)
        .unwrap_or(0u64);

    let entry = ScavengerEntry {
        asset: asset.clone(),
        amount,
        destination: destination.clone(),
        operator: operator.clone(),
        registered_at: env.ledger().sequence(),
        status: SweepStatus::Pending,
    };

    entries.set(id, entry);
    env.storage().instance().set(&DataKey::Entries, &entries);
    env.storage()
        .instance()
        .set(&DataKey::NextId, &(id + 1));
    storage::bump_instance_ttl(env);

    env.events()
        .publish((symbol_short!("register"),), (id, operator, asset, amount, destination));
    Ok(id)
}

/// Approve a pending entry and mark it as swept. Admin only.
///
/// Returns the swept amount on success. Protected by the reentrancy lock.
pub(crate) fn approve_sweep(env: &Env, entry_id: u64) -> Result<i128, ContractError> {
    storage::require_admin(env)?;
    storage::acquire_lock(env)?;

    let result = do_approve_sweep(env, entry_id);

    storage::release_lock(env);
    result
}

fn do_approve_sweep(env: &Env, entry_id: u64) -> Result<i128, ContractError> {
    let mut entries = storage::load_entries(env)?;
    let mut entry = entries.get(entry_id).ok_or(ContractError::NotFound)?;

    if !matches!(entry.status, SweepStatus::Pending) {
        return Err(ContractError::AlreadyProcessed);
    }

    let amount = entry.amount;
    entry.status = SweepStatus::Swept;
    entries.set(entry_id, entry.clone());
    env.storage().instance().set(&DataKey::Entries, &entries);
    storage::bump_instance_ttl(env);

    env.events().publish(
        (symbol_short!("sweep"),),
        (entry_id, entry.destination, amount),
    );
    Ok(amount)
}

/// Reject a pending entry without sweeping. Admin only.
///
/// Protected by the reentrancy lock.
pub(crate) fn reject_sweep(env: &Env, entry_id: u64) -> Result<(), ContractError> {
    storage::require_admin(env)?;
    storage::acquire_lock(env)?;

    let result = do_reject_sweep(env, entry_id);

    storage::release_lock(env);
    result
}

fn do_reject_sweep(env: &Env, entry_id: u64) -> Result<(), ContractError> {
    let mut entries = storage::load_entries(env)?;
    let mut entry = entries.get(entry_id).ok_or(ContractError::NotFound)?;

    if !matches!(entry.status, SweepStatus::Pending) {
        return Err(ContractError::AlreadyProcessed);
    }

    entry.status = SweepStatus::Rejected;
    entries.set(entry_id, entry.clone());
    env.storage().instance().set(&DataKey::Entries, &entries);
    storage::bump_instance_ttl(env);

    env.events()
        .publish((symbol_short!("reject"),), (entry_id, entry.operator));
    Ok(())
}
