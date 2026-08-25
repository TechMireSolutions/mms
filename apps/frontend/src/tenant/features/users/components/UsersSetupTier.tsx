import { useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { AppTranslationKey } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { SubTabBar } from '@/components/ui/SubTabBar';
import { useModuleSetupSubTabs } from '@/lib/setup/useModuleSetupSubTabs';
import { SetupReadOnlyMessage } from '@/components/ui/SetupReadOnlyMessage';
import { RolesPermissions } from '@/tenant/features/users/components/RolesPermissions';
import { UsersSettingsPanel } from '@/tenant/features/users/components/UsersSettingsPanel';
import { useUsersSetupPanelState } from '@/tenant/features/users/hooks/useUsersSetupPanelState';
import React from "react";

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

function discardConfirmKey(leavingTab: string): AppTranslationKey {
  if (leavingTab === 'fields') return 'users.setup.discardUnsavedFieldsConfirm';
  if (leavingTab === 'permissions') return 'users.setup.discardUnsavedPermissionsConfirm';
  return 'users.setup.discardUnsavedPreferencesConfirm';
}

export const UsersSetupTier = React.memo(function UsersSetupTier({
      tabs,
      activeTab,
      canEditSetup,
      onTabChange,
    }: UsersSetupTierProps): React.JSX.Element {
      const { t } = useTranslation();
      const panelState = useUsersSetupPanelState();
      const permissionsDirtyRef = useRef(false);
      const discardPermissionsRef = useRef<() => void>(() => {});

      const handlePermissionsDirtyChange = useCallback((dirty: boolean) => {
        permissionsDirtyRef.current = dirty;
      }, []);

      const handleRegisterPermissionsDiscard = useCallback((discard: () => void) => {
        discardPermissionsRef.current = discard;
      }, []);

      const subTabs = useModuleSetupSubTabs({
        initialKey: activeTab || 'permissions',
        isDirty: (currentKey) => {
          if (currentKey === 'preferences') return panelState.dirtyRef.current.prefs;
          if (currentKey === 'permissions') return permissionsDirtyRef.current;
          return false;
        },
        onDiscard: (leavingKey) => {
          if (leavingKey === 'permissions') {
            discardPermissionsRef.current();
            permissionsDirtyRef.current = false;
            return;
          }
          panelState.discardSetupDrafts();
        },
      });

      useEffect(() => {
        if (subTabs.sub !== activeTab) {
          onTabChange(subTabs.sub);
        }
      }, [subTabs.sub, activeTab, onTabChange]);

      const showSettingsPanel = subTabs.showPrefs;

      return (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="space-y-4"
        >
          <SubTabBar
            tabs={tabs.map((tab) => ({ key: tab.id, label: tab.label }))}
            value={subTabs.sub}
            onChange={subTabs.handleSubTabChange}
          />
          {!canEditSetup ? (
            <SetupReadOnlyMessage title={t('users.setup.readOnly')} />
          ) : (
            <>
              {subTabs.sub === 'permissions' ? (
                <RolesPermissions
                  onDirtyChange={handlePermissionsDirtyChange}
                  onRegisterDiscard={handleRegisterPermissionsDiscard}
                />
              ) : null}
              {showSettingsPanel ? (
                <UsersSettingsPanel
                  settingsDraft={panelState.settingsDraft}
                  saved={panelState.saved}
                  saving={panelState.saving}
                  isDirty={panelState.isPrefsDirty}
                  upd={panelState.upd}
                  onSave={() => panelState.handleSave()}
                />
              ) : null}
            </>
          )}

          <ConfirmAlertDialog
            open={subTabs.discardConfirmOpen}
            onOpenChange={(open) => {
              if (!open) subTabs.clearPendingSubTab();
            }}
            title={t('settings.unsavedChanges')}
            description={t(discardConfirmKey(subTabs.sub))}
            confirmLabel={t('common.yes')}
            cancelLabel={t('common.cancel')}
            destructive
            onConfirm={subTabs.handleConfirmDiscard}
          />
        </motion.div>
      );
    });
