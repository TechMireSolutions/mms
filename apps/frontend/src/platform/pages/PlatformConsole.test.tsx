import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import PlatformConsole from './PlatformConsole';

const mockUsePlatformPermissions = vi.fn();
vi.mock('@/platform/hooks/usePlatformPermissions', () => ({
  usePlatformPermissions: () => mockUsePlatformPermissions(),
}));

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const map: Record<string, string> = {
        'dashboard.title': 'Console Dashboard',
        'platform.consoleTitle': 'Platform Console',
        'platform.consoleSubtitle': `System management for ${params?.name ?? 'Admin'}`,
        'platform.manageMadrasas': 'Madrasas Directory',
        'auth.createMadrasa': 'Create Madrasa',
        'module.reports': 'Platform Analytics',
        'platform.activityLogsTitle': 'Audit & Activity Logs',
        'platform.activityLogsSubtitle': 'Security events and mutation history',
        'platform.systemMaintenance': 'System Maintenance',
        'platform.systemMaintenanceSubtitle': 'Database health and service telemetry',
        'platform.adminsTitle': 'Platform Operators',
        'platform.adminsSubtitle': 'Manage access permissions and roles',
        'platform.adminNoCapabilities': 'No platform access capabilities assigned',
        'platform.adminLimitedDescription': 'Contact a platform super-user to request permissions',
      };
      return map[key] ?? key;
    },
  }),
}));

vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}));

vi.mock('@/platform/components/PlatformDashboard', () => ({
  PlatformDashboard: () => <div data-testid="platform-dashboard">Dashboard View</div>,
}));

vi.mock('@/platform/components/PlatformWorkspaceList', () => ({
  default: () => <div data-testid="platform-workspace-list">Workspaces View</div>,
}));

vi.mock('@/platform/components/PlatformReports', () => ({
  PlatformReports: () => <div data-testid="platform-reports">Reports View</div>,
}));

vi.mock('@/platform/components/PlatformActivityLogsContent', () => ({
  default: () => <div data-testid="platform-logs">Logs View</div>,
}));

vi.mock('@/platform/components/PlatformSystemMaintenance', () => ({
  PlatformSystemMaintenance: () => <div data-testid="platform-system">System View</div>,
}));

vi.mock('@/platform/components/PlatformAdminsContent', () => ({
  PlatformAdminsContent: () => <div data-testid="platform-admins">Admins View</div>,
}));

describe('PlatformConsole', () => {
  it('renders dashboard by default for authorized platform operators', () => {
    mockUsePlatformPermissions.mockReturnValue({
      platformUser: { id: 'u1', name: 'Zaid', email: 'zaid@example.com', role: 'super_user' },
      isSuperUser: true,
      canWorkspaces: true,
      canOnboard: true,
      canSystem: true,
      canSettings: true,
      canAdmins: true,
    });

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/platform/dashboard']}>
        <PlatformConsole />
      </MemoryRouter>,
    );

    expect(html).toContain('Console Dashboard');
    expect(html).toContain('System management for Zaid');
    expect(html).toContain('<title>Console Dashboard | Platform Console</title>');
  });

  it('renders EmptyState when operator lacks workspace capabilities', () => {
    mockUsePlatformPermissions.mockReturnValue({
      platformUser: { id: 'u2', name: 'Guest', email: 'guest@example.com', role: 'admin' },
      isSuperUser: false,
      canWorkspaces: false,
      canOnboard: false,
      canSystem: false,
      canSettings: false,
      canAdmins: false,
    });

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/platform/dashboard']}>
        <PlatformConsole />
      </MemoryRouter>,
    );

    expect(html).toContain('No platform access capabilities assigned');
    expect(html).toContain('Contact a platform super-user to request permissions');
  });

  it('renders Workspaces view and onboarding button when on work tab', () => {
    mockUsePlatformPermissions.mockReturnValue({
      platformUser: { id: 'u1', name: 'Zaid', email: 'zaid@example.com', role: 'super_user' },
      isSuperUser: true,
      canWorkspaces: true,
      canOnboard: true,
      canSystem: true,
      canSettings: true,
      canAdmins: true,
    });

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/platform/workspaces']}>
        <PlatformConsole />
      </MemoryRouter>,
    );

    expect(html).toContain('Madrasas Directory');
    expect(html).toContain('Create Madrasa');
  });
});
