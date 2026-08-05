import { useMemo, useState, lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { CONTACTS_MODULE_MANIFEST, DEFAULT_SETTINGS_SUB_TABS } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { shouldOpenContactsSyncSetup } from "@/lib/contacts/googleContactsOAuth";
import { resolveRegistryLabel } from "@/lib/contacts/contactI18n";
import type { Contact } from "@mms/shared";

const ContactsSetupPanel = lazy(() => import("@/tenant/features/contacts/components/ContactsSetupPanel"));
const ContactSyncPanel = lazy(() => import("@/tenant/features/contacts/components/ContactSyncPanel"));

function LazyFallback(): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground shrink-0" aria-hidden="true" />
      <span className="sr-only">{t("common.loading")}</span>
    </div>
  );
}

function SetupReadOnlyMessage(): JSX.Element {
  const { t } = useTranslation();
  return (
    <EmptyState
      title={t("contacts.setupReadOnly")}
      compact
      icon={null}
      className="items-start rounded-xl border border-border bg-muted/20 px-4 py-6 text-start"
    />
  );
}

export interface ContactsSettingsPanelProps {
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
  const [fieldsDirty, setFieldsDirty] = useState(false);
  const [prefsDirty, setPrefsDirty] = useState(false);
  const [pendingSubTab, setPendingSubTab] = useState<string | null>(null);

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

  const [sub, setSub] = useState<string>(() => {
    if (shouldOpenContactsSyncSetup()) return "sync";
    return settingsSubTabs[0]?.key || "preferences";
  });

  const discardConfirmOpen = pendingSubTab != null;
  const discardConfirmIsFields = sub === "fields" && fieldsDirty;

  const handleSubTabChange = (next: string): void => {
    if (next === sub) return;
    if ((sub === "fields" && fieldsDirty) || (sub === "preferences" && prefsDirty)) {
      setPendingSubTab(next);
      return;
    }
    setSub(next);
  };

  const handleConfirmDiscard = (): void => {
    if (!pendingSubTab) return;
    if (sub === "fields") setFieldsDirty(false);
    if (sub === "preferences") setPrefsDirty(false);
    setSub(pendingSubTab);
    setPendingSubTab(null);
  };

  return (
    <div className="space-y-4">
      <SubTabBar
        tabs={settingsSubTabs.map((tab) => ({ key: tab.key, label: tab.label }))}
        value={sub}
        onChange={handleSubTabChange}
      />
      <Suspense fallback={<LazyFallback />}>
        {sub === "fields" &&
          (!formTabsReady ? (
            <LazyFallback />
          ) : canEditSetup ? (
            <ContactsSetupPanel
              config={fieldConfig}
              onConfigChange={updateConfig}
              onConfigChangeAsync={updateConfigAsync}
              mode="fields"
              onFieldsDirtyChange={setFieldsDirty}
            />
          ) : (
            <SetupReadOnlyMessage />
          ))}
        {sub === "preferences" &&
          (canEditSetup ? (
            <ContactsSetupPanel
              config={fieldConfig}
              onConfigChange={updateConfig}
              onConfigChangeAsync={updateConfigAsync}
              mode="preferences"
              onPrefsDirtyChange={setPrefsDirty}
            />
          ) : (
            <SetupReadOnlyMessage />
          ))}
        {sub === "sync" && (
          // Sync mutates contacts + OAuth secrets — gate on contacts.write (canWrite),
          // never OR with canEditSetup (mms-auth-security). Fields/Prefs stay canEditSetup.
          <ContactSyncPanel onImport={onImport} canWrite={canWrite} />
        )}
      </Suspense>

      <ConfirmAlertDialog
        open={discardConfirmOpen}
        onOpenChange={(open) => {
          if (!open) setPendingSubTab(null);
        }}
        title={t("settings.unsavedChanges")}
        description={
          discardConfirmIsFields
            ? t("contacts.setup.discardUnsavedFieldsConfirm")
            : t("contacts.setup.discardUnsavedPreferencesConfirm")
        }
        confirmLabel={t("common.yes")}
        cancelLabel={t("common.cancel")}
        destructive
        onConfirm={handleConfirmDiscard}
      />
    </div>
  );
}
