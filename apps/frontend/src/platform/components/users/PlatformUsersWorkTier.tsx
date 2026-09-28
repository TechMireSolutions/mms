import React from 'react';
import { usePlatformAdmins } from '@/platform/hooks/usePlatformAdmins';
import { PlatformAdminsList } from '@/platform/pages/PlatformAdminsList';

export function PlatformUsersWorkTier(): React.JSX.Element {
  const { data: admins, isLoading, isError, refetch } = usePlatformAdmins();

  return (
    <PlatformAdminsList
      admins={admins}
      loading={isLoading}
      fetchError={isError}
      onRetry={() => void refetch()}
    />
  );
}
