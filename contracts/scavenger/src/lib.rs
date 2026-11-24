//! Scavenger contract for Stellar-Spend.
//!
//! Manages a registry of unclaimed on-chain assets (dust, abandoned escrows, expired
//! deposits) that may be swept to a designated treasury address. Operators submit
//! sweep requests; the admin approves or rejects them. A pause/emergency-stop
//! mechanism lets the admin halt all state-changing operations during an incident.
//!
//! ## Pause / emergency-stop (issue #1737)
//!
//! Any state-changing entrypoint — `register`, `approve_sweep`, `reject_sweep` —
//! rejects calls with [`ContractError::Paused`] while the contract is paused.
//! Read-only queries (`get_entry`, `is_paused`, `schema_version`) are always
//! permitted so off-chain tooling can inspect state during an incident.
//!
//! The admin calls `pause(reason)` to halt the contract and `unpause()` to resume.
//! Both operations emit an on-chain event so indexers can record the incident window.
//!
//! ## Security model
//!
//! * **Check-Effects-Interactions**: every mutating entrypoint validates inputs,
//!   checks the pause flag, writes storage, then emits events.
//! * **Admin-only operations**: `pause`, `unpause`, `approve_sweep`, `reject_sweep`,
//!   `upgrade`, and `migrate` require the stored admin's authorisation.
//! * **Reentrancy guard**: `approve_sweep` and `reject_sweep` hold a boolean lock
//!   in instance storage for their entire execution, returning
//!   [`ContractError::Reentrant`] on a concurrent re-entrant call.
//!
//! ## Module layout
//!
//! | Module    | Responsibility                                      |
//! |-----------|-----------------------------------------------------|
//! | `storage` | All raw instance-storage I/O helpers                |
//! | `pause`   | `pause`, `unpause`, `is_paused` logic               |
//! | `sweep`   | `register`, `approve_sweep`, `reject_sweep` logic   |

#![no_std]

pub mod pause;
pub mod sweep;
pub(crate) mod storage;

use soroban_sdk::{contract, contractimpl, contractmeta, contracttype, symbol_short, Address, BytesN, Env, String};
use stellar_spend_shared::errors::ContractError;

contractmeta!(key = "version", val = "1.0.0");
contractmeta!(key = "contract", val = "stellar-spend-scavenger");

// ── Schema version ────────────────────────────────────────────────────────────

/// Current storage layout version.
///
/// Bump when the shape of any stored type changes, and add a migration branch
/// to [`ScavengerContract::migrate`].
pub const SCHEMA_VERSION: u32 = 1;

// ── TTL constants ─────────────────────────────────────────────────────────────

/// Ledgers of instance TTL requested on every state-changing call (~30 days).
pub const INSTANCE_TTL_EXTEND_TO: u32 = 518_400;
/// Only pay to extend when remaining TTL has fallen below ~6 days.
pub const INSTANCE_TTL_THRESHOLD: u32 = 103_680;

// ── Storage keys ──────────────────────────────────────────────────────────────

/// All storage keys for the scavenger contract.
///
/// Follows the workspace naming convention: `#[contracttype]` enum named
/// `DataKey`, variants in PascalCase describing the logical role of each entry.
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Settlement / governance administrator.
    Admin,
    /// Storage layout version (`u32`).
    Schema,
    /// Pause flag (`bool`). `true` means the contract is halted.
    Paused,
    /// Human-readable reason recorded when the contract was last paused (`String`).
    PauseReason,
    /// `Map<u64, ScavengerEntry>` of every registered sweep target.
    Entries,
    /// Monotonic counter backing entry ids (`u64`).
    NextId,
    /// Reentrancy guard (`bool`). `true` while `approve_sweep`/`reject_sweep` runs.
    Lock,
}

// ── Domain types ──────────────────────────────────────────────────────────────

/// Lifecycle status of a sweep entry.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum SweepStatus {
    /// Registered; awaiting admin approval.
    Pending,
    /// Admin approved; sweep has been executed.
    Swept,
    /// Admin rejected; entry is closed without a sweep.
    Rejected,
}

/// A single sweep-target entry (schema v1).
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ScavengerEntry {
    /// Address of the asset to sweep.
    pub asset: Address,
    /// Amount to sweep (must be > 0).
    pub amount: i128,
    /// Destination for the swept funds.
    pub destination: Address,
    /// Operator who registered this entry.
    pub operator: Address,
    /// Ledger at which the entry was registered.
    pub registered_at: u32,
    /// Current lifecycle status.
    pub status: SweepStatus,
}

// ── Contract ──────────────────────────────────────────────────────────────────

#[contract]
pub struct ScavengerContract;

#[contractimpl]
impl ScavengerContract {
    // ── Initialisation ────────────────────────────────────────────────────────

