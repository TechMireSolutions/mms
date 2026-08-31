import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const { mockUseAuth, mockUseInstitutionSetupStatus } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseInstitutionSetupStatus: vi.fn(),
}));

vi.mock('@/lib/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/tenant/hooks/useGlobalSettings', () => ({
  useGlobalSettings: () => ({}),
}));

vi.mock('@/tenant/hooks/useInstitutionSetupStatus', () => ({
  useInstitutionSetupStatus: (enabled: boolean) => mockUseInstitutionSetupStatus(enabled),
}));

vi.mock('@/lib/twoFactor', () => ({
  is2FAPending: () => false,
  is2FAVerified: () => true,
}));

import ProtectedRoute from './ProtectedRoute';

describe('ProtectedRoute institution setup gate', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { role: 'admin', mustChangePassword: false },
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  async function renderAtDashboard(): Promise<void> {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<div>Dashboard page</div>} />
              <Route path="/institution-setup" element={<div>Institution setup page</div>} />
            </Route>
          </Routes>
        </MemoryRouter>,
      );
    });
  }

  it('allows another admin through when the workspace profile is already complete', async () => {
    mockUseInstitutionSetupStatus.mockReturnValue({
      data: true,
      isLoading: false,
      isError: false,
    });

    await renderAtDashboard();

    expect(container.textContent).toContain('Dashboard page');
    expect(container.textContent).not.toContain('Institution setup page');
    expect(mockUseInstitutionSetupStatus).toHaveBeenCalledWith(true);
  });

  it('redirects an admin when the workspace profile is incomplete', async () => {
    mockUseInstitutionSetupStatus.mockReturnValue({
      data: false,
      isLoading: false,
      isError: false,
    });

    await renderAtDashboard();

    expect(container.textContent).toContain('Institution setup page');
    expect(container.textContent).not.toContain('Dashboard page');
  });
});
