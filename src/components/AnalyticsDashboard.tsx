'use client';

import { useState, useEffect } from 'react';
import { AnalyticsPeriod } from '@/types/analytics';

interface AnalyticsDashboardProps {
  userAddress: string;
}

export function AnalyticsDashboard({ userAddress }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsPeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');

    try {
      const now = Date.now();
      const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
      const startDate = now - daysMap[period] * 24 * 60 * 60 * 1000;

      const response = await fetch(
        `/api/transactions/analytics?startDate=${startDate}&endDate=${now}&period=${period}`,
        {
          headers: { 'x-user-address': userAddress },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading analytics...</div>;
  if (error) return <div className="text-red-600 py-8">{error}</div>;
  if (!analytics) return <div className="text-center py-8">No data available</div>;

  const { analytics: stats, currencyBreakdown, feeAnalysis, spendingPatterns } = analytics;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        {(['7d', '30d', '90d'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg ${
              period === p
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            {p === '7d' ? 'Last 7 days' : p === '30d' ? 'Last 30 days' : 'Last 90 days'}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Transactions"
          value={stats.totalTransactions.toString()}
        />
        <MetricCard label="Total Volume" value={`$${stats.totalVolume}`} />
        <MetricCard label="Average Amount" value={`$${stats.averageAmount}`} />
        <MetricCard label="Success Rate" value={`${stats.successRate.toFixed(1)}%`} />
      </div>

      {/* Currency Breakdown */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Currency Breakdown</h3>
        <div className="space-y-3">
          {currencyBreakdown.map((cb) => (
            <div key={cb.currency} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{cb.currency}</p>
                <p className="text-sm text-gray-600">{cb.count} transactions</p>
              </div>
              <div className="text-right">
                <p className="font-medium">${cb.volume}</p>
                <p className="text-sm text-gray-600">{cb.percentage.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fee Analysis */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Fee Analysis</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Fees</p>
            <p className="text-2xl font-bold">${feeAnalysis.totalFeesPaid}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Avg Fee %</p>
            <p className="text-2xl font-bold">{feeAnalysis.averageFeePercentage.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Bridge Fees</p>
            <p className="text-lg font-semibold">${feeAnalysis.bridgeFees}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Payout Fees</p>
            <p className="text-lg font-semibold">${feeAnalysis.payoutFees}</p>
          </div>
        </div>
      </div>

      {/* Spending Patterns */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Spending Patterns</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {spendingPatterns.map((sp) => (
            <div key={sp.date} className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium">{new Date(sp.date).toLocaleDateString()}</p>
                <p className="text-sm text-gray-600">{sp.transactionCount} transactions</p>
              </div>
              <p className="font-semibold">${sp.amount}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-4 rounded-lg border">
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
