import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PLATFORM_ADMIN_PERMISSIONS, type PlatformUserProfile } from '@mms/shared';
import { usePlatformPermissionMatrix } from './usePlatformPermissionMatrix';

const mocks = vi.hoisted(() => ({ mutate: vi.fn(), isSuperUser: true, busy: false }));
const admin: PlatformUserProfile = {
  id: 'other', name: 'Operator', email: 'operator@example.com', role: 'admin',
  permissions: { ...DEFAULT_PLATFORM_ADMIN_PERMISSIONS, settings: true },
};
vi.mock('./usePlatformAdmins', () => ({
  usePlatformAdmins: () => ({ data: [admin], isLoading: false, isError: false, refetch: vi.fn() }),
  useUpdatePlatformAdminPermissions: () => ({ mutate: mocks.mutate, isPending: mocks.busy }),
}));
vi.mock('./usePlatformPermissions', () => ({
  usePlatformPermissions: () => ({ isSuperUser: mocks.isSuperUser, platformUser: { id: 'self' } }),
}));

function Probe({ target = admin }: { target?: PlatformUserProfile }) {
  const { handleToggle } = usePlatformPermissionMatrix();
  return <button onClick={() => handleToggle(target, 'workspaces')}>Toggle</button>;
}

async function toggle(target?: PlatformUserProfile) {
  const container = document.createElement('div');
  const root = createRoot(container);
  try {
    await act(async () => root.render(<Probe target={target} />));
    await act(async () => container.querySelector('button')?.click());
  } finally { await act(async () => root.unmount()); }
}

beforeEach(() => { mocks.mutate.mockClear(); mocks.isSuperUser = true; mocks.busy = false; });

describe('permission matrix updates', () => {
  it('changes only the selected capability', async () => {
    await toggle();
    expect(mocks.mutate).toHaveBeenCalledWith({ adminId: 'other', permissions: { ...admin.permissions, workspaces: true } });
  });

  it('blocks self edits, super-user edits, limited operators, and concurrent mutations', async () => {
    await toggle({ ...admin, id: 'self' });
    await toggle({ ...admin, role: 'super_user' });
    mocks.isSuperUser = false;
    await toggle();
    mocks.isSuperUser = true;
    mocks.busy = true;
    await toggle();
    expect(mocks.mutate).not.toHaveBeenCalled();
  });
});
