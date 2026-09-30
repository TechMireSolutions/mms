import { useDeferredValue, useMemo, useState } from 'react';
import { normalizePlatformAdminPermissions, type PlatformAdminPermissionKey, type PlatformAdminPermissions, type PlatformUserProfile } from '@mms/shared';
import { usePlatformPermissions } from './usePlatformPermissions';
import { usePlatformAdmins, useUpdatePlatformAdminPermissions } from './usePlatformAdmins';

export function usePlatformPermissionMatrix() {
  const { isSuperUser, platformUser: currentUser } = usePlatformPermissions();
  const query = usePlatformAdmins();
  const { data: admins, isLoading } = query;
  const updatePermissions = useUpdatePlatformAdminPermissions();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const filteredAdmins = useMemo(() => {
    if (!admins) return [];
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter(
      (a) => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q),
    );
  }, [admins, deferredSearch]);

  const handleToggle = (admin: PlatformUserProfile, capKey: PlatformAdminPermissionKey) => {
    if (updatePermissions.isPending || !isSuperUser || admin.role === 'super_user' || admin.id === currentUser?.id) return;
    const currentPerms = normalizePlatformAdminPermissions(admin.permissions);
    const nextPerms: PlatformAdminPermissions = {
      ...currentPerms,
      [capKey]: !currentPerms[capKey],
    };
    updatePermissions.mutate({ adminId: admin.id, permissions: nextPerms });
  };

  return { filteredAdmins, isLoading, isError: query.isError, retry: query.refetch,
    isSuperUser, currentUser, search, setSearch, handleToggle, busy: updatePermissions.isPending };
}
