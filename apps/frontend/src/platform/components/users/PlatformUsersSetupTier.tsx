import React, { useState, Suspense, lazy } from 'react';
import { ShieldCheck, Activity } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { SubTabBar, type SubTab } from '@/components/ui/SubTabBar';
import { CardSkeleton } from '@/components/ui/LoadingState';
import { PlatformPermissionMatrix } from '@/platform/components/users/PlatformPermissionMatrix';

const PlatformActivityLogsContent = lazy(() => import('@/platform/components/PlatformActivityLogsContent'));

export type PlatformUsersSetupSubTab = 'matrix' | 'logs';

export function PlatformUsersSetupTier(): React.JSX.Element {
  const { t } = useTranslation();
  const [subTab, setSubTab] = useState<PlatformUsersSetupSubTab>('matrix');

  const subTabs: SubTab<PlatformUsersSetupSubTab>[] = [
    {
      key: 'matrix',
      label: 'Permissions Matrix',
      icon: ShieldCheck,
    },
    {
      key: 'logs',
      label: t('platform.activityLogsTitle'),
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-6 text-start">
      <SubTabBar
        tabs={subTabs}
        value={subTab}
        onChange={setSubTab}
        variant="pill"
        panelIdPrefix="platform-users-setup-tab"
      />

      {subTab === 'matrix' && <PlatformPermissionMatrix />}
      {subTab === 'logs' && (
        <Suspense fallback={<CardSkeleton count={2} />}>
          <PlatformActivityLogsContent />
        </Suspense>
      )}
    </div>
  );
}
