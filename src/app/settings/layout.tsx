'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

// ---------------------------------------------------------------------------
// Loading skeleton — shown while a tab page hydrates
// ---------------------------------------------------------------------------
function SettingsSkeleton() {
  return (
    <div className="flex-1 min-h-[600px] bg-[#0a0a0a] border border-[#222] p-8 space-y-6 animate-pulse">
      <div className="h-6 w-40 bg-[#1a1a1a] rounded" />
      <div className="h-4 w-full bg-[#1a1a1a] rounded" />
      <div className="h-4 w-3/4 bg-[#1a1a1a] rounded" />
      <div className="h-10 w-32 bg-[#1a1a1a] rounded" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar nav
// ---------------------------------------------------------------------------
function SettingsNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { setTheme } = useTheme();

  const navItems: NavItem[] = [
    { href: '/settings/profile',     label: t('settings.profile'),     icon: '👤' },
    { href: '/settings/security',    label: t('settings.security'),    icon: '🔒' },
    { href: '/settings/appearance',  label: t('settings.appearance'),  icon: '🎨' },
    { href: '/settings/preferences', label: t('settings.preferences'), icon: '⚙️' },
    { href: '/settings/privacy',     label: 'Privacy & Sync',          icon: '🔐' },
  ];

  const handleReset = () => {
    setTheme('system');
    if (typeof window !== 'undefined') {
      localStorage.setItem('stellar_language', 'en');
      // Dispatch a custom event so the i18n context can react immediately
      window.dispatchEvent(new CustomEvent('stellar:language-change', { detail: 'en' }));
    }
  };

  return (
    <aside className="w-full md:w-64 space-y-2">
      <h1 className="text-2xl font-black uppercase tracking-tighter mb-8 italic text-white">
        {t('settings.title')}
      </h1>
      <nav className="flex flex-col gap-1" aria-label="Settings navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all border',
                isActive
                  ? 'bg-[#c9a962] text-[#0a0a0a] border-[#c9a962]'
                  : 'text-[#777] border-transparent hover:border-[#333] hover:text-white',
              )}
            >
              <span className="text-base" aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="pt-8">
        <button
          onClick={handleReset}
          className="w-full px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-red-500 border border-red-900/30 hover:bg-red-900/10 transition-all"
        >
          {t('settings.reset')}
        </button>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Shared layout — exported as default (Next.js App Router convention)
// ---------------------------------------------------------------------------
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <SettingsNav />

        {/* Main Content Area */}
        <main
          id="main-content"
          className="flex-1 min-h-[600px] border border-[#222] bg-[#0a0a0a] p-8 shadow-2xl"
        >
          <Suspense fallback={<SettingsSkeleton />}>
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              {children}
            </div>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
