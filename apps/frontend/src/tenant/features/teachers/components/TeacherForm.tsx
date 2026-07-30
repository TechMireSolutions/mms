import React, { useEffect, useMemo, useState } from "react";
import { School } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactById } from "@/tenant/hooks/collections/contacts";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { useTeacherLinkedContactIds, useTeacherNextEmployeeId } from "@/tenant/features/teachers/hooks/useTeachers";
import { useTeacherConfig } from "@/hooks/useStandardModuleConfig";
import { notify } from "@/lib/notify";
import {
  Teacher,
  TEACHER_STATUS_VALUES,
  TEACHER_SPECIALIZATION_VALUES,
  AppTranslationKey,
  todayISO,
  toTitleCase,
} from "@mms/shared";
import {
  TeacherBasicSection,
  TeacherEmploymentSection,
  type TeacherStatusOption,
} from "@/tenant/features/teachers/components/TeacherFormSections";

export interface TeacherFormProps {
  teacher?: Teacher;
  onClose: () => void;
  onSave: (teacher: Teacher) => void | Promise<void>;
}

export function TeacherForm({
  teacher,
  onClose,
  onSave,
}: TeacherFormProps): React.JSX.Element {
  const { t } = useTranslation();
  const { language } = useGlobalSettings();
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
  const [customValues, setCustomValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of customFields) {
      const raw = teacher ? (teacher as unknown as Record<string, unknown>)[field.id] : undefined;
      initial[field.id] = raw == null ? "" : String(raw);
    }
    return initial;
  });

  const [teacherDraft, setTeacherDraft] = useState<Partial<Teacher>>(() => ({
    contactId: teacher?.contactId ?? "",
    employeeId: teacher?.employeeId ?? "",
    specialization: teacher?.specialization ?? defaultSpecialization,
    status: teacher?.status ?? "active",
    joinDate: teacher?.joinDate ?? todayISO(),
    qualification: teacher?.qualification ?? "",
    notes: teacher?.notes ?? "",
  }));

  useEffect(() => {
    setTeacherDraft({
      contactId: teacher?.contactId ?? "",
      employeeId: teacher?.employeeId ?? "",
      specialization: teacher?.specialization ?? defaultSpecialization,
      status: teacher?.status ?? "active",
      joinDate: teacher?.joinDate ?? todayISO(),
      qualification: teacher?.qualification ?? "",
      notes: teacher?.notes ?? "",
    });
    const nextCustom: Record<string, string> = {};
    for (const field of customFields) {
      const raw = teacher ? (teacher as unknown as Record<string, unknown>)[field.id] : undefined;
      nextCustom[field.id] = raw == null ? "" : String(raw);
    }
    setCustomValues(nextCustom);
    setErrors({});
  }, [teacher, defaultSpecialization, customFields]);

  const updateDraft = (patch: Partial<Teacher>) => {
    setTeacherDraft((prev) => ({ ...prev, ...patch }));
  };

  const updateCustomValue = (fieldId: string, value: string) => {
    setCustomValues((prev) => ({ ...prev, [fieldId]: value }));
  };

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
        newErrors[`custom:${field.id}`] = t("contacts.form.pleaseFixErrors");
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notify.error(t("contacts.form.pleaseFixErrors"));
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
      await onSave(payload);
      onClose();
    } catch (err: unknown) {
      notify.error(t("teachers.toast.saveFailed"), {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  };

  const footerStart = linkedContact?.name ? (
    <div className="flex flex-wrap items-center gap-2.5 text-xs">
      <span className="font-bold text-foreground bg-muted/65 px-2.5 py-1 rounded-lg border border-border/60">
        {linkedContact.name}
      </span>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold border border-primary/20 text-xs">
          {t("teachers.form.employeeIdBadge", { id: teacherDraft.employeeId || t("common.notSpecified") })}
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold border text-xs capitalize ${
          teacherDraft.status === "active"
            ? "bg-success/10 text-success border-success/20"
            : "bg-muted text-muted-foreground border-border"
        }`}>
          {(() => {
            const status = teacherDraft.status || "active";
            const translationKey = `teachers.status.${status}` as AppTranslationKey;
            const translated = t(translationKey);
            return translated === translationKey ? toTitleCase(status) : translated;
          })()}
        </span>
      </div>
    </div>
  ) : requireContactLink ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-bold border border-destructive/20">
      {t("teachers.form.contactRequired")}
    </span>
  ) : null;

  return (
    <FormModal
      open
      onClose={onClose}
      title={teacher ? t("teachers.form.editTitle") : t("teachers.form.addTitle")}
      subtitle={t("teachers.form.contactHint")}
      icon={School}
      lang={language}
      cancelLabel={t("common.cancel")}
      saveLabel={t("common.save")}
      onSave={() => { void handleSave(); }}
      saving={saving}
      saveDisabled={requireContactLink && !teacherDraft.contactId}
      footerStart={footerStart}
    >
      <div className="space-y-4">
        <TeacherBasicSection
          teacherDraft={teacherDraft}
          errors={errors}
          defaultSpecialization={defaultSpecialization}
          linkedTeacherContactIds={linkedTeacherContactIds}
          specializationOptions={specializationOptions}
          onDraftChange={updateDraft}
        />
        <TeacherEmploymentSection
          teacher={teacher}
          teacherDraft={teacherDraft}
          errors={errors}
          autoGenerateId={autoGenerateId}
          customFields={customFields}
          customValues={customValues}
          idPrefix={idPrefix}
          nextEmployeeId={nextEmployeeId}
          statusOptions={statusOptions}
          onCustomValueChange={updateCustomValue}
          onDraftChange={updateDraft}
        />
      </div>
    </FormModal>
  );
}
