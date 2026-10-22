#![no_std]

pub mod auth;
pub mod errors;
pub mod events;
pub mod policy;
pub mod validation;

pub use auth::AuthError;
pub use errors::ContractError;
pub use errors::SharedError;

// ── Storage key naming convention ─────────────────────────────────────────────
//
// **All** storage keys across every contract in this workspace MUST follow this
// scheme. Uniform keys enable tooling (off-chain indexers, migration scripts)
// to reason about on-ledger state without contract-specific knowledge.
//
// ## Scheme
//
// 1. **Use `#[contracttype]` enums, never plain `Symbol` or string literals.**
//    Enum variants are stored as compact integer indices; string symbols cost
//    extra bytes per entry and make key collisions harder to detect statically.
//
//    ```rust
//    #[contracttype]
//    pub enum DataKey {
//        Admin,
//        Schema,
//        FeeSchedule,
//    }
//    ```
//
// 2. **Name the enum `DataKey`** in every contract.
//    A single, predictable name keeps `grep DataKey` useful workspace-wide.
//
// 3. **Variant names use PascalCase** and describe the *logical role* of the
//    stored value, not its Rust type (e.g. `Admin` not `AdminAddress`,
//    `Schema` not `SchemaU32`).
//
// 4. **Document each variant** with a short doc-comment explaining the type
//    stored and any invariants (e.g. non-negative, bounded set).
//
// 5. **`Schema` is reserved** for the storage-layout version `u32`. It MUST be
//    present in every upgradeable contract and is validated by
//    [`validation::check_schema_version`] before any mutating entrypoint runs.
//
// ## Migration notes
//
// When bumping `SCHEMA_VERSION`:
// - Add a new variant to `DataKey` for any new key introduced.
// - Do **not** remove or reuse an old variant — the old integer index may still
//   be present in ledger entries from pre-migration deployments.
// - Implement the conversion logic in the contract's `migrate` entrypoint and
//   emit a `(symbol_short!("migrate"),)` event with `(old_version, new_version)`
//   so indexers can track the upgrade on-chain.
