import React, { useState } from 'react';

export interface ClaimFormValues {
  policyNumber: string;
  claimType: string;
  amount: string;
  description: string;
}

export interface ClaimFormProps {
  onSubmit?: (values: ClaimFormValues) => void;
  initialValues?: Partial<ClaimFormValues>;
}

const EMPTY_VALUES: ClaimFormValues = {
  policyNumber: '',
  claimType: '',
  amount: '',
  description: '',
};

export function ClaimForm({ onSubmit, initialValues }: ClaimFormProps) {
  const [values, setValues] = useState<ClaimFormValues>({
    ...EMPTY_VALUES,
    ...initialValues,
  });

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (onSubmit) {
      onSubmit(values);
    }
  };

  return (
    <form className="insurance-claim-form" onSubmit={handleSubmit}>
      <h2>Submit a Claim</h2>
      <label>
        Policy Number
        <input
          name="policyNumber"
          value={values.policyNumber}
          onChange={handleChange}
          required
        />
      </label>
      <label>
        Claim Type
        <select name="claimType" value={values.claimType} onChange={handleChange} required>
          <option value="">Select a type</option>
          <option value="medical">Medical</option>
          <option value="property">Property</option>
          <option value="auto">Auto</option>
        </select>
      </label>
      <label>
        Amount
        <input name="amount" value={values.amount} onChange={handleChange} required />
      </label>
      <label>
        Description
        <textarea name="description" value={values.description} onChange={handleChange} />
      </label>
      <button type="submit">Submit Claim</button>
    </form>
  );
}

export default ClaimForm;
