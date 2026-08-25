import { useCallback, useMemo, useState } from "react";
import type { AppTranslationKey } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { safeAudit } from "@/lib/safeAudit";

export interface ModuleSetupSaveActionsOptions<TSettings> {
  settings: TSettings;
  settingsDraft: TSettings;
  setSaved: (value: boolean | ((curr: boolean) => boolean)) => void;

  prefsKeys: readonly string[];
  normalizePrefs: (settingsDraft: TSettings) => unknown;

  preferencesMutation: { mutateAsync: (prefs: unknown) => Promise<unknown> };
  logSetupAudit: {
    mutateAsync: (payload: { area: "preferences"; summary: string }) => Promise<unknown>;
  };

  keys: {
    auditSummary: AppTranslationKey;
    preferencesSaved: AppTranslationKey;
    saveFailed: AppTranslationKey;
    auditChannel: string;
  };
}

/**
 * Shared module Setup save choreography for preferences.
 */
export function useModuleSetupSaveActions<TSettings>({
  settings,
  settingsDraft,
  setSaved,
  prefsKeys,
  normalizePrefs,
  preferencesMutation,
  logSetupAudit,
  keys,
}: ModuleSetupSaveActionsOptions<TSettings>) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  const isPrefsDirty = useMemo(() => {
    const draft = settingsDraft as unknown as Record<string, unknown>;
    const savedSettings = settings as unknown as Record<string, unknown>;
    return prefsKeys.some(
      (key) => JSON.stringify(draft[key]) !== JSON.stringify(savedSettings[key]),
    );
  }, [settings, settingsDraft, prefsKeys]);

  const handleSave = useCallback(async (): Promise<void> => {
    if (!isPrefsDirty || saving) return;
    setSaving(true);
    try {
      await preferencesMutation.mutateAsync(normalizePrefs(settingsDraft));
      safeAudit(
        logSetupAudit.mutateAsync({
          area: "preferences",
          summary: t(keys.auditSummary, { area: "preferences" }),
        }),
        keys.auditChannel,
      );
      notify.success(t(keys.preferencesSaved));
      setSaved(true);
    } catch {
      setSaved(false);
      notify.error(t(keys.saveFailed));
    } finally {
      setSaving(false);
    }
  }, [
    isPrefsDirty,
    saving,
    preferencesMutation,
    settingsDraft,
    logSetupAudit,
    setSaved,
    t,
    normalizePrefs,
    keys,
  ]);

  return {
    saving,
    isPrefsDirty,
    handleSave,
  };
}
