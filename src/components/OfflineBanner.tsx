'use client';

import { useEffect, useRef, useState } from 'react';
import { useBackgroundSync, useOnlineStatus } from '@/lib/background-sync';
import { CHROME_TOKENS } from '@/lib/theme-tokens';

/**
 * Shows a degraded-mode banner while offline and automatically retries
 * any actions queued via useBackgroundSync once connectivity returns.
 */
export default function OfflineBanner() {
  const isOffline = !useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const { failedTransactions, retryFailedTransaction } = useBackgroundSync();
  const wasOffline = useRef(false);

  // When connectivity returns after being offline, retry any queued actions.
  useEffect(() => {
    if (isOffline) {
      wasOffline.current = true;
      return;
    }

    if (!wasOffline.current) return;
    wasOffline.current = false;

    if (failedTransactions.length === 0) return;

    (async () => {
      setIsSyncing(true);
      for (const tx of failedTransactions) {
        await retryFailedTransaction(tx.id);
      }
      setIsSyncing(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOffline]);

  if (!isOffline && !isSyncing) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-[11px] font-semibold tracking-widest uppercase border-b"
      style={{
        backgroundColor: CHROME_TOKENS.surfaceElevated,
        borderColor: CHROME_TOKENS.border,
        color: CHROME_TOKENS.gold,
      }}
    >
      {isOffline ? (
        <>
          <span aria-hidden="true">⚠</span>
          You&apos;re offline — showing cached data. Actions will sync when you reconnect.
        </>
      ) : (
        <>
          <span aria-hidden="true">⟳</span>
          Back online — syncing queued actions...
        </>
      )}
    </div>
  );
}
