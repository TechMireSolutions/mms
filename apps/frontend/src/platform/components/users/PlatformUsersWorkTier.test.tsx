import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlatformUsersWorkTier } from './PlatformUsersWorkTier';

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (k: string) => k,
  }),
}));

vi.mock('@/platform/hooks/usePlatformAdmins', () => ({
  usePlatformAdmins: () => ({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/platform/pages/PlatformAdminsList', () => ({
  PlatformAdminsList: () => <div data-testid="admins-list">Operators List</div>,
}));

vi.mock('@/platform/components/PlatformActivityLogsContent', () => ({
  PlatformActivityLogsContent: () => <div data-testid="activity-logs">Activity Logs</div>,
}));

describe('PlatformUsersWorkTier', () => {
  it('renders operators directory and subtabs', () => {
    const html = renderToStaticMarkup(<PlatformUsersWorkTier />);
    expect(html).toContain('nav.users');
    expect(html).toContain('platform.activityLogsTitle');
    expect(html).toContain('Operators List');
  });

  it('renders activity logs when activeSubTab is activity', () => {
    const html = renderToStaticMarkup(<PlatformUsersWorkTier activeSubTab="activity" />);
    expect(html).toContain('Activity Logs');
  });
});
