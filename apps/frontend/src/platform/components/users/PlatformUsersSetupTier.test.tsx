import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlatformUsersSetupTier } from './PlatformUsersSetupTier';

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (k: string) => k,
  }),
}));

vi.mock('@/platform/components/users/PlatformPermissionMatrix', () => ({
  PlatformPermissionMatrix: () => <div data-testid="permission-matrix">Permission Matrix</div>,
}));

vi.mock('@/platform/components/settings/PlatformSecuritySettingsPanel', () => ({
  PlatformSecuritySettingsPanel: () => <div data-testid="security-panel">Security Panel</div>,
}));

describe('PlatformUsersSetupTier', () => {
  it('renders permissions matrix and subtabs by default', () => {
    const html = renderToStaticMarkup(<PlatformUsersSetupTier />);
    expect(html).toContain('users.permissions');
    expect(html).toContain('users.setup.preferences');
    expect(html).toContain('Permission Matrix');
  });

  it('renders preferences panel when activeSubTab is preferences', () => {
    const html = renderToStaticMarkup(<PlatformUsersSetupTier activeSubTab="preferences" />);
    expect(html).toContain('Security Panel');
  });
});
