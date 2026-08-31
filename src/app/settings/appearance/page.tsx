'use client';

import { useTheme } from '@/hooks/useTheme';
import { AppearanceSettings } from '../components';

/**
 * /settings/appearance — theme selection.
 *
 * Client component: reads and writes theme via useTheme hook, which
 * interacts with localStorage and the DOM data-theme attribute.
 */
export default function AppearancePage() {
  const { theme, setTheme } = useTheme();

  return <AppearanceSettings theme={theme} onThemeChange={setTheme} />;
}
