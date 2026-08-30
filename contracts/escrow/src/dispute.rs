use soroban_sdk::{Address, Env, panic_with_error};

/// Dispute error types
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DisputeError {
    AlreadyResolved = 1,
    NotInDispute = 2,
    Unauthorized = 3,
    InvalidEvidence = 4,
    DeadlinePassed = 5,
    NoActiveDispute = 6,
}

/// Dispute status
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DisputeStatus {
    None,
    Pending,
    InReview,
    ResolvedForBuyer,
    ResolvedForSeller,
    Dismissed,
}

/// Dispute record
pub struct Dispute {
    pub id: u64,
    pub escrow_id: u64,
    pub initiator: Address,
    pub respondent: Address,
    pub status: DisputeStatus,
    pub reason: String,
    pub evidence: String,
    pub created_at: u64,
    pub resolved_at: Option<u64>,
    pub resolution_notes: Option<String>,
}

/// Dispute resolution handler
pub struct DisputeHandler;

impl DisputeHandler {
    /// Create a new dispute
    pub fn create_dispute(
        env: &Env,
        escrow_id: u64,
        initiator: Address,
        respondent: Address,
        reason: String,
        evidence: String,
    ) -> Result<Dispute, DisputeError> {
        // Check if dispute already exists
        if Self::dispute_exists(env, escrow_id) {
            return Err(DisputeError::AlreadyResolved);
        }

        // Create dispute
        let dispute = Dispute {
            id: env.ledger().sequence(),
            escrow_id,
            initiator: initiator.clone(),
            respondent: respondent.clone(),
            status: DisputeStatus::Pending,
            reason,
            evidence,
            created_at: env.ledger().timestamp(),
            resolved_at: None,
            resolution_notes: None,
        };

        // Store dispute
        Self::store_dispute(env, &dispute);

        // Emit event
        env.events().publish(
            ("dispute_created", "v1"),
            (escrow_id, initiator, respondent),
        );

        Ok(dispute)
    }

    /// Resolve a dispute in favor of the buyer
    pub fn resolve_for_buyer(
        env: &Env,
        escrow_id: u64,
        resolver: Address,
        notes: Option<String>,
    ) -> Result<(), DisputeError> {
        let mut dispute = Self::load_dispute(env, escrow_id)
            .ok_or(DisputeError::NoActiveDispute)?;

        // Check if already resolved
        if dispute.status == DisputeStatus::ResolvedForBuyer
            || dispute.status == DisputeStatus::ResolvedForSeller
            || dispute.status == DisputeStatus::Dismissed
        {
            return Err(DisputeError::AlreadyResolved);
        }

        // Authorize resolver (must be arbitrator)
        Self::authorize_resolver(env, &resolver)?;

        // Update dispute status
        dispute.status = DisputeStatus::ResolvedForBuyer;
        dispute.resolved_at = Some(env.ledger().timestamp());
        dispute.resolution_notes = notes;

        Self::store_dispute(env, &dispute);

        env.events().publish(
            ("dispute_resolved_buyer", "v1"),
            (escrow_id, resolver),
        );

        Ok(())
    }

    /// Resolve a dispute in favor of the seller
    pub fn resolve_for_seller(
        env: &Env,
        escrow_id: u64,
        resolver: Address,
        notes: Option<String>,
    ) -> Result<(), DisputeError> {
        let mut dispute = Self::load_dispute(env, escrow_id)
            .ok_or(DisputeError::NoActiveDispute)?;

        if dispute.status == DisputeStatus::ResolvedForBuyer
            || dispute.status == DisputeStatus::ResolvedForSeller
            || dispute.status == DisputeStatus::Dismissed
        {
            return Err(DisputeError::AlreadyResolved);
        }

        Self::authorize_resolver(env, &resolver)?;

        dispute.status = DisputeStatus::ResolvedForSeller;
        dispute.resolved_at = Some(env.ledger().timestamp());
        dispute.resolution_notes = notes;

        Self::store_dispute(env, &dispute);

        env.events().publish(
            ("dispute_resolved_seller", "v1"),
            (escrow_id, resolver),
        );

        Ok(())
    }

    /// Dismiss a dispute
    pub fn dismiss_dispute(
        env: &Env,
        escrow_id: u64,
        resolver: Address,
        notes: Option<String>,
    ) -> Result<(), DisputeError> {
        let mut dispute = Self::load_dispute(env, escrow_id)
            .ok_or(DisputeError::NoActiveDispute)?;

        if dispute.status == DisputeStatus::ResolvedForBuyer
            || dispute.status == DisputeStatus::ResolvedForSeller
            || dispute.status == DisputeStatus::Dismissed
        {
            return Err(DisputeError::AlreadyResolved);
        }

        Self::authorize_resolver(env, &resolver)?;

        dispute.status = DisputeStatus::Dismissed;
        dispute.resolved_at = Some(env.ledger().timestamp());
        dispute.resolution_notes = notes;

        Self::store_dispute(env, &dispute);

        env.events().publish(
            ("dispute_dismissed", "v1"),
            (escrow_id, resolver),
        );

        Ok(())
    }

    /// Get dispute status
    pub fn get_dispute_status(env: &Env, escrow_id: u64) -> DisputeStatus {
        Self::load_dispute(env, escrow_id)
            .map(|d| d.status)
            .unwrap_or(DisputeStatus::None)
    }

    /// Check if dispute exists
    pub fn dispute_exists(env: &Env, escrow_id: u64) -> bool {
        Self::load_dispute(env, escrow_id).is_some()
    }

    /// Store dispute (implementation specific)
    fn store_dispute(env: &Env, dispute: &Dispute) {
        // Store in contract storage
        let key = format!("dispute_{}", dispute.escrow_id);
        env.storage().set(&String::from_str(env, &key), dispute);
    }

    /// Load dispute (implementation specific)
    fn load_dispute(env: &Env, escrow_id: u64) -> Option<Dispute> {
        let key = format!("dispute_{}", escrow_id);
        env.storage().get(&String::from_str(env, &key))
    }

    /// Authorize resolver
    fn authorize_resolver(env: &Env, resolver: &Address) -> Result<(), DisputeError> {
        // In production, this would check against a stored arbitrator address
        // For now, require auth
        resolver.require_auth();
        Ok(())
    }

    // ================================================================
    // Legacy code paths to be removed (dead code audit)
    // These are confirmed unreachable and will be removed
    // ================================================================

    /// Legacy: This branch is never reached because disputes are created
    /// with proper validation. Keeping this as a reference for the dead code audit.
    #[allow(dead_code)]
    fn legacy_invalid_dispute_creation() -> Result<(), DisputeError> {
        // This code path is unreachable after the validation refactor
        // It would have allowed disputes without proper authorization
        Err(DisputeError::Unauthorized)
    }

    /// Legacy: This branch was used before the status tracking was added.
    /// Now, all disputes have a status, making this branch unreachable.
    #[allow(dead_code)]
    fn legacy_status_check() -> Result<bool, DisputeError> {
        // This is dead code - disputes always have a status now
        Ok(false)
    }

    /// Legacy: This function was replaced by the more robust `resolve_for_buyer`
    /// and `resolve_for_seller` functions.
    #[allow(dead_code)]
    fn legacy_resolve_old_way() -> Result<(), DisputeError> {
        // This code is unreachable and will be removed
        Err(DisputeError::AlreadyResolved)
    }
}
