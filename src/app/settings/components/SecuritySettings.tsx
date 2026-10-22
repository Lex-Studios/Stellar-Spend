'use client';

import { useI18n } from '@/lib/i18n';
import { KYCLimitManager } from '@/components/KYCLimitManager';
import { SettingsSection } from './SettingsSection';

interface SecuritySettingsProps {
  userId?: string;
}

/** Security section — identity verification and transaction limits. */
export function SecuritySettings({ userId = 'current-user' }: SecuritySettingsProps) {
  const { t } = useI18n();

  return (
    <SettingsSection
      title={t('settings.security')}
      description="Identity verification and transaction limits"
    >
      <KYCLimitManager userId={userId} />
    </SettingsSection>
  );
}
