import type React from "react";
import { Briefcase, GraduationCap, Hash, School, User } from "lucide-react";
import ContactPicker from "@/components/contactLink/ContactPicker";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { Card } from "@/components/ui/card";
import { FORM_INPUT } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/useTranslation";
import type { Teacher, TeacherCustomField } from "@mms/shared";

interface TeacherSectionBaseProps {
  teacherDraft: Partial<Teacher>;
  errors: Record<string, string>;
  onDraftChange: (patch: Partial<Teacher>) => void;
}

export interface TeacherStatusOption {
  value: string;
  label: string;
}

interface TeacherBasicSectionProps extends TeacherSectionBaseProps {
  defaultSpecialization: string;
  linkedTeacherContactIds: Array<string | number>;
  specializationOptions: string[];
}

export function TeacherBasicSection({
  teacherDraft,
  errors,
  defaultSpecialization,
  linkedTeacherContactIds,
  specializationOptions,
  onDraftChange,
}: TeacherBasicSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 text-start">
      <Card accentColor="primary" className="p-5.5 px-6.5 pb-6 space-y-4 shadow-sm z-20">
        <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40">
          <User className="w-4 h-4 text-primary/70 transition-colors" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("teachers.field.contact")}</h3>
        </div>
        <ContactPicker
          label={t("teachers.field.contact")}
          value={teacherDraft.contactId ? String(teacherDraft.contactId) : null}
          onChange={(contactId) => onDraftChange({ contactId: contactId ? String(contactId) : "" })}
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
            onChange={(val) => onDraftChange({ specialization: val })}
            options={specializationOptions}
          />
        </Field>

        <Field label={t("teachers.field.qualification")}>
          <div className="relative flex items-center group/input">
            <GraduationCap className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
            <Input
              value={teacherDraft.qualification || ""}
              onChange={(event) => onDraftChange({ qualification: event.target.value })}
              placeholder={t("teachers.form.qualificationPlaceholder")}
              className={`${FORM_INPUT} ps-10`}
            />
          </div>
        </Field>
      </Card>
    </div>
  );
}

interface TeacherEmploymentSectionProps extends TeacherSectionBaseProps {
  autoGenerateId: boolean;
  customFields: TeacherCustomField[];
  customValues: Record<string, string>;
  idPrefix: string;
  nextEmployeeId?: string;
  statusOptions: TeacherStatusOption[];
  teacher?: Teacher;
  onCustomValueChange: (fieldId: string, value: string) => void;
}

export function TeacherEmploymentSection({
  autoGenerateId,
  customFields,
  customValues,
  errors,
  idPrefix,
  nextEmployeeId,
  statusOptions,
  teacher,
  teacherDraft,
  onCustomValueChange,
  onDraftChange,
}: TeacherEmploymentSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
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
              onChange={(event) => onDraftChange({ employeeId: event.target.value })}
              placeholder={t("teachers.form.employeeIdPlaceholder", { prefix: idPrefix })}
              className={`${FORM_INPUT} ps-10`}
              disabled={autoGenerateId && !teacher?.id && Boolean(nextEmployeeId)}
            />
          </div>
        </Field>

        <Field label={t("teachers.field.status")}>
          <FormSelect
            value={teacherDraft.status || "active"}
            onChange={(val) => onDraftChange({ status: val as Teacher["status"] })}
            options={statusOptions}
          />
        </Field>

        <Field label={t("teachers.field.joinDate")}>
          <DatePicker
            value={teacherDraft.joinDate || undefined}
            onChange={(dateStr) => onDraftChange({ joinDate: dateStr })}
          />
        </Field>

        <Field label={t("teachers.field.notes")}>
          <Textarea
            value={teacherDraft.notes || ""}
            onChange={(event) => onDraftChange({ notes: event.target.value })}
            placeholder={t("teachers.form.notesPlaceholder")}
            className="min-h-[5rem]"
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
                  onChange={(val) => onCustomValueChange(field.id, val)}
                  options={field.options}
                />
              ) : (
                <Input
                  value={customValues[field.id] || ""}
                  onChange={(event) => onCustomValueChange(field.id, event.target.value)}
                  className={FORM_INPUT}
                />
              )}
            </Field>
          ))}
        </Card>
      )}
    </div>
  );
}
