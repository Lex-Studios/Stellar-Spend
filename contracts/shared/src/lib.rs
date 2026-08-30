#![no_std]

pub mod auth;
pub mod errors;

pub use auth::AdminAuth;
pub use auth::AuthError;
pub use errors::SharedError;
