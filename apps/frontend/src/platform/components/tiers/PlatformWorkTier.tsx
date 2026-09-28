import React, { Suspense, lazy } from 'react';
import { Building2, Activity } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { SubTabBar, type SubTab } from '@/components/ui/SubTabBar';
import { CardSkeleton } from '@/components/ui/LoadingState';

const PlatformWorkspaceList = lazy(() => import('@/platform/components/PlatformWorkspaceList'));
const PlatformActivityLogsContent = lazy(() => import('@/platform/components/PlatformActivityLogsContent'));

export type PlatformWorkSubTab = 'workspaces' | 'logs';

export interface PlatformWorkTierProps {
  activeSubTab: PlatformWorkSubTab;
  onSubTabChange: (tab: PlatformWorkSubTab) => void;
  canSystem: boolean;
}

function WorkspaceListFallback(): React.JSX.Element {
  return <CardSkeleton count={2} className="grid-cols-1 lg:grid-cols-2" />;
}

export function PlatformWorkTier({
  activeSubTab,
  onSubTabChange,
  canSystem,
}: PlatformWorkTierProps): React.JSX.Element {
  const { t } = useTranslation();

  const subTabs: SubTab<PlatformWorkSubTab>[] = [
    {
      key: 'workspaces',
      label: t('platform.workspacesTab'),
      icon: Building2,
    },
    ...(canSystem
      ? [
          {
            key: 'logs' as const,
            label: t('platform.activityLogsTitle'),
            icon: Activity,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <SubTabBar
        tabs={subTabs}
        value={activeSubTab}
        onChange={onSubTabChange}
        variant="pill"
        panelIdPrefix="platform-work-subtab"
      />

      <Suspense fallback={<WorkspaceListFallback />}>
        {activeSubTab === 'workspaces' && <PlatformWorkspaceList />}
        {activeSubTab === 'logs' && canSystem && <PlatformActivityLogsContent />}
      </Suspense>
    </div>
  );
}
