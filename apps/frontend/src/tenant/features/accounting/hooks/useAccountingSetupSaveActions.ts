import { useState } from "react";
import { type AccountingSettings } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";

const PREF_KEYS = [
  "currency",
  "currencySymbol",
  "dateFormat",
  "decimalSeparator",
  "decimalPlaces",
  "fyStartMonth",
  "accountCodeLength",
  "requireNarration",
  "allowEditPosted",
  "autoPostDrafts",
  "retainedEarningsAccount",
  "organizationName",
  "defaultViewLayout",
] as const;

/** Accounting Setup save + dirty detection (§7 await / dirty). */
export function useAccountingSetupSaveActions({
  settings,
  settingsDraft,
  setSaved,
  saveSettingsAsync,
}: {
  settings: AccountingSettings;
  settingsDraft: AccountingSettings;
  setSaved: (value: boolean | ((curr: boolean) => boolean)) => void;
  saveSettingsAsync: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  const isPrefsDirty = (() => {
    const draft = settingsDraft as unknown as Record<string, unknown>;
    const savedSettings = settings as unknown as Record<string, unknown>;
    return PREF_KEYS.some(
      (key) => JSON.stringify(draft[key]) !== JSON.stringify(savedSettings[key]),
    );
  })();

  const handleSave = (async (): Promise<void> => {
    if (!isPrefsDirty || saving) return;
    setSaving(true);
    try {
      await saveSettingsAsync();
      notify.success(t("accounting.settings.saved"));
      setSaved(true);
    } catch (error) {
      notify.error(t("accounting.settings.saveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setSaving(false);
    }
  });

  return {
    saving,
    isPrefsDirty,
    handleSave,
  };
}
