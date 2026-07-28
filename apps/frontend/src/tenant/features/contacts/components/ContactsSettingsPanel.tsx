import { useMemo, useState, lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Contact, CONTACTS_MODULE_MANIFEST, DEFAULT_SETTINGS_SUB_TABS } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { shouldOpenContactsSyncSetup } from "@/lib/contacts/googleContactsOAuth";
import { resolveRegistryLabel } from "@/lib/contacts/contactI18n";

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

export interface ContactsSettingsPanelProps {
  contacts: Contact[];
  onImport: (list: Contact[]) => void | Promise<void>;
  canWrite: boolean;
  canEditSetup: boolean;
}

export default function ContactsSettingsPanel({
  contacts,
  onImport,
  canWrite,
  canEditSetup,
}: ContactsSettingsPanelProps): JSX.Element {
  const { t } = useTranslation();
  const { fieldConfig, updateConfig, updateConfigAsync } = useContactConfig();

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

  return (
    <div className="space-y-4">
      <SubTabBar
        tabs={settingsSubTabs.map((tab) => ({ key: tab.key, label: tab.label }))}
        value={sub}
        onChange={setSub}
      />
      <Suspense fallback={<LazyFallback />}>
        {!canEditSetup && (sub === "fields" || sub === "preferences") ? (
          <p className="text-sm text-muted-foreground rounded-xl border border-border bg-muted/20 px-4 py-6">
            {t("contacts.setupReadOnly")}
          </p>
        ) : null}
        {sub === "fields" && canEditSetup && (
          <ContactsSetupPanel
            config={fieldConfig}
            onConfigChange={updateConfig}
            onConfigChangeAsync={updateConfigAsync}
            mode="fields"
          />
        )}
        {sub === "preferences" && canEditSetup && (
          <ContactsSetupPanel
            config={fieldConfig}
            onConfigChange={updateConfig}
            onConfigChangeAsync={updateConfigAsync}
            mode="preferences"
          />
        )}
        {sub === "sync" && (
          <ContactSyncPanel contacts={contacts} onImport={onImport} canWrite={canWrite} />
        )}
      </Suspense>
    </div>
  );
}
