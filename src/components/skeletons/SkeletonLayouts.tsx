import { cn } from '@/lib/cn';
import { SkeletonBase } from './SkeletonBase';

/** Full-form skeleton shown while the form is initialising. */
export function FormCardSkeleton() {
  return (
    <section
      aria-label="Loading offramp form"
      aria-busy="true"
      className="bg-panel border border-line p-6 flex flex-col gap-6"
    >
      <div className="flex flex-col gap-1.5">
        <SkeletonBase width={80} height={10} aria-label="Loading label…" />
        <SkeletonBase width="100%" height={42} aria-label="Loading amount input…" />
      </div>

      <div className="flex flex-col gap-1.5">
        <SkeletonBase width={100} height={10} aria-label="Loading label…" />
        <div className="flex gap-2">
          <SkeletonBase width="50%" height={44} aria-label="Loading fee option…" />
          <SkeletonBase width="50%" height={44} aria-label="Loading fee option…" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <SkeletonBase width={60} height={10} aria-label="Loading label…" />
          <SkeletonBase width="100%" height={42} aria-label="Loading currency select…" />
        </div>
        <div className="flex flex-col gap-1.5">
          <SkeletonBase width={120} height={10} aria-label="Loading label…" />
          <SkeletonBase width="100%" height={42} aria-label="Loading bank select…" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <SkeletonBase width={110} height={10} aria-label="Loading label…" />
        <SkeletonBase width="100%" height={42} aria-label="Loading account number input…" />
      </div>

      <div className="flex flex-col gap-1.5">
        <SkeletonBase width={90} height={10} aria-label="Loading label…" />
        <SkeletonBase width="100%" height={42} aria-label="Loading account name…" />
      </div>

      <SkeletonBase width="100%" height={52} aria-label="Loading submit button…" />
    </section>
  );
}

interface TransactionTableSkeletonProps {
  rows?: number;
}

