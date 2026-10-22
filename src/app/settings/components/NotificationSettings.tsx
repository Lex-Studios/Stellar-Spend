'use client';

import { useI18n } from '@/lib/i18n';
import { SettingsToggle } from './SettingsToggle';
import type { NotificationPrefs } from './types';

interface NotificationSettingsProps {
  notifications: NotificationPrefs;
  onChange: (notifications: NotificationPrefs) => void;
}

/** Notification preferences — email / push toggles. */
export function NotificationSettings({ notifications, onChange }: NotificationSettingsProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <label className="text-[10px] font-bold text-[#777] uppercase tracking-widest">
        {t('settings.notifications')}
      </label>
      <div className="space-y-3">
        <SettingsToggle
          label={t('settings.email_notifications')}
          checked={notifications.email}
          onChange={(checked) => onChange({ ...notifications, email: checked })}
        />
        <SettingsToggle
          label={t('settings.push_notifications')}
          checked={notifications.push}
          onChange={(checked) => onChange({ ...notifications, push: checked })}
        />
      </div>
    </div>
  );
}
