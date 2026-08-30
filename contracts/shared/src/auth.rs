use soroban_sdk::{Address, Env, panic_with_error};

/// Authorization error types
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum AuthError {
    Unauthorized = 1,
    NotAdmin = 2,
    InvalidSigner = 3,
    InsufficientPermissions = 4,
}

/// Admin authorization helper
pub struct AdminAuth;

impl AdminAuth {
    /// Require that the caller is the admin
    pub fn require_admin(env: &Env, admin: &Address, caller: &Address) -> Result<(), AuthError> {
        // First, check that the caller address matches the admin
        if caller != admin {
            return Err(AuthError::NotAdmin);
        }

        // Then, require auth for the caller
        caller.require_auth();

        Ok(())
    }

    /// Require that the caller is either the admin or has a specific role
    pub fn require_admin_or_role(
        env: &Env,
        admin: &Address,
        caller: &Address,
        role_check: fn(&Address) -> bool,
    ) -> Result<(), AuthError> {
        if caller == admin {
            caller.require_auth();
            return Ok(());
        }

        if role_check(caller) {
            caller.require_auth();
            return Ok(());
        }

        Err(AuthError::Unauthorized)
    }

    /// Require that the caller has a specific role
    pub fn require_role(
        env: &Env,
        caller: &Address,
        role_check: fn(&Address) -> bool,
    ) -> Result<(), AuthError> {
        if !role_check(caller) {
            return Err(AuthError::InsufficientPermissions);
        }

        caller.require_auth();
        Ok(())
    }

    /// Check if the caller is the admin without throwing an error
    pub fn is_admin(env: &Env, admin: &Address, caller: &Address) -> bool {
        if caller != admin {
            return false;
        }

        // Try to authenticate
        match caller.try_require_auth() {
            Ok(_) => true,
            Err(_) => false,
        }
    }
}
