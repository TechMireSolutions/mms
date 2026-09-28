import React, { Suspense, lazy } from 'react';
import { ShieldCheck, Server, Waypoints } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { SubTabBar, type SubTab } from '@/components/ui/SubTabBar';
import { CardSkeleton } from '@/components/ui/LoadingState';

const PlatformAdminsContent = lazy(() =>
  import('@/platform/components/PlatformAdminsContent').then((m) => ({ default: m.PlatformAdminsContent })),
);
const PlatformSystemMaintenance = lazy(() =>
  import('@/platform/components/PlatformSystemMaintenance').then((m) => ({ default: m.PlatformSystemMaintenance })),
);
const ErdExplorer = lazy(() =>
  import('@/platform/components/erd/ErdExplorer').then((m) => ({ default: m.ErdExplorer })),
);

export type PlatformSetupSubTab = 'admins' | 'system' | 'erd';

export interface PlatformSetupTierProps {
  activeSubTab: PlatformSetupSubTab;
  onSubTabChange: (tab: PlatformSetupSubTab) => void;
  canAdmins: boolean;
  canSystem: boolean;
}

function SetupFallback(): React.JSX.Element {
  return <CardSkeleton count={2} />;
}

export function PlatformSetupTier({
  activeSubTab,
  onSubTabChange,
  canAdmins,
  canSystem,
}: PlatformSetupTierProps): React.JSX.Element {
  const { t } = useTranslation();

  const subTabs: SubTab<PlatformSetupSubTab>[] = [
    ...(canAdmins
      ? [
          {
            key: 'admins' as const,
            label: t('platform.adminsTitle'),
            icon: ShieldCheck,
          },
        ]
      : []),
    ...(canSystem
      ? [
          {
            key: 'system' as const,
            label: t('platform.systemMaintenance'),
            icon: Server,
          },
          {
            key: 'erd' as const,
            label: t('platform.erdTitle'),
            icon: Waypoints,
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
        panelIdPrefix="platform-setup-subtab"
      />

      <Suspense fallback={<SetupFallback />}>
        {activeSubTab === 'admins' && canAdmins && <PlatformAdminsContent />}
        {activeSubTab === 'system' && canSystem && <PlatformSystemMaintenance />}
        {activeSubTab === 'erd' && canSystem && <ErdExplorer />}
      </Suspense>
    </div>
  );
}
