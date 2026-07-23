import React, { useMemo, useState, lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Contact, CONTACTS_MODULE_CONTRACT, type AppTranslationKey } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { shouldOpenContactsSyncSetup } from "@/lib/contacts/googleContactsOAuth";

const ContactsSetupPanel = lazy(() => import("@/tenant/features/contacts/components/ContactsSetupPanel"));
const ContactSyncPanel = lazy(() => import("@/tenant/features/contacts/components/ContactSyncPanel"));

function LazyFallback(): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground shrink-0" aria-hidden="true" />
      <span className="sr-only">{t("common.loading")}</span>
    </div>
  );
}

const SETUP_TAB_LABEL_KEYS: Record<string, AppTranslationKey> = {
  fields: "contacts.setup.fields",
  preferences: "contacts.setup.preferences",
  sync: "contacts.setup.sync",
};

export interface ContactsSettingsPanelProps {
  contacts: Contact[];
  onImport: (list: Contact[]) => void;
  canWrite: boolean;
  canEditSetup: boolean;
}

export default function ContactsSettingsPanel({
  contacts,
  onImport,
  canWrite,
  canEditSetup,
}: ContactsSettingsPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const { fieldConfig, updateConfig } = useContactConfig();

  const settingsSubTabs = useMemo(() => {
    const tabsFromConfig = fieldConfig.settingsSubTabs || [];
    return CONTACTS_MODULE_CONTRACT.setupSubTabs
      .map((key, index) => {
        const setupTabConfig = tabsFromConfig.find((tab) => tab.key === key);
        return {
          key,
          label: SETUP_TAB_LABEL_KEYS[key] ? t(SETUP_TAB_LABEL_KEYS[key]) : setupTabConfig?.label ?? key,
          order: setupTabConfig?.order ?? index,
          enabled: setupTabConfig?.enabled ?? true,
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
        {sub === "fields" && !canEditSetup ? (
          <p className="text-sm text-muted-foreground rounded-xl border border-border bg-muted/20 px-4 py-6">
            {t("contacts.setupReadOnly")}
          </p>
        ) : null}
        {sub === "fields" && canEditSetup && (
          <ContactsSetupPanel config={fieldConfig} onConfigChange={updateConfig} mode="fields" />
        )}
        {sub === "preferences" && !canEditSetup ? (
          <p className="text-sm text-muted-foreground rounded-xl border border-border bg-muted/20 px-4 py-6">
            {t("contacts.setupReadOnly")}
          </p>
        ) : null}
        {sub === "preferences" && canEditSetup && (
          <ContactsSetupPanel config={fieldConfig} onConfigChange={updateConfig} mode="preferences" />
        )}
        {sub === "sync" && (
          <ContactSyncPanel contacts={contacts} onImport={onImport} canWrite={canWrite} />
        )}
      </Suspense>
    </div>
  );
}
