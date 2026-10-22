import React from 'react';
import type { Claim } from './ClaimList';

export interface ClaimDetailProps {
  claim?: Claim | null;
  onBack?: () => void;
}

export function ClaimDetail({ claim, onBack }: ClaimDetailProps) {
  if (!claim) {
    return <p className="insurance-claim-detail-empty">Select a claim to view details.</p>;
  }

  return (
    <div className="insurance-claim-detail">
      <h2>Claim {claim.id}</h2>
      <dl>
        <dt>Policy Number</dt>
        <dd>{claim.policyNumber}</dd>
        <dt>Claim Type</dt>
        <dd>{claim.claimType}</dd>
        <dt>Amount</dt>
        <dd>{claim.amount}</dd>
        <dt>Status</dt>
        <dd>{claim.status}</dd>
        {claim.description ? (
          <>
            <dt>Description</dt>
            <dd>{claim.description}</dd>
          </>
        ) : null}
      </dl>
      {onBack ? (
        <button type="button" onClick={onBack}>
          Back
        </button>
      ) : null}
    </div>
  );
}

export default ClaimDetail;
