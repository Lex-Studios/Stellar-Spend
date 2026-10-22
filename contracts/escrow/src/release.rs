//! Deposit-release logic for the escrow contract.
//!
//! Extracted from `lib.rs` as part of #812 (modularisation). Only the settlement
//! authority (admin) may release a deposit; the function follows strict
//! Check-Effects-Interactions order and holds the reentrancy lock for its duration.

use soroban_sdk::{Address, Env};
use stellar_spend_shared::{errors::ContractError, events::emit_escrow_released};

use crate::{DataKey, EscrowStatus, INSTANCE_TTL_EXTEND_TO, INSTANCE_TTL_THRESHOLD};
use crate::storage::{acquire_lock, load_deposits, release_lock, require_admin};

/// Release a deposit to `recipient`. Settlement authority only.
///
/// Marks the deposit as released in storage and emits a `release` event.
/// Returns the original deposit amount.
pub fn release(env: &Env, deposit_id: u64, recipient: Address) -> Result<i128, ContractError> {
    // ── CHECK ──────────────────────────────────────────────────────────
    acquire_lock(env)?;
    require_admin(env)?;

    let mut deposits = load_deposits(env)?;
    let mut deposit = match deposits.get(deposit_id) {
        Some(d) => d,
        None => {
            release_lock(env);
            return Err(ContractError::NotFound);
        }
    };

    if matches!(deposit.status, EscrowStatus::Resolved | EscrowStatus::Cancelled) {
        release_lock(env);
        return Err(ContractError::AlreadyProcessed);
    }

    // ── EFFECT ─────────────────────────────────────────────────────────
    let amount = deposit.amount;
    deposit.status = EscrowStatus::Resolved;
    deposits.set(deposit_id, deposit);
    env.storage().instance().set(&DataKey::Deposits, &deposits);
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);
    release_lock(env);

    // ── INTERACT ───────────────────────────────────────────────────────
    emit_escrow_released(env, deposit_id, recipient, amount);
    Ok(amount)
}
