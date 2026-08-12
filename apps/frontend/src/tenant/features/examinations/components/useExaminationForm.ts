import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import { useModuleTabs } from "@/hooks/useDynamicFormConfig";
import { notify } from "@/lib/notify";
import { Exam } from '@/lib/data/examinationData';
import { toTitleCase, validateDfsCustomFields, applyDfsCustomFieldDefaults } from "@mms/shared";
import { EXAMINATION_FORM_EMPTY } from "./examinationFormConstants";

interface UseExaminationFormOptions {
  open: boolean;
  exam: Exam | null;
  onClose: () => void;
  onSave: (exam: Exam) => void | Promise<void>;
}

export function useExaminationForm({ open, exam, onClose, onSave }: UseExaminationFormOptions) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const sessions = useSessionsCollection();
  const { data: dfsTabs } = useModuleTabs("examinations");

  const [examDraft, setExamDraft] = useState<Omit<Exam, "id">>(() => {
    const base = exam ? { ...exam } : { ...EXAMINATION_FORM_EMPTY };
    return applyDfsCustomFieldDefaults(base, dfsTabs) as Omit<Exam, "id">;
  });

  useEffect(() => {
    if (!open) return;
    const base = exam ? { ...exam } : { ...EXAMINATION_FORM_EMPTY };
    setExamDraft(applyDfsCustomFieldDefaults(base, dfsTabs) as Omit<Exam, "id">);
    setErrors({});
  }, [open, exam, dfsTabs]);

  const updateDraft = (patch: Partial<typeof examDraft>) => {
    setExamDraft((prev) => ({ ...prev, ...patch }));
  };

  const classes = useMemo(
    () => sessions.flatMap((session) =>
      (session.classes || []).map((sessionClass) => ({
        id: sessionClass.id,
        name: `${session.name} - ${sessionClass.name}`,
      })),
    ),
    [sessions],
  );

  const handleSave = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (!examDraft.name?.trim()) {
      newErrors.name = t("examinations.form.validation.nameRequired");
    }
    if (!examDraft.date) {
      newErrors.date = t("examinations.form.validation.dateRequired");
    }
    if (!examDraft.classIds || examDraft.classIds.length === 0) {
      newErrors.classIds = t("examinations.form.validation.classRequired");
    }
    if (Number(examDraft.passingMarks) > Number(examDraft.totalMarks)) {
      newErrors.passingMarks = t("examinations.form.validation.passingExceedsTotal");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notify.error(t("examinations.form.toast.validationError"));
      return;
    }

    // DFS Dynamic Zod schema validation for active custom fields
    const customData = (examDraft.customData as Record<string, unknown> | undefined) ?? {};
    const dfsErrors = validateDfsCustomFields(dfsTabs, customData, examDraft as Record<string, unknown>);
    if (dfsErrors.length > 0) {
      const errorMap: Record<string, string> = {};
      for (const err of dfsErrors) {
        if (!errorMap[err.fieldId]) errorMap[err.fieldId] = err.message;
      }
      setErrors({ ...newErrors, ...errorMap });
      notify.error(t("examinations.form.toast.validationError"));
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...examDraft,
        name: toTitleCase(examDraft.name || ""),
        id: exam?.id || `ex${crypto.randomUUID()}`
      } as unknown as Exam);
      notify.success(exam ? t("examinations.form.toast.updated") : t("examinations.form.toast.created"));
      onClose();
    } catch (err: unknown) {
      notify.error(t("examinations.form.toast.saveFailed"), { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setSaving(false);
    }
  };

  const valid = !!(examDraft.name && examDraft.date && examDraft.classIds && examDraft.classIds.length > 0);

  const getFieldError = (fieldId: string): string | undefined => errors[fieldId];

  return {
    t,
    exam,
    saving,
    errors,
    examDraft,
    classes,
    updateDraft,
    handleSave,
    valid,
    dfsTabs,
    getFieldError,
  };
}
