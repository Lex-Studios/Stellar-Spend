'use client';

import { useState } from 'react';

interface BatchTransaction {
  id: string;
  amount: number;
  currency: string;
}

interface BatchUIProps {
  onCreateBatch: (transactions: BatchTransaction[]) => void;
}

export function BatchUI({ onCreateBatch }: BatchUIProps) {
  const [transactions, setTransactions] = useState<BatchTransaction[]>([]);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('NGN');

  const addTransaction = () => {
    if (amount && parseFloat(amount) > 0) {
      setTransactions([
        ...transactions,
        {
          id: Date.now().toString(),
          amount: parseFloat(amount),
          currency,
        },
      ]);
      setAmount('');
    }
  };

  const removeTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  const handleSubmit = () => {
    if (transactions.length > 0) {
      onCreateBatch(transactions);
      setTransactions([]);
    }
  };

  const total = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-4">Batch Transactions</h3>

      <div className="space-y-3 mb-4">
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        >
          <option>NGN</option>
          <option>KES</option>
          <option>GHS</option>
        </select>
        <button
          onClick={addTransaction}
          className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add to Batch
        </button>
      </div>

      {transactions.length > 0 && (
        <div className="space-y-2 mb-4">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex justify-between items-center p-2 bg-gray-100 rounded"
            >
              <span>
                {tx.amount} {tx.currency}
              </span>
              <button
                onClick={() => removeTransaction(tx.id)}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
          <div className="pt-2 border-t font-semibold">
            Total: {total.toFixed(2)} {currency}
          </div>
          <button
            onClick={handleSubmit}
            className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Submit Batch
          </button>
        </div>
      )}
    </div>
  );
}