/** Skeleton for the RecentOfframpsTable while transactions are loading. */
export function TransactionTableSkeleton({ rows = 3 }: TransactionTableSkeletonProps) {
  return (
    <div
      aria-label="Loading recent transactions"
      aria-busy="true"
      className="border border-[#333333] bg-[#111111]"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#333333]">
        <SkeletonBase width={120} height={10} aria-label="Loading section title…" />
        <SkeletonBase width={64} height={26} aria-label="Loading view all link…" />
      </div>

      <div className="overflow-x-auto">
        <table
          className="w-full min-w-[520px] border-collapse"
          aria-label="Loading transactions table"
        >
          <thead>
            <tr className="bg-[#c9a962]">
              {['TX HASH', 'USDC', 'FIAT', 'STATUS'].map((col) => (
                <th
                  key={col}
                  scope="col"
                  className="px-5 py-2.5 text-left text-[10px] tracking-[0.18em] font-semibold text-[#0a0a0a] uppercase whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr
                key={i}
                className={cn(
                  'border-b border-[#222222]',
                  i % 2 === 0 ? 'bg-[#111111]' : 'bg-[#0f0f0f]',
                )}
              >
                <td className="px-5 py-3">
                  <SkeletonBase width={120} height={14} aria-label="Loading transaction hash…" />
                </td>
                <td className="px-5 py-3">
                  <SkeletonBase width={80} height={14} aria-label="Loading USDC amount…" />
                </td>
                <td className="px-5 py-3">
                  <SkeletonBase width={80} height={14} aria-label="Loading fiat amount…" />
                </td>
                <td className="px-5 py-3">
                  <SkeletonBase width={60} height={20} aria-label="Loading status…" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Skeleton for the RightPanel quote display while a quote is being fetched. */
export function QuoteDisplaySkeleton() {
  return (
    <div aria-label="Loading quote" aria-busy="true" className="flex flex-col gap-4 w-full">
      <div className="border border-[#333333] bg-[#111111] p-5 flex flex-col gap-4">
        <SkeletonBase width={120} height={10} aria-label="Loading label…" />
        <SkeletonBase width="70%" height={38} aria-label="Loading payout amount…" />
        <SkeletonBase width={180} height={11} aria-label="Loading meta…" />
      </div>

      <div className="border border-[#333333] bg-[#111111] p-5 flex flex-col gap-3">
        <SkeletonBase width={160} height={10} aria-label="Loading section title…" />

        <div className="flex items-center justify-between gap-4">
          <SkeletonBase width={90} height={12} aria-label="Loading fee label…" />
          <SkeletonBase width={80} height={12} aria-label="Loading fee value…" />
        </div>

        <div className="flex items-center justify-between gap-4">
          <SkeletonBase width={90} height={12} aria-label="Loading fee label…" />
          <SkeletonBase width={80} height={12} aria-label="Loading fee value…" />
        </div>

        <div className="border-t border-[#333333] my-1" />

        <div className="flex items-end justify-between gap-4">
          <SkeletonBase width={80} height={12} aria-label="Loading total label…" />
          <SkeletonBase width={120} height={24} aria-label="Loading payout total…" />
        </div>
      </div>
    </div>
  );
}

/** Skeleton for the Header wallet area while balance is loading. */
export function WalletConnectionSkeleton() {
  return (
    <div aria-label="Loading wallet" aria-busy="true" className="flex flex-col items-end gap-0.5">
      <SkeletonBase width={100} height={12} aria-label="Loading USDC balance…" />
      <SkeletonBase width={70} height={12} aria-label="Loading XLM balance…" />
    </div>
  );
}

/** Skeleton for AnalyticsDashboard while analytics data is being fetched. */
export function AnalyticsDashboardSkeleton() {
  return (
    <div aria-label="Loading analytics" aria-busy="true" className="space-y-6">
      <div className="flex gap-2">
        <SkeletonBase width={110} height={36} aria-label="Loading period option…" />
        <SkeletonBase width={110} height={36} aria-label="Loading period option…" />
        <SkeletonBase width={110} height={36} aria-label="Loading period option…" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg border flex flex-col gap-2">
            <SkeletonBase width="60%" height={12} aria-label="Loading metric label…" />
            <SkeletonBase width="80%" height={24} aria-label="Loading metric value…" />
          </div>
        ))}
      </div>

      <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <SkeletonBase width={180} height={18} aria-label="Loading funnel title…" />
          <SkeletonBase width={100} height={14} aria-label="Loading funnel meta…" />
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBase
              key={i}
              width={`${100 - i * 15}%`}
              height={28}
              aria-label="Loading funnel step…"
            />
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <SkeletonBase
          width={180}
          height={18}
          className="mb-4"
          aria-label="Loading section title…"
        />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex flex-col gap-1.5">
                <SkeletonBase width={60} height={14} aria-label="Loading currency…" />
                <SkeletonBase width={100} height={11} aria-label="Loading transaction count…" />
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <SkeletonBase width={80} height={14} aria-label="Loading volume…" />
                <SkeletonBase width={40} height={11} aria-label="Loading percentage…" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <SkeletonBase
          width={140}
          height={18}
          className="mb-4"
          aria-label="Loading section title…"
        />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <SkeletonBase width="70%" height={11} aria-label="Loading fee label…" />
              <SkeletonBase width="50%" height={22} aria-label="Loading fee value…" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <SkeletonBase
          width={180}
          height={18}
          className="mb-4"
          aria-label="Loading section title…"
        />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b">
              <div className="flex flex-col gap-1.5">
                <SkeletonBase width={100} height={14} aria-label="Loading date…" />
                <SkeletonBase width={140} height={11} aria-label="Loading transaction count…" />
              </div>
              <SkeletonBase width={70} height={16} aria-label="Loading amount…" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Skeleton for BankAccountInput while bank metadata is loading. */
export function BankAccountInputSkeleton({ fields = 1 }: { fields?: 1 | 2 }) {
  return (
    <div aria-label="Loading bank account input" aria-busy="true" className="flex flex-col gap-3">
      <div className="flex gap-4 border-b border-[#333333] pb-1">
        <SkeletonBase width={50} height={14} aria-label="Loading mode tab…" />
        <SkeletonBase width={70} height={14} aria-label="Loading mode tab…" />
        <SkeletonBase width={50} height={14} aria-label="Loading mode tab…" />
      </div>

      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <SkeletonBase width={110} height={11} aria-label="Loading field label…" />
          <SkeletonBase width="100%" height={46} aria-label="Loading field input…" />
        </div>
      ))}
    </div>
  );
}
