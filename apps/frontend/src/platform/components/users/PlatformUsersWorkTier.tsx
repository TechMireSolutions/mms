import React, { useState } from 'react';
import { Users, Activity } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { SubTabBar, type SubTab } from '@/components/ui/SubTabBar';
import { usePlatformAdmins } from '@/platform/hooks/usePlatformAdmins';
import { PlatformAdminsList } from '@/platform/pages/PlatformAdminsList';
import { PlatformActivityLogsContent } from '@/platform/components/PlatformActivityLogsContent';

export type PlatformUsersWorkSubTab = 'operators' | 'activity';

export interface PlatformUsersWorkTierProps {
  activeSubTab?: PlatformUsersWorkSubTab;
  onSubTabChange?: (tab: PlatformUsersWorkSubTab) => void;
}

export function PlatformUsersWorkTier({
  activeSubTab,
  onSubTabChange,
}: PlatformUsersWorkTierProps = {}): React.JSX.Element {
  const { t } = useTranslation();
  const [internalSubTab, setInternalSubTab] = useState<PlatformUsersWorkSubTab>('operators');
  const currentSubTab = activeSubTab ?? internalSubTab;
  const setSubTab = onSubTabChange ?? setInternalSubTab;

  const { data: admins, isLoading, isError, refetch } = usePlatformAdmins();

  const subTabs: SubTab<PlatformUsersWorkSubTab>[] = [
    {
      key: 'operators',
      label: t('nav.users'),
      icon: Users,
    },
    {
      key: 'activity',
      label: t('platform.activityLogsTitle'),
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-6 text-start">
      <SubTabBar
        tabs={subTabs}
        value={currentSubTab}
        onChange={setSubTab}
        variant="pill"
        panelIdPrefix="platform-users-work-subtab"
      />

      {currentSubTab === 'operators' && (
        <PlatformAdminsList
          admins={admins}
          loading={isLoading}
          fetchError={isError}
          onRetry={() => void refetch()}
        />
      )}

      {currentSubTab === 'activity' && <PlatformActivityLogsContent />}
    </div>
  );
}
