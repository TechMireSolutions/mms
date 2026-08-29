import { useCallback, useMemo, useState } from "react";
import { type ExaminationsSettings } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";

const PREF_KEYS = [
  "passMark",
  "maxMark",
  "gradingSystem",
  "showRankings",
  "allowRetake",
  "autoPublishResults",
  "notifyOnResult",
  "certificateTemplate",
  "aiGrading",
  "distinguishHonours",
  "examReminders",
  "defaultViewLayout",
] as const;

/** Examinations Setup save + dirty detection (§7 await / dirty). */
export function useExaminationsSetupSaveActions({
  settings,
  settingsDraft,
  setSaved,
  saveSettingsAsync,
}: {
  settings: ExaminationsSettings;
  settingsDraft: ExaminationsSettings;
  setSaved: (value: boolean | ((curr: boolean) => boolean)) => void;
  saveSettingsAsync: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  const isPrefsDirty = useMemo(() => {
    const draft = settingsDraft as unknown as Record<string, unknown>;
    const savedSettings = settings as unknown as Record<string, unknown>;
    return PREF_KEYS.some(
      (key) => JSON.stringify(draft[key]) !== JSON.stringify(savedSettings[key]),
    );
  }, [settings, settingsDraft]);

  const handleSave = useCallback(async (): Promise<void> => {
    if (!isPrefsDirty || saving) return;
    setSaving(true);
    try {
      await saveSettingsAsync();
      notify.success(t("examinations.settings.saved"));
      setSaved(true);
    } catch (error) {
      notify.error(t("examinations.settings.saveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setSaving(false);
    }
  }, [isPrefsDirty, saving, saveSettingsAsync, setSaved, t]);

  return {
    saving,
    isPrefsDirty,
    handleSave,
  };
}
