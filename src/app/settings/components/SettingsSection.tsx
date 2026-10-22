import type { ReactNode } from 'react';
import { SectionHeader } from './SectionHeader';

interface SettingsSectionProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <section className="space-y-8">
      <SectionHeader title={title} description={description} />
      {children}
    </section>
  );
}
