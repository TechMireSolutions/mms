import React, { useState, useEffect } from "react";
import { School, User, Briefcase, Hash, GraduationCap } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/DatePicker";
import ContactPicker from "@/tenant/features/contacts/components/contactLink/ContactPicker";
import { Field } from "@/components/ui/FormPrimitives";
import { FORM_INPUT } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactById } from "@/tenant/features/contacts/hooks/useContacts";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { useTeacherLinkedContactIds, useTeacherNextEmployeeId } from "@/tenant/features/teachers/hooks/useTeachers";
import { notify } from "@/lib/notify";
import {
  Teacher,
  TEACHER_STATUS_VALUES,
  TEACHER_SPECIALIZATION_VALUES,
  AppTranslationKey,
  todayISO,
} from "@mms/shared";

export interface TeacherFormProps {
  teacher?: Teacher;
  onClose: () => void;
  onSave: (teacher: Teacher) => void;
}

export function TeacherForm({
  teacher,
  onClose,
  onSave,
}: TeacherFormProps): React.JSX.Element {
  const { t } = useTranslation();
  const { language } = useGlobalSettings();

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [teacherDraft, setTeacherDraft] = useState<Partial<Teacher>>(() => ({
    contactId: teacher?.contactId ?? "",
    employeeId: teacher?.employeeId ?? "",
    specialization: teacher?.specialization ?? "General",
    status: teacher?.status ?? "active",
    joinDate: teacher?.joinDate ?? todayISO(),
    qualification: teacher?.qualification ?? "",
    notes: teacher?.notes ?? "",
  }));

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
    prefix: "TCH-",
    enabled: !teacher?.id,
  });

  useEffect(() => {
    if (teacher?.id || !nextEmployeeId) return;
    if (!teacherDraft.employeeId) {
      updateDraft({ employeeId: nextEmployeeId });
    }
  }, [nextEmployeeId, teacher?.id, teacherDraft.employeeId]);

  const handleSave = () => {
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (!teacherDraft.contactId) {
      newErrors.contactId = t("teachers.errorContactRequired") || "Contact is required";
    }
    if (!teacherDraft.employeeId?.trim()) {
      newErrors.employeeId = "Employee ID is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notify.error(t("contacts.form.pleaseFixErrors") || "Please fix validation errors");
      return;
    }

    setSaving(true);
    try {
      onSave({
        ...teacherDraft,
        id: teacher?.id ?? `tch${Date.now()}`,
        contactId: String(teacherDraft.contactId),
      } as Teacher);
      notify.success(teacher ? "Teacher updated successfully" : "Teacher created successfully");
      onClose();
    } catch (err: any) {
      notify.error(t("settings.serverSaveFailed") || "Failed to save", { description: err.message });
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
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold border border-primary/20 text-[10px]">
          ID: {teacherDraft.employeeId || "—"}
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold border text-[10px] capitalize ${
          teacherDraft.status === 'active' 
            ? 'bg-success/10 text-success border-success/20' 
            : 'bg-muted text-muted-foreground border-border'
        }`}>
          {teacherDraft.status}
        </span>
      </div>
    </div>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-[11px] font-bold border border-destructive/20">
      Contact is required
    </span>
  );

  const renderBasic = () => (
    <div className="space-y-4 text-left">
      <section className="relative z-20 overflow-hidden group rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5.5 px-6.5 pb-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/60 transition-colors group-hover:bg-primary" />
        <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40">
          <User className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("teachers.field.contact") || "Contact"}</h3>
        </div>
        <ContactPicker
          label={t("teachers.field.contact") || "Contact"}
          value={teacherDraft.contactId ? String(teacherDraft.contactId) : null}
          onChange={(contactId) => updateDraft({ contactId: contactId ? String(contactId) : "" })}
          excludeIds={linkedTeacherContactIds.map(String)}
          searchPlaceholder={t("teachers.form.searchContact")}
          emptyTitle={t("teachers.form.noContacts")}
          emptyHint={t("teachers.form.noContactsHint")}
          error={!!errors.contactId}
        />
        {errors.contactId && (
          <p className="text-[10px] text-destructive mt-1 font-medium">{errors.contactId}</p>
        )}
      </section>

      <section className="relative z-10 overflow-hidden group rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5.5 px-6.5 pb-6 space-y-4.5 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/60 transition-colors group-hover:bg-primary" />
        <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40">
          <School className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Details</h3>
        </div>
        <Field label={t("teachers.field.specialization") || "Specialization"}>
          <FormSelect
            value={teacherDraft.specialization || "General"}
            onChange={(val) => updateDraft({ specialization: val })}
            options={TEACHER_SPECIALIZATION_VALUES}
          />
        </Field>

        <Field label="Qualification">
          <div className="relative flex items-center group/input">
            <GraduationCap className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
            <Input
              value={teacherDraft.qualification || ""}
              onChange={(event) => updateDraft({ qualification: event.target.value })}
              placeholder="e.g. Master in Islamic Studies"
              className={`${FORM_INPUT} pl-10`}
            />
          </div>
        </Field>
      </section>
    </div>
  );

  const renderEmployment = () => (
    <div className="space-y-4 text-left">
      <section className="relative overflow-hidden group rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5.5 px-6.5 pb-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500/60 transition-colors group-hover:bg-indigo-500" />
        <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40">
          <Briefcase className="w-4 h-4 text-indigo-500/70 group-hover:text-indigo-500 transition-colors" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Employment Details</h3>
        </div>
        <Field label={t("teachers.field.employeeId") || "Employee ID"} required error={errors.employeeId}>
          <div className="relative flex items-center group/input">
            <Hash className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
            <Input
              value={teacherDraft.employeeId || ""}
              onChange={(event) => updateDraft({ employeeId: event.target.value })}
              placeholder="TCH-0001"
              className={`${FORM_INPUT} pl-10`}
            />
          </div>
        </Field>

        <Field label={t("teachers.field.status") || "Status"}>
          <FormSelect
            value={teacherDraft.status || "active"}
            onChange={(val) => updateDraft({ status: val as Teacher["status"] })}
            options={TEACHER_STATUS_VALUES.map((status) => {
              const translationKey = `teachers.status.${status}` as AppTranslationKey;
              const translated = t(translationKey);
              const label = translated === translationKey ? status.charAt(0).toUpperCase() + status.slice(1) : translated;
              return { value: status, label };
            })}
          />
        </Field>

        <Field label="Join Date">
          <DatePicker
            value={teacherDraft.joinDate || undefined}
            onChange={(dateStr) => updateDraft({ joinDate: dateStr })}
          />
        </Field>

        <Field label={t("teachers.field.notes") || "Notes"}>
          <Textarea
            value={teacherDraft.notes || ""}
            onChange={(event) => updateDraft({ notes: event.target.value })}
            placeholder="Employment notes..."
            className="min-h-[80px]"
          />
        </Field>
      </section>
    </div>
  );

  return (
    <FormModal
      open
      onClose={onClose}
      title={teacher ? (t("teachers.form.editTitle") || "Edit Teacher") : (t("teachers.form.addTitle") || "Add Teacher")}
      subtitle={t("teachers.form.contactHint")}
      icon={School}
      lang={language}
      cancelLabel={t("common.cancel") || "Cancel"}
      saveLabel={t("common.save") || "Save"}
      onSave={handleSave}
      saving={saving}
      saveDisabled={!teacherDraft.contactId}
      footerStart={footerStart}
    >
      <div className="space-y-4">
        {renderBasic()}
        {renderEmployment()}
      </div>
    </FormModal>
  );
}
