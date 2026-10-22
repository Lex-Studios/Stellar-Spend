//! Event emission helpers for Stellar-Spend contracts.
//!
//! # Event Schema v1
//!
//! All events follow a consistent structure:
//! - **Topic**: (contract_topic: Symbol, schema_version: &str)
//! - **Payload**: Contract-specific data followed by timestamp
//! - **Timestamp**: Always included via `env.ledger().timestamp()` for audit trails
//!
//! ## Topic Naming Convention
//!
//! Topics are short symbols (max 12 chars) that identify the event domain:
//! - `admin_ini` - Admin initialization
//! - `escr_crt` - Escrow created
//! - `escr_dep` - Escrow deposit
//! - `escr_rel` - Escrow released
//! - `escr_rfd` - Escrow refunded
//! - `msig_*` - Multisig operations
//! - `fee_*` - Fee operations
//! - `cntr_*` - Contract lifecycle
//!
//! ## Payload Ordering
//!
//! Payloads follow a consistent pattern:
//! 1. Primary identifiers (id, address)
//! 2. Business data (amount, status)
//! 3. Timestamp (always last)

use soroban_sdk::{symbol_short, Address, Env, String, Vec};

/// Emit an admin initialized event.
pub fn emit_admin_initialized(env: &Env, admin: Address) {
    env.events()
        .publish((symbol_short!("admin_ini"), "v1"), (admin, env.ledger().timestamp()));
}

/// Emit a multisig initialization event.
pub fn emit_multisig_initialized(
    env: &Env,
    admin: Address,
    threshold: u32,
    high_value_limit: i128,
) {
    env.events().publish(
        (symbol_short!("msig_ini"), "v1"),
        (admin, threshold, high_value_limit, env.ledger().timestamp()),
    );
}

/// Emit an escrow deposit created event (for escrow contract).
pub fn emit_escrow_deposit(env: &Env, deposit_id: u64, depositor: Address, amount: i128, bridge_address: Address) {
    env.events().publish(
        (symbol_short!("escr_dep"), "v1"),
        (deposit_id, depositor, amount, bridge_address, env.ledger().timestamp()),
    );
}

pub fn emit_escrow_created(
    env: &Env,
    escrow_id: u64,
    buyer: Address,
    seller: Address,
    amount: i128,
) {
    env.events().publish(
        (symbol_short!("escr_crt"), "v1"),
        (escrow_id, buyer, seller, amount, env.ledger().timestamp()),
    );
}

pub fn emit_escrow_funded(env: &Env, escrow_id: u64, funder: Address, amount: i128) {
    env.events().publish(
        (symbol_short!("escr_fnd"), "v1"),
        (escrow_id, funder, amount, env.ledger().timestamp()),
    );
}

pub fn emit_escrow_released(env: &Env, escrow_id: u64, recipient: Address, amount: i128) {
    env.events().publish(
        (symbol_short!("escr_rel"), "v1"),
        (escrow_id, recipient, amount, env.ledger().timestamp()),
    );
}

pub fn emit_escrow_refunded(env: &Env, escrow_id: u64, recipient: Address, amount: i128) {
    env.events().publish(
        (symbol_short!("escr_rfd"), "v1"),
        (escrow_id, recipient, amount, env.ledger().timestamp()),
    );
}

pub fn emit_dispute_created(
    env: &Env,
    escrow_id: u64,
    initiator: Address,
    respondent: Address,
    reason: String,
) {
    env.events().publish(
        (symbol_short!("dispute"), "v1"),
        (
            escrow_id,
            initiator,
            respondent,
            reason,
            env.ledger().timestamp(),
        ),
    );
}

pub fn emit_dispute_resolved(env: &Env, escrow_id: u64, resolver: Address, outcome: String) {
    env.events().publish(
        (symbol_short!("dspute_rs"), "v1"),
        (escrow_id, resolver, outcome, env.ledger().timestamp()),
    );
}

/// Emit a multisig proposal submission event.
pub fn emit_multisig_proposal_created(
    env: &Env,
    proposal_id: String,
    proposer: Address,
    description: String,
    target: Address,
    value: i128,
) {
    env.events().publish(
        (symbol_short!("msig_crt"), "v1"),
        (proposal_id, proposer, description, target, value, env.ledger().timestamp()),
    );
}

/// Emit a multisig signature collection event.
pub fn emit_multisig_signed(env: &Env, proposal_id: String, signer: Address) {
    env.events().publish(
        (symbol_short!("msig_sgn"), "v1"),
        (proposal_id, signer, env.ledger().timestamp()),
    );
}

/// Emit a multisig proposal execution event.
pub fn emit_multisig_executed(env: &Env, proposal_id: String, executor: Address) {
    env.events().publish(
        (symbol_short!("msig_exe"), "v1"),
        (proposal_id, executor, env.ledger().timestamp()),
    );
}

pub fn emit_fee_set(env: &Env, fee_type: String, fee_rate: i128) {
    env.events().publish(
        (symbol_short!("fee_set"), "v1"),
        (fee_type, fee_rate, env.ledger().timestamp()),
    );
}

pub fn emit_fee_collected(env: &Env, fee_type: String, amount: i128, recipient: Address) {
    env.events().publish(
        (symbol_short!("fee_col"), "v1"),
        (fee_type, amount, recipient, env.ledger().timestamp()),
    );
}

pub fn emit_multisig_submitted(
    env: &Env,
    proposal_id: u64,
    proposer: Address,
    description: String,
) {
    env.events().publish(
        (symbol_short!("msig_sub"), "v1"),
        (proposal_id, proposer, description, env.ledger().timestamp()),
    );
}

pub fn emit_multisig_approved(env: &Env, proposal_id: u64, approver: Address) {
    env.events().publish(
        (symbol_short!("msig_app"), "v1"),
        (proposal_id, approver, env.ledger().timestamp()),
    );
}

pub fn emit_treasury_deposit(env: &Env, depositor: Address, amount: i128, asset: String) {
    env.events().publish(
        (symbol_short!("trsy_dep"), "v1"),
        (depositor, amount, asset, env.ledger().timestamp()),
    );
}

pub fn emit_treasury_withdrawal(env: &Env, recipient: Address, amount: i128, asset: String) {
    env.events().publish(
        (symbol_short!("trsy_wit"), "v1"),
        (recipient, amount, asset, env.ledger().timestamp()),
    );
}

pub fn emit_contract_paused(env: &Env, caller: Address, reason: String) {
    env.events()
        .publish((symbol_short!("cntr_pau"), "v1"), (caller, reason, env.ledger().timestamp()));
}

pub fn emit_contract_unpaused(env: &Env, caller: Address) {
    env.events()
        .publish((symbol_short!("cntr_unp"), "v1"), (caller, env.ledger().timestamp()));
}

pub fn emit_contract_upgraded(env: &Env, new_wasm_hash: Vec<u8>) {
    env.events()
        .publish((symbol_short!("cntr_upg"), "v1"), (new_wasm_hash, env.ledger().timestamp()));
}

pub fn emit_contract_migrated(env: &Env, old_version: u32, new_version: u32) {
    env.events().publish(
        (symbol_short!("cntr_mig"), "v1"),
        (old_version, new_version, env.ledger().timestamp()),
    );
}

pub fn emit_error(env: &Env, error_code: u32, error_message: String, context: String) {
    env.events().publish(
        (symbol_short!("error_occ"), "v1"),
        (error_code, error_message, context, env.ledger().timestamp()),
    );
}
