import React from 'react';
import { Server } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { ModuleScaffold } from '@/components/common/ModuleScaffold';
import { PlatformSystemMaintenance } from '@/platform/components/PlatformSystemMaintenance';

export default function PlatformSystemPage(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ModuleScaffold
      seoTitle={`${t('platform.systemMaintenance')} | ${t('platform.consoleTitle')}`}
      seoDescription={t('platform.systemMaintenanceSubtitle')}
      headerIcon={Server}
      headerTitle={t('platform.systemMaintenance')}
      headerSubtitle={t('platform.systemMaintenanceSubtitle')}
    >
      <PlatformSystemMaintenance />
    </ModuleScaffold>
  );
}
