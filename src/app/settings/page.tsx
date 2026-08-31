import { redirect } from 'next/navigation';

/**
 * /settings  →  /settings/profile
 *
 * The monolithic settings page has been split into subroutes (issue #1048).
 * This redirect ensures any existing deep-links to /settings still work.
 */
export default function SettingsPage() {
  redirect('/settings/profile');
}
