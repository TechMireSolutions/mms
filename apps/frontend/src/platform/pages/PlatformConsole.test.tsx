import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import PlatformConsole from './PlatformConsole';

const mockUsePlatformPermissions = vi.fn();
vi.mock('@/platform/hooks/usePlatformPermissions', () => ({
  usePlatformPermissions: () => mockUsePlatformPermissions(),
}));

const TRANSLATIONS: Record<string, string> = {
  'dashboard.title': 'Console Dashboard',
  'platform.consoleTitle': 'Platform Console',
  'platform.manageMadrasas': 'Madrasas Directory',
  'auth.createMadrasa': 'Create Madrasa',
  'module.work': 'Work',
  'module.workHint': 'Daily operations',
  'nav.users': 'Users',
  'module.reports': 'Platform Analytics',
  'module.reportsHint': 'Analytics and metrics',
  'module.setup': 'Platform Setup',
  'module.setupHint': 'System configuration',
  'platform.workspacesTab': 'Workspaces',
  'platform.activityLogsTitle': 'Audit & Activity Logs',
  'platform.systemMaintenance': 'System Maintenance',
  'platform.adminsTitle': 'Platform Operators',
  'platform.adminsSubtitle': 'Manage access permissions and roles',
  'platform.adminNoCapabilities': 'No platform access capabilities assigned',
  'platform.adminLimitedDescription': 'Contact a platform super-user to request permissions',
};

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      if (key === 'platform.consoleSubtitle') return `System management for ${params?.name ?? 'Admin'}`;
      return TRANSLATIONS[key] ?? key;
    },
  }),
}));

vi.mock('@/hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));
vi.mock('@/platform/components/PlatformDashboard', () => ({ PlatformDashboard: () => <div data-testid="platform-dashboard">Dashboard View</div> }));
vi.mock('@/platform/components/PlatformWorkspaceList', () => ({ default: () => <div data-testid="platform-workspace-list">Workspaces View</div> }));
vi.mock('@/platform/components/PlatformReports', () => ({ PlatformReports: () => <div data-testid="platform-reports">Reports View</div> }));
vi.mock('@/platform/components/tiers/PlatformUsersTier', () => ({ PlatformUsersTier: () => <div data-testid="platform-users-tier">Users Tier</div> }));
vi.mock('@/platform/components/PlatformActivityLogsContent', () => ({ default: () => <div data-testid="platform-logs">Logs View</div> }));
vi.mock('@/platform/components/PlatformSystemMaintenance', () => ({ PlatformSystemMaintenance: () => <div data-testid="platform-system">System View</div> }));
vi.mock('@/platform/components/PlatformAdminsContent', () => ({ PlatformAdminsContent: () => <div data-testid="platform-admins">Admins View</div> }));
vi.mock('@/platform/pages/PlatformAddAdminForm', () => ({ PlatformAddAdminForm: () => <button data-testid="add-admin-btn">Add Admin</button> }));

describe('PlatformConsole', () => {
  const fullPermissions = {
    platformUser: { id: 'u1', name: 'Zaid', email: 'zaid@example.com', role: 'super_user' },
    isSuperUser: true,
    canWorkspaces: true,
    canOnboard: true,
    canSystem: true,
    canSettings: true,
    canAdmins: true,
  };

  it('renders dashboard by default for authorized platform operators', () => {
    mockUsePlatformPermissions.mockReturnValue(fullPermissions);
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={['/platform/dashboard']}><PlatformConsole /></MemoryRouter>);
    expect(html).toContain('Console Dashboard');
    expect(html).toContain('System management for Zaid');
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
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={['/platform/dashboard']}><PlatformConsole /></MemoryRouter>);
    expect(html).toContain('No platform access capabilities assigned');
  });

  it('renders Workspaces view and onboarding button when on work tab', () => {
    mockUsePlatformPermissions.mockReturnValue(fullPermissions);
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={['/platform/workspaces']}><PlatformConsole /></MemoryRouter>);
    expect(html).toContain('Madrasas Directory');
    expect(html).toContain('Create Madrasa');
  });

  it('renders 4 main module tabs: Work, Users, Reports, and Setup', () => {
    mockUsePlatformPermissions.mockReturnValue(fullPermissions);
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={['/platform/workspaces']}><PlatformConsole /></MemoryRouter>);
    expect(html).toContain('Work');
    expect(html).toContain('Users');
    expect(html).toContain('Platform Analytics');
    expect(html).toContain('Platform Setup');
  });

  it('renders Users tier and Add Admin button when navigating to users tab', () => {
    mockUsePlatformPermissions.mockReturnValue(fullPermissions);
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={['/platform?tab=users']}><PlatformConsole /></MemoryRouter>);
    expect(html).toContain('Users');
    expect(html).toContain('Users Tier');
    expect(html).toContain('Add Admin');
  });

  it('renders Reports tier when navigating to reports tab', () => {
    mockUsePlatformPermissions.mockReturnValue(fullPermissions);
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={['/platform/reports']}><PlatformConsole /></MemoryRouter>);
    expect(html).toContain('Platform Analytics');
    expect(html).toContain('Reports View');
  });

  it('renders Setup tier when navigating to setup tab', () => {
    mockUsePlatformPermissions.mockReturnValue(fullPermissions);
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={['/platform/dashboard?tab=setup']}><PlatformConsole /></MemoryRouter>);
    expect(html).toContain('Platform Operators');
    expect(html).toContain('System Maintenance');
    expect(html).toContain('Add Admin');
  });

  it('renders Activity Logs when navigating to activity logs route', () => {
    mockUsePlatformPermissions.mockReturnValue(fullPermissions);
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={['/platform/activity-logs']}><PlatformConsole /></MemoryRouter>);
    expect(html).toContain('Activity Logs');
  });
});

