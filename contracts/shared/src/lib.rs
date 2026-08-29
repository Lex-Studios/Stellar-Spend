//! `stellar-spend-shared` – common types and utilities reused across all
//! Stellar-Spend smart contracts.
//!
//! # Modules
//! - [`errors`]     – canonical [`ContractError`] enum (stable numeric codes)
//! - [`auth`]       – signer / threshold verification helpers
//! - [`token`]      – unified token transfer/balance wrapper with consistent error handling
//! - [`validation`] – amount/string/range input-validation helpers (issue #816)

#![no_std]

pub mod auth;
pub mod constants;
pub mod errors;
pub mod token;
pub mod validation;

pub use constants::{INSTANCE_TTL_EXTEND_TO, INSTANCE_TTL_THRESHOLD, MAX_BASIS_POINTS, MAX_SIGNERS};
