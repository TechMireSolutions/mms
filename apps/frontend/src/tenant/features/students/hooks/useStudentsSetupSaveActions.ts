import { useCallback, useMemo, useState } from "react";
import {
  STUDENT_MODULE_PREFERENCE_KEYS,
  normalizeStudentModulePreferences,
  type StudentsSettings,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { safeAudit } from "@/lib/safeAudit";
import { useStudentPreferencesMutation } from "@/tenant/features/students/hooks/useStudentSetupConfig";
import { useStudentMutations } from "@/tenant/features/students/hooks/useStudentMutations";

export function useStudentsSetupSaveActions({
  settings,
  settingsDraft,
  setSaved,
}: {
  settings: StudentsSettings;
  settingsDraft: StudentsSettings;
  setSaved: (value: boolean | ((curr: boolean) => boolean)) => void;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const preferencesMutation = useStudentPreferencesMutation();
  const { logSetupAudit } = useStudentMutations();

  const isPrefsDirty = useMemo(() => {
    const draft = settingsDraft as unknown as Record<string, unknown>;
    const savedSettings = settings as unknown as Record<string, unknown>;
    return STUDENT_MODULE_PREFERENCE_KEYS.some(
      (key) => JSON.stringify(draft[key]) !== JSON.stringify(savedSettings[key]),
    );
  }, [settings, settingsDraft]);

  const handleSave = useCallback(async (): Promise<void> => {
    if (!isPrefsDirty || saving) return;
    setSaving(true);
    try {
      await preferencesMutation.mutateAsync(
        normalizeStudentModulePreferences(settingsDraft) as any,
      );
      safeAudit(
        logSetupAudit.mutateAsync({
          area: "preferences",
          summary: t("students.setup.auditSummary", { area: "preferences" }),
        }),
        "students.setup_audit",
      );
      notify.success(t("students.setup.preferencesSaved"));
      setSaved(true);
    } catch {
      notify.error(t("students.setup.saveFailed"));
    } finally {
      setSaving(false);
    }
  }, [isPrefsDirty, saving, preferencesMutation, settingsDraft, logSetupAudit, t, setSaved]);

  return {
    saving,
    isPrefsDirty,
    handleSave,
  };
}
