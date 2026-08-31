/**
 * Unit tests for the refactored settings subroutes (issue #1048).
 *
 * page.tsx is now a server-side redirect component — we test the layout
 * and individual subroute pages directly.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '@/lib/i18n/provider';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockSetTheme = vi.fn((t: string) => localStorage.setItem('theme', t));
vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    theme: localStorage.getItem('theme') ?? 'system',
    setTheme: mockSetTheme,
  }),
}));

let mockPathname = '/settings/profile';
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  redirect: (url: string) => { throw new Error(`NEXT_REDIRECT:${url}`); },
}));

vi.mock('@/hooks/useSyncSettings', () => ({
  useSyncSettings: () => ({
    settings: { syncEnabled: false },
    syncStatus: { isPending: false, lastSyncAt: 0, formattedLastSync: '' },
    loading: false,
    error: null,
    toggleSync: vi.fn(),
  }),
}));

// KYCLimitManager makes API calls — stub it out
vi.mock('@/components/KYCLimitManager', () => ({
  KYCLimitManager: ({ userId }: { userId: string }) => (
    <div data-testid="kyc-limit-manager">{userId}</div>
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function withProviders(ui: React.ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

// ---------------------------------------------------------------------------
// Layout tests
// ---------------------------------------------------------------------------
import SettingsLayout from '../layout';

describe('SettingsLayout', () => {
  beforeEach(() => {
    mockPathname = '/settings/profile';
    mockSetTheme.mockClear();
  });

  it('renders the sidebar navigation', () => {
    withProviders(
      <SettingsLayout>
        <div>Content</div>
      </SettingsLayout>,
    );

    const nav = screen.getByRole('navigation', { name: /settings navigation/i });
    expect(nav).toBeTruthy();
  });

  it('renders all five navigation links', () => {
    withProviders(
      <SettingsLayout>
        <div>Content</div>
      </SettingsLayout>,
    );

    expect(screen.getByRole('link', { name: /profile/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /security/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /appearance/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /preferences/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /privacy/i })).toBeTruthy();
  });

  it('marks the active link with aria-current="page"', () => {
    mockPathname = '/settings/security';
    withProviders(
      <SettingsLayout>
        <div>Content</div>
      </SettingsLayout>,
    );

    const activeLink = screen.getByRole('link', { name: /security/i });
    expect(activeLink.getAttribute('aria-current')).toBe('page');
  });

  it('does not mark non-active links with aria-current', () => {
    mockPathname = '/settings/security';
    withProviders(
      <SettingsLayout>
        <div>Content</div>
      </SettingsLayout>,
    );

    const profileLink = screen.getByRole('link', { name: /profile/i });
    expect(profileLink.getAttribute('aria-current')).toBeNull();
  });

  it('renders slot children inside main content area', () => {
    withProviders(
      <SettingsLayout>
        <div data-testid="child-content">Hello</div>
      </SettingsLayout>,
    );

    expect(screen.getByTestId('child-content')).toBeTruthy();
  });

  it('reset button calls setTheme("system")', () => {
    withProviders(
      <SettingsLayout>
        <div>Content</div>
      </SettingsLayout>,
    );

    const resetBtn = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetBtn);

    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });
});

// ---------------------------------------------------------------------------
// Individual subroute page tests
// ---------------------------------------------------------------------------
import ProfilePage from '../profile/page';
import SecurityPage from '../security/page';
import AppearancePage from '../appearance/page';
import PreferencesPage from '../preferences/page';
import PrivacyPage from '../privacy/page';

describe('Profile page', () => {
  it('renders the profile section', () => {
    withProviders(<ProfilePage />);
    expect(screen.getByRole('textbox', { name: /display name/i })).toBeTruthy();
  });
});

describe('Security page', () => {
  it('renders the security section with KYCLimitManager', () => {
    withProviders(<SecurityPage />);
    expect(screen.getByTestId('kyc-limit-manager')).toBeTruthy();
  });
});

describe('Appearance page', () => {
  it('renders theme selection buttons', () => {
    withProviders(<AppearancePage />);
    expect(screen.getByRole('button', { name: /dark/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /light/i })).toBeTruthy();
  });

  it('calls setTheme when a theme button is clicked', () => {
    withProviders(<AppearancePage />);
    const darkBtn = screen.getByRole('button', { name: /dark/i });
    fireEvent.click(darkBtn);
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });
});

describe('Preferences page', () => {
  it('renders the language select', () => {
    withProviders(<PreferencesPage />);
    expect(screen.getByRole('combobox', { name: /language/i })).toBeTruthy();
  });

  it('persists language change to localStorage', () => {
    withProviders(<PreferencesPage />);
    const select = screen.getByRole('combobox', { name: /language/i });
    fireEvent.change(select, { target: { value: 'es' } });
    expect(localStorage.getItem('stellar_language')).toBe('es');
  });
});

describe('Privacy page', () => {
  it('renders the privacy & sync section', () => {
    withProviders(<PrivacyPage />);
    // The section header "Privacy & Sync" should be present
    expect(screen.getByText(/privacy.*sync/i)).toBeTruthy();
  });
});
