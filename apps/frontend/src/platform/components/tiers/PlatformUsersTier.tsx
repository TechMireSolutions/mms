import React, { Suspense } from 'react';
import { Users, BarChart3, Settings } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { SubTabBar, type SubTab } from '@/components/ui/SubTabBar';
import { CardSkeleton } from '@/components/ui/LoadingState';
import { PlatformUsersWorkTier } from '@/platform/components/users/PlatformUsersWorkTier';
import { PlatformUsersReportsTier } from '@/platform/components/users/PlatformUsersReportsTier';
import { PlatformUsersSetupTier } from '@/platform/components/users/PlatformUsersSetupTier';

import type { PlatformUsersWorkSubTab } from '@/platform/components/users/PlatformUsersWorkTier';
import type { PlatformUsersSetupSubTab } from '@/platform/components/users/PlatformUsersSetupTier';

export type PlatformUsersSubTab = 'work' | 'reports' | 'setup';

export interface PlatformUsersTierProps {
  activeSubTab?: PlatformUsersSubTab;
  onSubTabChange?: (tab: PlatformUsersSubTab) => void;
  showSubTabBar?: boolean;
  activeWorkSubTab?: PlatformUsersWorkSubTab;
  onWorkSubTabChange?: (tab: PlatformUsersWorkSubTab) => void;
  activeSetupSubTab?: PlatformUsersSetupSubTab;
  onSetupSubTabChange?: (tab: PlatformUsersSetupSubTab) => void;
}

function UsersFallback(): React.JSX.Element {
  return <CardSkeleton count={3} />;
}

/**
 * Platform Users Tier component.
 * Features 3 tiers aligned with MMS standard architecture:
 * 1. Work — Operators directory & audit activity logs
 * 2. Reports — Operator capabilities, security stats, and role distribution metrics
 * 3. Setup — Permissions matrix and platform security policies
 */
export function PlatformUsersTier({
  activeSubTab = 'work',
  onSubTabChange,
  showSubTabBar = true,
  activeWorkSubTab,
  onWorkSubTabChange,
  activeSetupSubTab,
  onSetupSubTabChange,
}: PlatformUsersTierProps): React.JSX.Element {
  const { t } = useTranslation();

  const subTabs: readonly SubTab<PlatformUsersSubTab>[] = [
    {
      key: 'work',
      label: t('module.work'),
      icon: Users,
    },
    {
      key: 'reports',
      label: t('module.reports'),
      icon: BarChart3,
    },
    {
      key: 'setup',
      label: t('module.setup'),
      icon: Settings,
    },
  ];

  return (
    <div className="space-y-6 text-start">
      {showSubTabBar && onSubTabChange ? (
        <SubTabBar
          tabs={subTabs}
          value={activeSubTab}
          onChange={onSubTabChange}
          variant="pill"
          panelIdPrefix="platform-users-tier-subtab"
        />
      ) : null}

      <Suspense fallback={<UsersFallback />}>
        {activeSubTab === 'work' && (
          <PlatformUsersWorkTier
            activeSubTab={activeWorkSubTab}
            onSubTabChange={onWorkSubTabChange}
          />
        )}
        {activeSubTab === 'reports' && <PlatformUsersReportsTier />}
        {activeSubTab === 'setup' && (
          <PlatformUsersSetupTier
            activeSubTab={activeSetupSubTab}
            onSubTabChange={onSetupSubTabChange}
          />
        )}
      </Suspense>
    </div>
  );
}
