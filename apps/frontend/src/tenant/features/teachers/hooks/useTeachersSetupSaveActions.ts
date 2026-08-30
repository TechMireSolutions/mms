import { useCallback, useMemo, useState } from "react";
import {
  TEACHER_MODULE_PREFERENCE_KEYS,
  normalizeTeacherModulePreferences,
  type TeachersSettings,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { safeAudit } from "@/lib/safeAudit";
import { useTeacherPreferencesMutation } from "@/tenant/features/teachers/hooks/useTeacherSetupConfig";
import { useTeacherMutations } from "@/tenant/features/teachers/hooks/useTeachers";

export function useTeachersSetupSaveActions({
  settings,
  settingsDraft,
  setSaved,
}: {
  settings: TeachersSettings;
  settingsDraft: TeachersSettings;
  setSaved: (value: boolean | ((curr: boolean) => boolean)) => void;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const preferencesMutation = useTeacherPreferencesMutation();
  const { logSetupAudit } = useTeacherMutations();

  const isPrefsDirty = useMemo(() => {
    const draft = settingsDraft as unknown as Record<string, unknown>;
    const savedSettings = settings as unknown as Record<string, unknown>;
    return TEACHER_MODULE_PREFERENCE_KEYS.some(
      (key) => JSON.stringify(draft[key]) !== JSON.stringify(savedSettings[key]),
    );
  }, [settings, settingsDraft]);

  const handleSave = useCallback(async (): Promise<void> => {
    if (!isPrefsDirty || saving) return;
    setSaving(true);
    try {
      await preferencesMutation.mutateAsync(
        normalizeTeacherModulePreferences(settingsDraft) as any,
      );
      safeAudit(
        logSetupAudit.mutateAsync({
          area: "preferences",
          summary: t("teachers.setup.auditSummary", { area: "preferences" }),
        }),
        "teachers.setup_audit",
      );
      notify.success(t("teachers.setup.preferencesSaved"));
      setSaved(true);
    } catch {
      notify.error(t("teachers.setup.saveFailed"));
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
