'use client';

import { useState, useEffect } from 'react';

interface ReferralDashboardProps {
  userId: string;
}

export function ReferralDashboard({ userId }: ReferralDashboardProps) {
  const [referralCode, setReferralCode] = useState('');
  const [stats, setStats] = useState({ total_referrals: 0, total_rewards: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, [userId]);

  const fetchReferralData = async () => {
    try {
      const res = await fetch(`/api/offramp/referral?userId=${userId}`);
      const data = await res.json();
      if (data.code) setReferralCode(data.code.code);
      if (data.stats) setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch referral data', error);
    }
  };

  const generateCode = async () => {
    try {
      const res = await fetch('/api/offramp/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'generate' }),
      });
      const data = await res.json();
      setReferralCode(data.code.code);
    } catch (error) {
      console.error('Failed to generate referral code', error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border rounded-lg p-4 bg-purple-50">
      <h3 className="font-semibold mb-4">Referral Program</h3>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">Your Referral Code</p>
          {referralCode ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={referralCode}
                readOnly
                className="flex-1 px-3 py-2 border rounded bg-white"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          ) : (
            <button
              onClick={generateCode}
              className="w-full px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Generate Code
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded">
            <p className="text-xs text-gray-600">Total Referrals</p>
            <p className="text-2xl font-bold">{stats.total_referrals}</p>
          </div>
          <div className="bg-white p-3 rounded">
            <p className="text-xs text-gray-600">Total Rewards</p>
            <p className="text-2xl font-bold">${stats.total_rewards}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
