import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { SubTabBar } from '@/components/ui/SubTabBar';
import { RolesPermissions } from '@/tenant/features/users/components/RolesPermissions';
import { UsersSettingsPanel } from '@/tenant/features/users/components/UsersSettingsPanel';

interface UsersSetupTab {
  id: string;
  label: string;
}

interface UsersSetupTierProps {
  tabs: UsersSetupTab[];
  activeTab: string;
  canEditSetup: boolean;
  onTabChange: (tab: string) => void;
}

export function UsersSetupTier({
  tabs,
  activeTab,
  canEditSetup,
  onTabChange,
}: UsersSetupTierProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <motion.div
      key={`setup-${activeTab}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="space-y-4"
    >
      <SubTabBar
        tabs={tabs.map((tab) => ({ key: tab.id, label: tab.label }))}
        value={activeTab}
        onChange={onTabChange}
      />
      {!canEditSetup ? (
        <p className="text-sm text-muted-foreground rounded-xl border border-border bg-muted/20 px-4 py-6">
          {t('users.setup.readOnly')}
        </p>
      ) : (
        <>
          {activeTab === 'permissions' && <RolesPermissions />}
          {activeTab === 'fields' && <UsersSettingsPanel mode="fields" />}
          {activeTab === 'preferences' && <UsersSettingsPanel mode="preferences" />}
        </>
      )}
    </motion.div>
  );
}
