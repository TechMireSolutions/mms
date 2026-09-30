import React, { useState } from 'react';
import { ShieldCheck, Settings } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { SubTabBar, type SubTab } from '@/components/ui/SubTabBar';
import { PlatformPermissionMatrix } from '@/platform/components/users/PlatformPermissionMatrix';
import { PlatformSecuritySettingsPanel } from '@/platform/components/settings/PlatformSecuritySettingsPanel';

export type PlatformUsersSetupSubTab = 'permissions' | 'preferences';

export interface PlatformUsersSetupTierProps {
  activeSubTab?: PlatformUsersSetupSubTab;
  onSubTabChange?: (tab: PlatformUsersSetupSubTab) => void;
}

export function PlatformUsersSetupTier({
  activeSubTab,
  onSubTabChange,
}: PlatformUsersSetupTierProps = {}): React.JSX.Element {
  const { t } = useTranslation();
  const [internalSubTab, setInternalSubTab] = useState<PlatformUsersSetupSubTab>('permissions');
  const currentSubTab = activeSubTab ?? internalSubTab;
  const setSubTab = onSubTabChange ?? setInternalSubTab;

  const subTabs: SubTab<PlatformUsersSetupSubTab>[] = [
    {
      key: 'permissions',
      label: t('users.permissions'),
      icon: ShieldCheck,
    },
    {
      key: 'preferences',
      label: t('users.setup.preferences'),
      icon: Settings,
    },
  ];

  return (
    <div className="space-y-6 text-start">
      <SubTabBar
        tabs={subTabs}
        value={currentSubTab}
        onChange={setSubTab}
        variant="pill"
        panelIdPrefix="platform-users-setup-tab"
      />

      {currentSubTab === 'permissions' && <PlatformPermissionMatrix />}
      {currentSubTab === 'preferences' && <PlatformSecuritySettingsPanel />}
    </div>
  );
}
