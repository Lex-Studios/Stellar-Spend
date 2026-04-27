'use client';

import { useState } from 'react';
import type { Transaction } from '@/lib/transaction-storage';
import { TransactionStorage } from '@/lib/transaction-storage';
import { cn } from '@/lib/cn';

interface ReversalModalProps {
  transaction: Transaction;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReversalModal({
  transaction,
  isOpen,
  onClose,
  onSuccess,
}: ReversalModalProps) {
  const [amount, setAmount] = useState(transaction.amount);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEligible = TransactionStorage.isReversalEligible(transaction);
  const maxAmount = parseFloat(transaction.amount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/offramp/reverse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: transaction.id,
          amount,
          reason,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to initiate reversal');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border border-[#333333] p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-bold text-white mb-4">Reverse Transaction</h2>

        {!isEligible ? (
          <div className="bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
            This transaction is not eligible for reversal. Only completed transactions without existing reversals can be reversed.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-[#999999] mb-2">
                Reversal Amount (max: {maxAmount})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={maxAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#333333] px-3 py-2 text-white text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-[#999999] mb-2">
                Reason for Reversal
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this transaction is being reversed..."
                className="w-full bg-[#0a0a0a] border border-[#333333] px-3 py-2 text-white text-sm resize-none h-24"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 p-3 text-red-400 text-xs">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-[#333333] text-white text-xs hover:bg-[#222222] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'flex-1 px-4 py-2 text-xs font-semibold transition-colors',
                  isLoading
                    ? 'bg-[#666666] text-[#999999] cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                )}
              >
                {isLoading ? 'Processing...' : 'Reverse Transaction'}
              </button>
            </div>
          </form>
        )}

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#999999] hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
