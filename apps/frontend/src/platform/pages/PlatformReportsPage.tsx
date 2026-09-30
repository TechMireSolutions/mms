import React from 'react';
import { BarChart3 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { usePlatformPermissions } from '@/platform/hooks/usePlatformPermissions';
import { ModuleScaffold } from '@/components/common/ModuleScaffold';
import { PlatformReportsTier, type PlatformReportsSubTab } from '@/platform/components/tiers/PlatformReportsTier';

export default function PlatformReportsPage(): React.JSX.Element {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { platformUser, isSuperUser } = usePlatformPermissions();

  const rawSubTab = searchParams.get('subtab');
  const activeSubTab: PlatformReportsSubTab = rawSubTab === 'telemetry' ? 'telemetry' : 'analytics';

  const userName = platformUser?.name ?? '';
  const subtitle = isSuperUser
    ? t('platform.consoleSubtitle', { name: userName })
    : t('platform.adminConsoleSubtitle', { name: userName });

  const handleSubTabChange = (tab: PlatformReportsSubTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('subtab', tab);
      return next;
    });
  };

  return (
    <ModuleScaffold
      seoTitle={`${t('module.reports')} | ${t('platform.consoleTitle')}`}
      seoDescription={subtitle}
      headerIcon={BarChart3}
      headerTitle={t('module.reports')}
      headerSubtitle={subtitle}
    >
      <PlatformReportsTier
        activeSubTab={activeSubTab}
        onSubTabChange={handleSubTabChange}
      />
    </ModuleScaffold>
  );
}
