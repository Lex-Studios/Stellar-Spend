import React, { useState } from 'react';
import { ClaimForm, ClaimFormValues } from './ClaimForm';
import { ClaimList, Claim } from './ClaimList';
import { ClaimDetail } from './ClaimDetail';

export { ClaimForm } from './ClaimForm';
export type { ClaimFormValues, ClaimFormProps } from './ClaimForm';
export { ClaimList } from './ClaimList';
export type { Claim, ClaimListProps } from './ClaimList';
export { ClaimDetail } from './ClaimDetail';
export type { ClaimDetailProps } from './ClaimDetail';

export interface InsuranceClaimProps {
  claims?: Claim[];
  onSubmit?: (values: ClaimFormValues) => void;
}

export function InsuranceClaim({ claims = [], onSubmit }: InsuranceClaimProps) {
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  return (
    <div className="insurance-claim">
      <ClaimForm onSubmit={onSubmit} />
      <ClaimList claims={claims} onSelect={setSelectedClaim} />
      <ClaimDetail claim={selectedClaim} onBack={() => setSelectedClaim(null)} />
    </div>
  );
}

export default InsuranceClaim;
