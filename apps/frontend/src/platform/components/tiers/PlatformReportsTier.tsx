import React, { Suspense, lazy } from 'react';
import { BarChart3, LayoutDashboard } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { SubTabBar, type SubTab } from '@/components/ui/SubTabBar';
import { StatsSkeleton } from '@/components/ui/LoadingState';

const PlatformReports = lazy(() =>
  import('@/platform/components/PlatformReports').then((m) => ({ default: m.PlatformReports })),
);
const PlatformDashboard = lazy(() =>
  import('@/platform/components/PlatformDashboard').then((m) => ({ default: m.PlatformDashboard })),
);

export type PlatformReportsSubTab = 'analytics' | 'telemetry';

export interface PlatformReportsTierProps {
  activeSubTab: PlatformReportsSubTab;
  onSubTabChange: (tab: PlatformReportsSubTab) => void;
}

function ReportsFallback(): React.JSX.Element {
  return <StatsSkeleton count={3} />;
}

export function PlatformReportsTier({
  activeSubTab,
  onSubTabChange,
}: PlatformReportsTierProps): React.JSX.Element {
  const { t } = useTranslation();

  const subTabs: readonly SubTab<PlatformReportsSubTab>[] = [
    {
      key: 'analytics',
      label: t('platform.analyticsTab'),
      icon: BarChart3,
    },
    {
      key: 'telemetry',
      label: t('platform.telemetryTab'),
      icon: LayoutDashboard,
    },
  ];

  return (
    <div className="space-y-6">
      <SubTabBar
        tabs={subTabs}
        value={activeSubTab}
        onChange={onSubTabChange}
        variant="pill"
        panelIdPrefix="platform-reports-subtab"
      />

      <Suspense fallback={<ReportsFallback />}>
        {activeSubTab === 'analytics' && <PlatformReports />}
        {activeSubTab === 'telemetry' && <PlatformDashboard />}
      </Suspense>
    </div>
  );
}
