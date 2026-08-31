import type { Metadata } from 'next';
import { ProfileSettings } from '../components';

export const metadata: Metadata = {
  title: 'Profile Settings — Stellar-Spend',
};

/**
 * /settings/profile — public presence and account details.
 */
export default function ProfilePage() {
  return <ProfileSettings />;
}
