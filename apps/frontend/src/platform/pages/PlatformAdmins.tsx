import React from 'react';
import { PlatformPageShell } from '@/platform/components/PlatformPageShell';
import { useTranslation } from '@/hooks/useTranslation';
import { usePlatformAdmins } from '@/platform/hooks/usePlatformAdmins';
import { PageHeader } from '@/components/ui/PageHeader';
import { PlatformAdminsList } from '@/platform/pages/PlatformAdminsList';
import { PlatformAddAdminForm } from '@/platform/pages/PlatformAddAdminForm';

export default function PlatformAdmins(): React.JSX.Element {
  const { t } = useTranslation();
  const { data: admins, isLoading: loadingAdmins, isError: fetchError, refetch } = usePlatformAdmins();

  return (
    <PlatformPageShell width="7xl">
      <div className="space-y-8">
        <PageHeader
          title={t('platform.adminsTitle')}
          subtitle={t('platform.adminsSubtitle')}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <PlatformAdminsList
            admins={admins}
            loading={loadingAdmins}
            fetchError={fetchError}
            onRetry={() => void refetch()}
          />
          <PlatformAddAdminForm />
        </div>
      </div>
    </PlatformPageShell>
  );
}
