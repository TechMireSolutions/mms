import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import PlatformReportsPage from './PlatformReportsPage';

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (k: string, p?: Record<string, string>) => {
      const map: Record<string, string> = {
        'module.reports': 'Platform Analytics',
        'platform.consoleTitle': 'Platform Console',
        'platform.consoleSubtitle': `System management for ${p?.name ?? 'Admin'}`,
      };
      return map[k] ?? k;
    },
  }),
}));

vi.mock('@/platform/hooks/usePlatformPermissions', () => ({
  usePlatformPermissions: () => ({
    isSuperUser: true,
    platformUser: { id: 'admin-1', name: 'Zaid', email: 'zaid@example.com' },
  }),
}));

vi.mock('@/platform/components/tiers/PlatformReportsTier', () => ({
  PlatformReportsTier: ({ activeSubTab }: { activeSubTab: string }) => (
    <div data-testid="platform-reports-tier">Reports Tier: {activeSubTab}</div>
  ),
}));

describe('PlatformReportsPage', () => {
  it('renders reports page with analytics tier', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/platform/reports']}>
        <PlatformReportsPage />
      </MemoryRouter>,
    );

    expect(html).toContain('Platform Analytics');
    expect(html).toContain('System management for Zaid');
    expect(html).toContain('Reports Tier: analytics');
  });

  it('renders telemetry subtab when requested via query param', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/platform/reports?subtab=telemetry']}>
        <PlatformReportsPage />
      </MemoryRouter>,
    );

    expect(html).toContain('Reports Tier: telemetry');
  });
});
