import { describe, it, expect } from 'vitest';
import {
  PLATFORM_STATIC_COMMANDS,
  buildWorkspaceCommandItems,
  commandItemIsPermitted,
} from './platformCommandItems';

describe('platformCommandItems', () => {
  it('includes static route navigation and action commands', () => {
    const ids = PLATFORM_STATIC_COMMANDS.map((c) => c.id);
    expect(ids).toContain('dashboard');
    expect(ids).toContain('workspaces');
    expect(ids).toContain('reports');
    expect(ids).toContain('system');
    expect(ids).toContain('create-admin');
    expect(ids).toContain('system-diagnostics');
    expect(ids).toContain('export-workspaces');
  });

  it('builds dynamic workspace command items with query search path', () => {
    const items = buildWorkspaceCommandItems([
      {
        subdomain: 'al-noor',
        madrasaName: 'Al Noor Academy',
        enabled: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('ws-al-noor');
    expect(items[0].customLabel).toBe('Al Noor Academy');
    expect(items[0].path).toContain('q=al-noor');
  });

  it('filters command items based on operator permissions', () => {
    const adminCommand = PLATFORM_STATIC_COMMANDS.find((c) => c.id === 'create-admin')!;
    const systemCommand = PLATFORM_STATIC_COMMANDS.find((c) => c.id === 'system-diagnostics')!;

    const permsWithoutAdmin = {
      canWorkspaces: true,
      canOnboard: true,
      canSystem: true,
      canAdmins: false,
    };

    expect(commandItemIsPermitted(adminCommand, permsWithoutAdmin)).toBe(false);
    expect(commandItemIsPermitted(systemCommand, permsWithoutAdmin)).toBe(true);
  });
});
