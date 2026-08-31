'use client';

import { useSyncSettings } from '@/hooks/useSyncSettings';
import { PrivacySyncSettings } from '../components';

/**
 * /settings/privacy — transaction history sync and privacy controls.
 *
 * Client component: useSyncSettings accesses localStorage and the sync API.
 * The wallet address is deliberately undefined here; a future iteration can
 * pull it from WalletContext once that context is promoted to the layout.
 */
export default function PrivacyPage() {
  const sync = useSyncSettings(undefined);

  return <PrivacySyncSettings sync={sync} />;
}
