use soroban_sdk::{Address, Env, IntoVal, Val};

use crate::errors::ContractError;

pub use crate::policy::{required_threshold, verify_threshold};

/// Authorization error types
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum AuthError {
    Unauthorized = 1,
    NotAdmin = 2,
    InvalidSigner = 3,
    InsufficientPermissions = 4,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::policy::{required_threshold, verify_threshold};
    use proptest::prelude::*;

    #[test]
    fn threshold_zero_signers_is_full() {
        assert_eq!(required_threshold(3, 0, 1_000), 3);
    }

    #[test]
    fn threshold_value_below_limit_returns_one() {
        assert_eq!(required_threshold(3, 1_000, 500), 1);
    }

    proptest! {
        #[test]
        fn required_threshold_policy_invariant_holds(
            full_threshold in 1u32..=32u32,
            high_value_limit in 0i128..=1_000_000_000i128,
            value in 0i128..=1_000_000_000i128,
        ) {
            let required = required_threshold(full_threshold, high_value_limit, value);
            if high_value_limit > 0 && value <= high_value_limit {
                prop_assert_eq!(required, 1);
            } else {
                prop_assert_eq!(required, full_threshold);
            }
        }

        #[test]
        fn verify_threshold_matches_the_policy_invariant(
            sig_count in 0u32..=32u32,
            full_threshold in 1u32..=32u32,
            high_value_limit in 0i128..=1_000_000_000i128,
            value in 0i128..=1_000_000_000i128,
        ) {
            let required = required_threshold(full_threshold, high_value_limit, value);
            let ok = verify_threshold(sig_count, full_threshold, high_value_limit, value);
            if sig_count >= required {
                prop_assert!(ok.is_ok());
            } else {
                prop_assert_eq!(ok.unwrap_err(), ContractError::BelowThreshold);
            }
        }
    }
}

/// Return the administrator recorded under `key` in instance storage, requiring
/// that administrator to have authorised the current invocation.
///
/// Reports [`ContractError::NotInitialized`] when no administrator is recorded.
pub fn require_admin<K>(env: &Env, key: &K) -> Result<Address, ContractError>
where
    K: IntoVal<Env, Val>,
{
    let admin: Address = env
        .storage()
        .instance()
        .get(key)
        .ok_or(ContractError::NotInitialized)?;
    admin.require_auth();
    Ok(admin)
}