    /// Initialise the contract with its admin.
    ///
    /// Rejects a second `init` call rather than silently reassigning the admin,
    /// which would let anyone who front-ran the deploy take over the contract.
    pub fn init(env: Env, admin: Address) -> Result<(), ContractError> {
        if env.storage().instance().has(&DataKey::Schema) {
            return Err(ContractError::AlreadyInitialized);
        }
        admin.require_auth();

        use soroban_sdk::Map;
        let storage = env.storage().instance();
        storage.set(&DataKey::Admin, &admin);
        storage.set(&DataKey::Schema, &SCHEMA_VERSION);
        storage.set(&DataKey::Paused, &false);
        storage.set(&DataKey::Entries, &Map::<u64, ScavengerEntry>::new(&env));
        storage.set(&DataKey::NextId, &0u64);
        storage.set(&DataKey::Lock, &false);
        storage::bump_instance_ttl(&env);

        env.events().publish((symbol_short!("init"),), admin);
        Ok(())
    }

    // ── Pause / emergency-stop (issue #1737) ─────────────────────────────────

    /// Halt all state-changing operations. Admin only.
    ///
    /// Records `reason` in storage so that `get_pause_reason` can explain the
    /// incident to operators without an off-chain lookup.
    pub fn pause(env: Env, reason: String) -> Result<(), ContractError> {
        storage::require_current_schema(&env)?;
        pause::pause(&env, reason)
    }

    /// Resume operations. Admin only.
    pub fn unpause(env: Env) -> Result<(), ContractError> {
        storage::require_current_schema(&env)?;
        pause::unpause(&env)
    }

    /// Whether the contract is currently paused.
    ///
    /// Read-only; always permitted even when paused.
    pub fn is_paused(env: Env) -> bool {
        pause::is_paused(&env)
    }

    /// The human-readable pause reason, or an empty string when not paused.
    ///
    /// Read-only; always permitted even when paused.
    pub fn get_pause_reason(env: Env) -> String {
        pause::get_pause_reason(&env)
    }

    // ── Sweep operations ──────────────────────────────────────────────────────

    /// Register a new sweep-target entry and return its id.
    ///
    /// Blocked while paused.
    pub fn register(
        env: Env,
        operator: Address,
        asset: Address,
        amount: i128,
        destination: Address,
    ) -> Result<u64, ContractError> {
        storage::require_current_schema(&env)?;
        storage::require_not_paused(&env)?;
        sweep::register(&env, operator, asset, amount, destination)
    }

    /// Approve a pending entry and mark it as swept. Admin only.
    ///
    /// Blocked while paused. Protected by a reentrancy lock.
    pub fn approve_sweep(env: Env, entry_id: u64) -> Result<i128, ContractError> {
        storage::require_current_schema(&env)?;
        storage::require_not_paused(&env)?;
        sweep::approve_sweep(&env, entry_id)
    }

    /// Reject a pending entry. Admin only.
    ///
    /// Blocked while paused. Protected by a reentrancy lock.
    pub fn reject_sweep(env: Env, entry_id: u64) -> Result<(), ContractError> {
        storage::require_current_schema(&env)?;
        storage::require_not_paused(&env)?;
        sweep::reject_sweep(&env, entry_id)
    }

    /// Fetch a registered entry.
    ///
    /// Read-only; always permitted even when paused.
    pub fn get_entry(env: Env, entry_id: u64) -> Result<ScavengerEntry, ContractError> {
        storage::require_current_schema(&env)?;
        storage::load_entries(&env)?
            .get(entry_id)
            .ok_or(ContractError::NotFound)
    }

    // ── Upgrade surface ───────────────────────────────────────────────────────

    /// Report the stored schema version.
    ///
    /// Intentionally skips `require_current_schema` — a stale deployment must be
    /// able to report its version so `migrate` can be targeted.
    pub fn schema_version(env: Env) -> Result<u32, ContractError> {
        env.storage()
            .instance()
            .get(&DataKey::Schema)
            .ok_or(ContractError::NotInitialized)
    }

    /// Replace the contract WASM. Admin only.
    ///
    /// Run `migrate` immediately after in the same transaction where possible.
    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) -> Result<(), ContractError> {
        storage::require_admin(&env)?;
        env.deployer().update_current_contract_wasm(new_wasm_hash);
        env.events().publish((symbol_short!("upgrade"),), ());
        Ok(())
    }

    /// Convert persisted state to [`SCHEMA_VERSION`]. Admin only.
    ///
    /// Skips `require_current_schema` — it is the one call allowed to run against
    /// stale state. Returns the version migrated from.
    pub fn migrate(env: Env) -> Result<u32, ContractError> {
        storage::require_admin(&env)?;

        let stored: u32 = env
            .storage()
            .instance()
            .get(&DataKey::Schema)
            .ok_or(ContractError::NotInitialized)?;

        if stored == SCHEMA_VERSION {
            return Err(ContractError::SchemaAlreadyCurrent);
        }
        if stored > SCHEMA_VERSION {
            return Err(ContractError::SchemaVersionUnsupported);
        }

        // Future migration branches go here.
        // e.g. if stored == 1 { ... }

        env.storage()
            .instance()
            .set(&DataKey::Schema, &SCHEMA_VERSION);
        storage::bump_instance_ttl(&env);
        env.events()
            .publish((symbol_short!("migrate"),), (stored, SCHEMA_VERSION));
        Ok(stored)
    }
}

#[cfg(feature = "testutils")]
pub mod test_utils;

#[cfg(test)]
mod test;
