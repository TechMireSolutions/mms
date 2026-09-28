import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import PlatformSettingsPage from './PlatformSettingsPage';

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (k: string) => k,
  }),
}));

vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}));

vi.mock('@/platform/hooks/usePlatformPermissions', () => ({
  usePlatformPermissions: () => ({
    canSystem: true,
    isSuperUser: true,
    platformUser: { id: 'admin-1', name: 'Zaid' },
  }),
}));

vi.mock('@/platform/hooks/usePlatformSettings', () => ({
  usePlatformSettingsQuery: () => ({
    data: {
      syncTlsOnCreate: true,
      tlsExtraSans: '',
      certbotEmail: 'admin@example.com',
    },
    isLoading: false,
    isError: false,
  }),
  useUpdatePlatformSettings: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/platform/components/PlatformSystemMaintenance', () => ({
  PlatformSystemMaintenance: () => <div>System Maintenance Mock</div>,
}));

describe('PlatformSettingsPage', () => {
  it('renders settings shell with navigation sections', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <PlatformSettingsPage />
      </MemoryRouter>,
    );

    expect(html).toContain('Platform Settings');
    expect(html).toContain('Global &amp; TLS');
    expect(html).toContain('Appearance &amp; Theme');
    expect(html).toContain('Security &amp; Session');
  });
});
