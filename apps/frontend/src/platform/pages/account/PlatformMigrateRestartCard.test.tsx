import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlatformMigrateRestartCard } from './PlatformMigrateRestartCard';

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/platform/hooks/usePlatformSettings', () => ({
  useMigrateAndRestartPlatform: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
  waitForBackendReadyAfterMigrate: vi.fn(),
}));

describe('PlatformMigrateRestartCard Component', () => {
  it('renders section card with title, description, and action button', () => {
    const html = renderToStaticMarkup(<PlatformMigrateRestartCard />);

    expect(html).toContain('platform.profileMigrateRestart');
    expect(html).toContain('platform.profileMigrateRestartDesc');
    expect(html).toContain('platform.profileMigrateRestartButton');
  });
});
