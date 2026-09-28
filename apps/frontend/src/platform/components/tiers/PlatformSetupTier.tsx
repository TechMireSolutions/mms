import React, { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Server, Waypoints, ArrowUpRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { SubTabBar, type SubTab } from '@/components/ui/SubTabBar';
import { CardSkeleton } from '@/components/ui/LoadingState';
import { ROUTES } from '@/lib/config/routes';

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

      {activeSubTab === 'admins' && canAdmins && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs">
          <span className="text-muted-foreground font-medium">
            Looking for operator permissions matrix, reports, and directory?
          </span>
          <Link to={ROUTES.platformUsers} className="inline-flex items-center gap-1 font-bold text-primary hover:underline">
            Open Platform Users Module <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {activeSubTab === 'system' && canSystem && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs">
          <span className="text-muted-foreground font-medium">
            Configure Apex TLS, Appearance themes, and Security Governance in Settings.
          </span>
          <Link to={ROUTES.platformSettings} className="inline-flex items-center gap-1 font-bold text-primary hover:underline">
            Open Platform Settings <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <Suspense fallback={<SetupFallback />}>
        {activeSubTab === 'admins' && canAdmins && <PlatformAdminsContent />}
        {activeSubTab === 'system' && canSystem && <PlatformSystemMaintenance />}
        {activeSubTab === 'erd' && canSystem && <ErdExplorer />}
      </Suspense>
    </div>
  );
}
