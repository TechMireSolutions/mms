import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactById } from "@/tenant/hooks/collections/contacts";
import { useTeacherLinkedContactIds, useTeacherNextEmployeeId } from "@/tenant/features/teachers/hooks/useTeachers";
import { useTeacherConfig } from "@/hooks/useStandardModuleConfig";
import { notify } from "@/lib/notify";
import {
  Teacher,
  TEACHER_STATUS_VALUES,
  TEACHER_SPECIALIZATION_VALUES,
  AppTranslationKey,
  teacherCoreSchema,
  todayISO,
  toTitleCase,
} from "@mms/shared";
import type { TeacherStatusOption } from "@/tenant/features/teachers/components/TeacherFormSections";

export interface UseTeacherFormControllerOptions {
  teacher?: Teacher;
  onClose: () => void;
  onSave: (teacher: Teacher) => void | Promise<void>;
}

function teacherFormSnapshot(
  draft: Partial<Teacher>,
  customValues: Record<string, string>,
): string {
  return JSON.stringify({
    contactId: draft.contactId ?? "",
    employeeId: draft.employeeId ?? "",
    specialization: draft.specialization ?? "",
    status: draft.status ?? "",
    joinDate: draft.joinDate ?? "",
    qualification: draft.qualification ?? "",
    notes: draft.notes ?? "",
    customValues,
  });
}

function buildInitialTeacherDraft(
  teacher: Teacher | undefined,
  defaultSpecialization: string,
): Partial<Teacher> {
  return {
    contactId: teacher?.contactId ?? "",
    employeeId: teacher?.employeeId ?? "",
    specialization: teacher?.specialization ?? defaultSpecialization,
    status: teacher?.status ?? "active",
    joinDate: teacher?.joinDate ?? todayISO(),
    qualification: teacher?.qualification ?? "",
    notes: teacher?.notes ?? "",
  };
}

function buildInitialCustomValues(
  teacher: Teacher | undefined,
  customFields: { id: string }[],
): Record<string, string> {
  const initial: Record<string, string> = {};
  for (const field of customFields) {
    const raw = teacher ? (teacher as unknown as Record<string, unknown>)[field.id] : undefined;
    initial[field.id] = raw == null ? "" : String(raw);
  }
  return initial;
}

export function useTeacherFormController({ teacher, onClose, onSave }: UseTeacherFormControllerOptions) {
  const { t } = useTranslation();
  const { settings, specializations, statuses } = useTeacherConfig();

  const specializationOptions = specializations.length > 0
    ? specializations
    : [...TEACHER_SPECIALIZATION_VALUES];
  const statusValues = statuses.length > 0 ? statuses : [...TEACHER_STATUS_VALUES];
  const defaultSpecialization = settings.defaultSpecialization || specializationOptions[0] || "General";
  const idPrefix = settings.idPrefix || "TCH";
  const autoGenerateId = settings.autoGenerateId !== false;
  const requireContactLink = settings.requireContactLink !== false;
  const customFields = useMemo(() => settings.customFields ?? [], [settings.customFields]);
  const statusOptions = useMemo<TeacherStatusOption[]>(
    () =>
      statusValues.map((status) => {
        const translationKey = `teachers.status.${status}` as AppTranslationKey;
        const translated = t(translationKey);
        const label = translated === translationKey ? toTitleCase(status) : translated;
        return { value: status, label };
      }),
    [statusValues, t],
  );

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customValues, setCustomValues] = useState<Record<string, string>>(() =>
    buildInitialCustomValues(teacher, customFields),
  );

  const [teacherDraft, setTeacherDraft] = useState<Partial<Teacher>>(() =>
    buildInitialTeacherDraft(teacher, defaultSpecialization),
  );
  const [baselineSnapshot, setBaselineSnapshot] = useState(() =>
    teacherFormSnapshot(
      buildInitialTeacherDraft(teacher, defaultSpecialization),
      buildInitialCustomValues(teacher, customFields),
    ),
  );

  useEffect(() => {
    const nextDraft = buildInitialTeacherDraft(teacher, defaultSpecialization);
    const nextCustom = buildInitialCustomValues(teacher, customFields);
    setTeacherDraft(nextDraft);
    setCustomValues(nextCustom);
    setBaselineSnapshot(teacherFormSnapshot(nextDraft, nextCustom));
    setErrors({});
  }, [teacher, defaultSpecialization, customFields]);

  const updateDraft = (patch: Partial<Teacher>) => {
    setTeacherDraft((prev) => ({ ...prev, ...patch }));
  };

  const updateCustomValue = (fieldId: string, value: string) => {
    setCustomValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const isDirty = teacherFormSnapshot(teacherDraft, customValues) !== baselineSnapshot;

  const { data: linkedContact } = useContactById(
    teacherDraft.contactId ? String(teacherDraft.contactId) : undefined,
    !!teacherDraft.contactId,
  );

  const { data: linkedTeacherContactIds = [] } = useTeacherLinkedContactIds(
    teacher?.id ? String(teacher.id) : undefined,
  );

  const { data: nextEmployeeId } = useTeacherNextEmployeeId({
    prefix: idPrefix,
    enabled: !teacher?.id && autoGenerateId,
  });

  useEffect(() => {
    if (teacher?.id || !autoGenerateId || !nextEmployeeId) return;
    if (!teacherDraft.employeeId) {
      updateDraft({ employeeId: nextEmployeeId });
    }
  }, [nextEmployeeId, teacher?.id, teacherDraft.employeeId, autoGenerateId]);

  const handleSave = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (requireContactLink && !teacherDraft.contactId) {
      newErrors.contactId = t("teachers.errorContactRequired");
    }
    const resolvedEmployeeId = teacherDraft.employeeId?.trim()
      || (autoGenerateId && !teacher?.id ? nextEmployeeId?.trim() : undefined);
    if (!resolvedEmployeeId) {
      newErrors.employeeId = t("teachers.errorEmployeeIdRequired");
    }
    for (const field of customFields) {
      if (field.required && !customValues[field.id]?.trim()) {
        newErrors[`custom:${field.id}`] = t("common.formPleaseFixErrors");
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notify.error(t("common.formPleaseFixErrors"));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...teacherDraft,
        ...customValues,
        employeeId: resolvedEmployeeId,
        contactId: String(teacherDraft.contactId || ""),
        ...(teacher?.id != null ? { id: teacher.id } : {}),
      } as Teacher;
      const parsed = teacherCoreSchema.safeParse(payload);
      if (!parsed.success) {
        setErrors({ schema: t("common.formPleaseFixErrors") });
        notify.error(t("common.formPleaseFixErrors"));
        return;
      }
      await onSave(parsed.data as Teacher);
      onClose();
    } catch (err: unknown) {
      notify.error(t("teachers.toast.saveFailed"), {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    t,
    saving,
    errors,
    customValues,
    teacherDraft,
    isDirty,
    defaultSpecialization,
    specializationOptions,
    statusOptions,
    autoGenerateId,
    requireContactLink,
    customFields,
    linkedContact,
    linkedTeacherContactIds,
    idPrefix,
    nextEmployeeId,
    updateDraft,
    updateCustomValue,
    handleSave,
  };
}
