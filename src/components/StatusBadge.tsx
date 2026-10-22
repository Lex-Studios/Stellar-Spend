'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import {
  STATUS_VARIANTS,
  STATUS_VARIANT_CLASSES,
  STATUS_VARIANT_DOT_CLASSES,
} from '@/lib/theme-tokens';
import type { RecentOfframpRow } from '@stellar-spend/shared';
import type { OfframpStep } from '@stellar-spend/shared';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

type TransactionStatus =
  | RecentOfframpRow['status']
  | OfframpStep
  | 'pending'
  | 'completed'
  | 'failed'
  | 'reversed'
  | 'partially_reversed';

interface StatusConfig {
  label: string;
  tooltip: string;
  animate?: boolean;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  // RecentOfframpRow statuses
  SETTLING: {
    label: 'Settling',
    tooltip: 'Funds are being transferred to your bank account.',
    animate: true,
  },
  COMPLETE: {
    label: 'Complete',
    tooltip: 'Transaction completed successfully.',
  },
  // OfframpStep statuses
  idle: {
    label: 'Idle',
    tooltip: 'No active transaction.',
  },
  initiating: {
    label: 'Initiating',
    tooltip: 'Preparing your transaction details.',
    animate: true,
  },
  'awaiting-signature': {
    label: 'Awaiting Signature',
    tooltip: 'Waiting for wallet approval.',
    animate: true,
  },
  submitting: {
    label: 'Submitting',
    tooltip: 'Broadcasting to the Stellar network.',
    animate: true,
  },
  processing: {
    label: 'Processing',
    tooltip: 'Waiting for on-chain confirmation.',
    animate: true,
  },
  settling: {
    label: 'Settling',
    tooltip: 'Transferring funds to your bank account.',
    animate: true,
  },
  success: {
    label: 'Success',
    tooltip: 'Transaction completed successfully.',
  },
  error: {
    label: 'Failed',
    tooltip: 'Transaction failed. Please try again.',
  },
  // Transaction storage statuses
  pending: {
    label: 'Pending',
    tooltip: 'Transaction is pending.',
    animate: true,
  },
  completed: {
    label: 'Completed',
    tooltip: 'Transaction completed successfully.',
  },
  failed: {
    label: 'Failed',
    tooltip: 'Transaction failed.',
  },
  reversed: {
    label: 'Reversed',
    tooltip: 'Transaction was fully reversed.',
  },
  partially_reversed: {
    label: 'Partially Reversed',
    tooltip: 'Part of the transaction was reversed.',
  },
};

const FALLBACK_CONFIG: StatusConfig = {
  label: 'Unknown',
  tooltip: 'Status unknown.',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface StatusBadgeProps {
  status: TransactionStatus;
  /** Show the status icon dot */
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({ status, showIcon = true, className }: StatusBadgeProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const config = STATUS_CONFIG[status] ?? FALLBACK_CONFIG;
  const variant = STATUS_VARIANTS[status] ?? 'neutral';

  return (
    <span className="relative inline-flex items-center">
      <span
        role="status"
        aria-label={`Transaction status: ${config.label}`}
        title={config.tooltip}
        onMouseEnter={() => setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
        onFocus={() => setTooltipVisible(true)}
        onBlur={() => setTooltipVisible(false)}
        tabIndex={0}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5',
          'text-[10px] tracking-widest uppercase font-semibold',
          'cursor-default select-none rounded-sm',
          'focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c9a962]',
          STATUS_VARIANT_CLASSES[variant],
          className,
        )}
      >
        {showIcon && (
          <span
            aria-hidden="true"
            className={cn(
              'inline-block h-1.5 w-1.5 rounded-full flex-shrink-0',
              STATUS_VARIANT_DOT_CLASSES[variant],
              config.animate && 'animate-pulse',
            )}
          />
        )}
        {config.label}
      </span>

      {/* Tooltip */}
      {tooltipVisible && (
        <span
          role="tooltip"
          className={cn(
            'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10',
            'px-2.5 py-1.5 text-[10px] text-white bg-[#1a1a1a] border border-[#333333]',
            'whitespace-nowrap pointer-events-none shadow-lg',
          )}
        >
          {config.tooltip}
          {/* Arrow */}
          <span
            aria-hidden="true"
            className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#333333]"
          />
        </span>
      )}
    </span>
  );
}
