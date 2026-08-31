import type { Metadata } from 'next';
import { SecuritySettings } from '../components';

export const metadata: Metadata = {
  title: 'Security Settings — Stellar-Spend',
};

/**
 * /settings/security — KYC verification and transaction limits.
 */
export default function SecurityPage() {
  return <SecuritySettings userId="current-user" />;
}
