import { useMemo, useRef, lazy, Suspense } from "react";
import { CONTACTS_MODULE_MANIFEST, DEFAULT_SETTINGS_SUB_TABS } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { shouldOpenContactsSyncSetup } from "@/lib/contacts/googleContactsOAuth";
import { resolveRegistryLabel } from "@/lib/contacts/contactI18n";
import type { Contact } from "@mms/shared";
import { useModuleSetupSubTabs } from "@/lib/setup/useModuleSetupSubTabs";
import { ModulePanelSuspenseFallback } from "@/components/ui/ModulePanelSuspenseFallback";

const ContactsSetupPanel = lazy(() => import("@/tenant/features/contacts/components/ContactsSetupPanel"));
const ContactSyncPanel = lazy(() => import("@/tenant/features/contacts/components/ContactSyncPanel"));

interface ContactsSettingsPanelProps {
  onImport: (list: Contact[]) => void | Promise<void>;
  canWrite: boolean;
  canEditSetup: boolean;
}

export default function ContactsSettingsPanel({
  onImport,
  canWrite,
  canEditSetup,
}: ContactsSettingsPanelProps): JSX.Element {
  const { t } = useTranslation();
  const { fieldConfig, formTabsReady, updateConfig, updateConfigAsync } = useContactConfig();
  const dirtyRef = useRef({ fields: false, prefs: false });

  const settingsSubTabs = useMemo(() => {
    const tabsFromConfig = fieldConfig.settingsSubTabs || [];
    const defaultByKey = new Map(DEFAULT_SETTINGS_SUB_TABS.map((tab) => [tab.key, tab]));
    return CONTACTS_MODULE_MANIFEST.setupSubTabs
      .map((key, index) => {
        const setupTabConfig = tabsFromConfig.find((tab) => tab.key === key);
        const seedTab = defaultByKey.get(key);
        const labelSource = {
          label: setupTabConfig?.label ?? seedTab?.label ?? key,
          labelKey: setupTabConfig?.labelKey ?? seedTab?.labelKey,
        };
        return {
          key,
          label: resolveRegistryLabel(labelSource, t),
          order: setupTabConfig?.order ?? seedTab?.order ?? index,
          enabled: setupTabConfig?.enabled ?? seedTab?.enabled ?? true,
        };
      })
      .filter((tab) => tab.enabled)
      .sort((a, b) => a.order - b.order);
  }, [fieldConfig.settingsSubTabs, t]);

  const subTabs = useModuleSetupSubTabs({
    initialKey: shouldOpenContactsSyncSetup()
      ? "sync"
      : settingsSubTabs[0]?.key || "preferences",
    isDirty: (currentKey) => {
      if (currentKey === "fields") return dirtyRef.current.fields;
      if (currentKey === "preferences") return dirtyRef.current.prefs;
      return false;
    },
    onDiscard: (leavingKey) => {
      if (leavingKey === "fields") dirtyRef.current.fields = false;
      if (leavingKey === "preferences") dirtyRef.current.prefs = false;
    },
  });

  const setFieldsDirty = (isDirty: boolean): void => {
    dirtyRef.current.fields = isDirty;
  };
  const setPrefsDirty = (isDirty: boolean): void => {
    dirtyRef.current.prefs = isDirty;
  };

  return (
    <div className="space-y-4">
      <SubTabBar
        tabs={settingsSubTabs.map((tab) => ({ key: tab.key, label: tab.label }))}
        value={subTabs.sub}
        onChange={subTabs.handleSubTabChange}
      />
      <Suspense fallback={<ModulePanelSuspenseFallback />}>
        {subTabs.showFields &&
          (!formTabsReady ? (
            <ModulePanelSuspenseFallback />
          ) : canEditSetup ? (
            <ContactsSetupPanel
              config={fieldConfig}
              onConfigChange={updateConfig}
              onConfigChangeAsync={updateConfigAsync}
              mode="fields"
              onFieldsDirtyChange={setFieldsDirty}
            />
          ) : (
            <SetupReadOnlyMessage title={t("contacts.setupReadOnly")} />
          ))}
        {subTabs.showPrefs &&
          (canEditSetup ? (
            <ContactsSetupPanel
              config={fieldConfig}
              onConfigChange={updateConfig}
              onConfigChangeAsync={updateConfigAsync}
              mode="preferences"
              onPrefsDirtyChange={setPrefsDirty}
            />
          ) : (
            <SetupReadOnlyMessage title={t("contacts.setupReadOnly")} />
          ))}
        {subTabs.showSync && (
          // Sync mutates contacts + OAuth secrets — gate on contacts.write (canWrite),
          // never OR with canEditSetup (mms-auth-security). Fields/Prefs stay canEditSetup.
          <ContactSyncPanel onImport={onImport} canWrite={canWrite} />
        )}
      </Suspense>

      <ConfirmAlertDialog
        open={subTabs.discardConfirmOpen}
        onOpenChange={(open) => {
          if (!open) subTabs.clearPendingSubTab();
        }}
        title={t("settings.unsavedChanges")}
        description={
          subTabs.discardConfirmIsFields
            ? t("contacts.setup.discardUnsavedFieldsConfirm")
            : t("contacts.setup.discardUnsavedPreferencesConfirm")
        }
        confirmLabel={t("common.yes")}
        cancelLabel={t("common.cancel")}
        destructive
        onConfirm={subTabs.handleConfirmDiscard}
      />
    </div>
  );
}
