'use client';

import { useState } from 'react';

interface InsuranceOptionProps {
  amount: number;
  onToggle: (enabled: boolean, premium: number) => void;
}

export function InsuranceOption({ amount, onToggle }: InsuranceOptionProps) {
  const [enabled, setEnabled] = useState(false);
  const premium = amount * 0.005;

  const handleToggle = () => {
    const newState = !enabled;
    setEnabled(newState);
    onToggle(newState, premium);
  };

  return (
    <div className="border rounded-lg p-4 bg-blue-50">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={handleToggle}
          className="w-4 h-4"
        />
        <div>
          <p className="font-semibold">Transaction Insurance</p>
          <p className="text-sm text-gray-600">
            Premium: ${premium.toFixed(2)} (0.5% of transaction)
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Coverage up to ${(amount * 1.1).toFixed(2)}
          </p>
        </div>
      </label>
    </div>
  );
}
