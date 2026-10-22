import React from 'react';

export interface Claim {
  id: string;
  policyNumber: string;
  claimType: string;
  amount: string;
  status: string;
  description?: string;
}

export interface ClaimListProps {
  claims: Claim[];
  onSelect?: (claim: Claim) => void;
}

export function ClaimList({ claims, onSelect }: ClaimListProps) {
  if (!claims || claims.length === 0) {
    return <p className="insurance-claim-list-empty">No claims found.</p>;
  }

  return (
    <ul className="insurance-claim-list">
      {claims.map((claim) => (
        <li key={claim.id} className="insurance-claim-list-item">
          <button type="button" onClick={() => onSelect && onSelect(claim)}>
            <span className="claim-policy">{claim.policyNumber}</span>
            <span className="claim-type">{claim.claimType}</span>
            <span className="claim-amount">{claim.amount}</span>
            <span className="claim-status">{claim.status}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default ClaimList;
