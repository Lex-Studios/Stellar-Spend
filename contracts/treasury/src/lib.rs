#![no_std]
mod balance;

use soroban_sdk::{contract, contracttype, Address, Env, String};
use stellar_spend_shared::errors::ContractError;
use balance::BalanceManager;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TreasuryState {
    pub total_balance: i128,
    pub reserved: i128,
    pub available: i128,
}

#[contract]
pub struct TreasuryContract;

#[contractimpl]
impl TreasuryContract {
    /// Initialize treasury
    pub fn initialize(
        env: Env,
        admin: Address,
    ) -> Result<(), ContractError> {
        // Check if already initialized
        let state: Option<TreasuryState> = env.storage().get(&String::from_str(&env, "state"));
        if state.is_some() {
            return Err(ContractError::AlreadyInitialized);
        }

        let initial_state = TreasuryState {
            total_balance: 0,
            reserved: 0,
            available: 0,
        };

        env.storage().set(&String::from_str(&env, "state"), &initial_state);
        env.storage().set(&String::from_str(&env, "admin"), &admin);

        Ok(())
    }

    /// Deposit funds with overflow protection
    pub fn deposit(
        env: Env,
        amount: i128,
    ) -> Result<i128, ContractError> {
        let mut state: TreasuryState = env.storage()
            .get(&String::from_str(&env, "state"))
            .ok_or(ContractError::NotInitialized)?;

        // Use checked addition
        let new_total = BalanceManager::add(state.total_balance, amount)?;
        let new_available = BalanceManager::add(state.available, amount)?;

        state.total_balance = new_total;
        state.available = new_available;

        env.storage().set(&String::from_str(&env, "state"), &state);

        Ok(state.total_balance)
    }

    /// Withdraw funds with overflow protection
    pub fn withdraw(
        env: Env,
        amount: i128,
    ) -> Result<i128, ContractError> {
        let mut state: TreasuryState = env.storage()
            .get(&String::from_str(&env, "state"))
            .ok_or(ContractError::NotInitialized)?;

        // Use checked subtraction
        let new_total = BalanceManager::sub(state.total_balance, amount)?;
        let new_available = BalanceManager::sub(state.available, amount)?;

        state.total_balance = new_total;
        state.available = new_available;

        env.storage().set(&String::from_str(&env, "state"), &state);

        Ok(state.total_balance)
    }

    /// Reserve funds (with checked math)
    pub fn reserve(
        env: Env,
        amount: i128,
    ) -> Result<i128, ContractError> {
        let mut state: TreasuryState = env.storage()
            .get(&String::from_str(&env, "state"))
            .ok_or(ContractError::NotInitialized)?;

        // Use checked addition for reserved
        let new_reserved = BalanceManager::add(state.reserved, amount)?;
        // Use checked subtraction for available
        let new_available = BalanceManager::sub(state.available, amount)?;

        state.reserved = new_reserved;
        state.available = new_available;

        env.storage().set(&String::from_str(&env, "state"), &state);

        Ok(state.reserved)
    }

    /// Release reserved funds (with checked math)
    pub fn release_reserved(
        env: Env,
        amount: i128,
    ) -> Result<i128, ContractError> {
        let mut state: TreasuryState = env.storage()
            .get(&String::from_str(&env, "state"))
            .ok_or(ContractError::NotInitialized)?;

        let new_reserved = BalanceManager::sub(state.reserved, amount)?;
        let new_available = BalanceManager::add(state.available, amount)?;

        state.reserved = new_reserved;
        state.available = new_available;

        env.storage().set(&String::from_str(&env, "state"), &state);

        Ok(state.available)
    }

    /// Get treasury state
    pub fn get_state(env: Env) -> Result<TreasuryState, ContractError> {
        env.storage()
            .get(&String::from_str(&env, "state"))
            .ok_or(ContractError::NotInitialized)
    }
}

#[cfg(test)]
mod tests;
