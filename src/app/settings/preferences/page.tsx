'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { PreferencesSettings } from '../components';
import type { NotificationPrefs } from '../components';

/**
 * /settings/preferences — language and notification preferences.
 *
 * Client component: manages local notification state and delegates
 * language changes to the i18n context.
 */
export default function PreferencesPage() {
  const { language, setLanguage } = useI18n();
  const [notifications, setNotifications] = useState<NotificationPrefs>({
    email: true,
    push: false,
    marketing: false,
  });

  return (
    <PreferencesSettings
      language={language}
      onLanguageChange={setLanguage}
      notifications={notifications}
      onNotificationsChange={setNotifications}
    />
  );
}
