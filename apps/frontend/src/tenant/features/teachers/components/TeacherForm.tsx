import React, { useEffect, useMemo, useState } from "react";
import { School, User, Briefcase, Hash, GraduationCap } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/DatePicker";
import ContactPicker from "@/components/contactLink/ContactPicker";
import { Field } from "@/components/ui/FormPrimitives";
import { FORM_INPUT } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
  const statusOptions = statuses.length > 0 ? statuses : [...TEACHER_STATUS_VALUES];
  const defaultSpecialization = settings.defaultSpecialization || specializationOptions[0] || "General";
  const idPrefix = settings.idPrefix || "TCH";
  const autoGenerateId = settings.autoGenerateId !== false;
  const requireContactLink = settings.requireContactLink !== false;
  const customFields = useMemo(() => settings.customFields ?? [], [settings.customFields]);

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

  const renderBasic = () => (
    <div className="space-y-4 text-start">
      <Card accentColor="primary" className="p-5.5 px-6.5 pb-6 space-y-4 shadow-sm z-20">
        <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40">
          <User className="w-4 h-4 text-primary/70 transition-colors" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("teachers.field.contact")}</h3>
        </div>
        <ContactPicker
          label={t("teachers.field.contact")}
          value={teacherDraft.contactId ? String(teacherDraft.contactId) : null}
          onChange={(contactId) => updateDraft({ contactId: contactId ? String(contactId) : "" })}
          excludeIds={linkedTeacherContactIds.map(String)}
          searchPlaceholder={t("teachers.form.searchContact")}
          emptyTitle={t("teachers.form.noContacts")}
          emptyHint={t("teachers.form.noContactsHint")}
          error={!!errors.contactId}
        />
        {errors.contactId && (
          <p className="text-xs text-destructive mt-1 font-medium">{errors.contactId}</p>
        )}
      </Card>

      <Card accentColor="primary" className="p-5.5 px-6.5 pb-6 space-y-4.5 shadow-sm z-10">
        <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40">
          <School className="w-4 h-4 text-primary/70 transition-colors" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("teachers.form.sectionDetails")}</h3>
        </div>
        <Field label={t("teachers.field.specialization")}>
          <FormSelect
            value={teacherDraft.specialization || defaultSpecialization}
            onChange={(val) => updateDraft({ specialization: val })}
            options={specializationOptions}
          />
        </Field>

        <Field label={t("teachers.field.qualification")}>
          <div className="relative flex items-center group/input">
            <GraduationCap className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
            <Input
              value={teacherDraft.qualification || ""}
              onChange={(event) => updateDraft({ qualification: event.target.value })}
              placeholder={t("teachers.form.qualificationPlaceholder")}
              className={`${FORM_INPUT} ps-10`}
            />
          </div>
        </Field>
      </Card>
    </div>
  );

  const renderEmployment = () => (
    <div className="space-y-4 text-start">
      <Card accentColor="primary" className="p-5.5 px-6.5 pb-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40">
          <Briefcase className="w-4 h-4 text-primary/70 transition-colors" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("teachers.form.sectionEmployment")}</h3>
        </div>
        <Field label={t("teachers.field.employeeId")} required error={errors.employeeId}>
          <div className="relative flex items-center group/input">
            <Hash className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
            <Input
              value={teacherDraft.employeeId || ""}
              onChange={(event) => updateDraft({ employeeId: event.target.value })}
              placeholder={t("teachers.form.employeeIdPlaceholder", { prefix: idPrefix })}
              className={`${FORM_INPUT} ps-10`}
              disabled={autoGenerateId && !teacher?.id && Boolean(nextEmployeeId)}
            />
          </div>
        </Field>

        <Field label={t("teachers.field.status")}>
          <FormSelect
            value={teacherDraft.status || "active"}
            onChange={(val) => updateDraft({ status: val as Teacher["status"] })}
            options={statusOptions.map((status) => {
              const translationKey = `teachers.status.${status}` as AppTranslationKey;
              const translated = t(translationKey);
              const label = translated === translationKey ? toTitleCase(status) : translated;
              return { value: status, label };
            })}
          />
        </Field>

        <Field label={t("teachers.field.joinDate")}>
          <DatePicker
            value={teacherDraft.joinDate || undefined}
            onChange={(dateStr) => updateDraft({ joinDate: dateStr })}
          />
        </Field>

        <Field label={t("teachers.field.notes")}>
          <Textarea
            value={teacherDraft.notes || ""}
            onChange={(event) => updateDraft({ notes: event.target.value })}
            placeholder={t("teachers.form.notesPlaceholder")}
            className="min-h-[80px]"
          />
        </Field>
      </Card>

      {customFields.length > 0 && (
        <Card accentColor="primary" className="p-5.5 px-6.5 pb-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40">
            <School className="w-4 h-4 text-primary/70 transition-colors" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("teachers.form.sectionCustom")}</h3>
          </div>
          {customFields.map((field) => (
            <Field
              key={field.id}
              label={field.label || field.id}
              required={field.required}
              error={errors[`custom:${field.id}`]}
            >
              {field.type === "select" && field.options && field.options.length > 0 ? (
                <FormSelect
                  value={customValues[field.id] || ""}
                  onChange={(val) => setCustomValues((prev) => ({ ...prev, [field.id]: val }))}
                  options={field.options}
                />
              ) : (
                <Input
                  value={customValues[field.id] || ""}
                  onChange={(event) => setCustomValues((prev) => ({ ...prev, [field.id]: event.target.value }))}
                  className={FORM_INPUT}
                />
              )}
            </Field>
          ))}
        </Card>
      )}
    </div>
  );

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
        {renderBasic()}
        {renderEmployment()}
      </div>
    </FormModal>
  );
}
