import React, { useState, useEffect } from "react";
import { School, User, Briefcase } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { Input } from "@/components/ui/input";
import { DatePicker } from "../ui/DatePicker";
import ContactPicker from "@/components/contactLink/ContactPicker";
import { Field } from "@/components/ui/FormPrimitives";
import { FORM_INPUT, FORM_SELECT } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactById } from "@/hooks/useContacts";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { useTeacherLinkedContactIds, useTeacherNextEmployeeId } from "@/hooks/useTeachers";
import { notify } from "@/lib/notify";
import {
  Teacher,
  TEACHER_STATUS_VALUES,
  TEACHER_SPECIALIZATION_VALUES,
  AppTranslationKey,
} from "@mms/shared";

export interface TeacherFormProps {
  teacher?: Teacher;
  onClose: () => void;
  onSave: (teacher: Teacher) => void;
}

const TEACHER_TABS = [
  { key: "basic", label: "Basic Info", icon: User },
  { key: "employment", label: "Employment", icon: Briefcase },
] as const;

type TabKey = (typeof TEACHER_TABS)[number]["key"];

export function TeacherForm({
  teacher,
  onClose,
  onSave,
}: TeacherFormProps): React.JSX.Element {
  const { t } = useTranslation();
  const { language } = useGlobalSettings();

  const [tab, setTab] = useState<TabKey>("basic");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [teacherDraft, setTeacherDraft] = useState<Partial<Teacher>>(() => ({
    contactId: teacher?.contactId ?? "",
    employeeId: teacher?.employeeId ?? "",
    specialization: teacher?.specialization ?? "General",
    status: teacher?.status ?? "active",
    joinDate: teacher?.joinDate ?? new Date().toISOString().split("T")[0],
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
      if (newErrors.contactId) setTab("basic");
      else setTab("employment");
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
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="font-semibold text-foreground">{linkedContact.name}</span>
      <div className="flex items-center gap-2 border-s border-border ps-3">
        <span>ID: {teacherDraft.employeeId || "—"}</span>
        <span className="border-s border-border ps-2 capitalize">
          Status: {teacherDraft.status}
        </span>
      </div>
    </div>
  ) : (
    <span className="text-xs text-destructive">Contact is required</span>
  );

  const renderBasic = () => (
    <div className="space-y-4 text-left">
      <section className="rounded-xl border border-border bg-card/40 p-5 space-y-4 shadow-sm">
        <div>
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("teachers.field.contact") || "Contact"}</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">{t("teachers.form.contactHint")}</p>
        </div>
        <ContactPicker
          label={t("teachers.field.contact") || "Contact"}
          value={teacherDraft.contactId ? String(teacherDraft.contactId) : null}
          onChange={(id) => updateDraft({ contactId: id ? String(id) : "" })}
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

      <section className="rounded-xl border border-border bg-card/40 p-5 space-y-4 shadow-sm">
        <Field label={t("teachers.field.specialization") || "Specialization"}>
          <select
            className={FORM_SELECT}
            value={teacherDraft.specialization || "General"}
            onChange={(e) => updateDraft({ specialization: e.target.value })}
          >
            {TEACHER_SPECIALIZATION_VALUES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>

        <Field label="Qualification">
          <Input
            value={teacherDraft.qualification || ""}
            onChange={(e) => updateDraft({ qualification: e.target.value })}
            placeholder="e.g. Master in Islamic Studies"
            className={FORM_INPUT}
          />
        </Field>
      </section>
    </div>
  );

  const renderEmployment = () => (
    <div className="space-y-4 text-left">
      <section className="rounded-xl border border-border bg-card/40 p-5 space-y-4 shadow-sm">
        <Field label={t("teachers.field.employeeId") || "Employee ID"} required error={errors.employeeId}>
          <Input
            value={teacherDraft.employeeId || ""}
            onChange={(e) => updateDraft({ employeeId: e.target.value })}
            placeholder="TCH-0001"
            className={FORM_INPUT}
          />
        </Field>

        <Field label={t("teachers.field.status") || "Status"}>
          <select
            className={FORM_SELECT}
            value={teacherDraft.status || "active"}
            onChange={(e) => updateDraft({ status: e.target.value as any })}
          >
            {TEACHER_STATUS_VALUES.map((s) => {
              const translationKey = `teachers.status.${s}` as AppTranslationKey;
              const translated = t(translationKey);
              const label = translated === translationKey ? s.charAt(0).toUpperCase() + s.slice(1) : translated;
              return (
                <option key={s} value={s}>{label}</option>
              );
            })}
          </select>
        </Field>

        <Field label="Join Date">
          <DatePicker
            value={teacherDraft.joinDate || undefined}
            onChange={(dateStr) => updateDraft({ joinDate: dateStr })}
          />
        </Field>

        <Field label={t("teachers.field.notes") || "Notes"}>
          <textarea
            value={teacherDraft.notes || ""}
            onChange={(e) => updateDraft({ notes: e.target.value })}
            placeholder="Employment notes..."
            className="w-full min-h-[80px] p-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-y"
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
      tall
      tabs={TEACHER_TABS}
      activeTab={tab}
      onTabChange={setTab}
      tabPanelIdPrefix="teacher-form-tab"
      lang={language}
      cancelLabel={t("common.cancel") || "Cancel"}
      saveLabel={t("common.save") || "Save"}
      onSave={handleSave}
      saving={saving}
      saveDisabled={!teacherDraft.contactId}
      footerStart={footerStart}
    >
      {tab === "basic" ? renderBasic() : renderEmployment()}
    </FormModal>
  );
}
