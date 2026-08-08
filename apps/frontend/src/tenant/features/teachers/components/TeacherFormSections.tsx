import type React from "react";
import { Briefcase, GraduationCap, Hash, School, User } from "lucide-react";
import ContactPicker from "@/components/contactLink/ContactPicker";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field, FieldErrorMessage } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { Card } from "@/components/ui/card";
import { FORM_INPUT } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/useTranslation";
import type { FieldDefinition, Teacher } from "@mms/shared";
import { DEFAULT_TEACHER_STATUS } from "@mms/shared";
import { resolveTeacherFieldLabel } from "@/tenant/features/teachers/components/TeacherFormSectionShared";

interface TeacherSectionBaseProps {
  teacherDraft: Partial<Teacher>;
  errors: Record<string, string>;
  fields: Record<string, FieldDefinition[]>;
  onDraftChange: (patch: Partial<Teacher>) => void;
  isFieldEnabled: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
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
  fields,
  defaultSpecialization,
  linkedTeacherContactIds,
  specializationOptions,
  isFieldEnabled,
  isFieldRequired,
  onDraftChange,
}: TeacherBasicSectionProps): React.JSX.Element {
  const { t } = useTranslation();
  const showContact = isFieldEnabled("contactId");
  const showSpecialization = isFieldEnabled("specialization");
  const showQualification = isFieldEnabled("qualification");
  const showDetailsCard = showSpecialization || showQualification;
  const contactLabel = resolveTeacherFieldLabel(
    fields,
    "basic",
    "contactId",
    "teachers.field.contact",
    t,
  );
  const specializationLabel = resolveTeacherFieldLabel(
    fields,
    "basic",
    "specialization",
    "teachers.field.specialization",
    t,
  );
  const qualificationLabel = resolveTeacherFieldLabel(
    fields,
    "basic",
    "qualification",
    "teachers.field.qualification",
    t,
  );

  return (
    <div className="space-y-4 text-start">
      {showContact ? (
        <Card accentColor="primary" className="p-5.5 px-6.5 pb-6 space-y-4 shadow-sm z-20">
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40">
            <User className="w-4 h-4 text-primary/70 transition-colors" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{contactLabel}</h3>
          </div>
          <ContactPicker
            label={contactLabel}
            value={teacherDraft.contactId ? String(teacherDraft.contactId) : null}
            onChange={(contactId) => onDraftChange({ contactId: contactId ? String(contactId) : "" })}
            excludeIds={linkedTeacherContactIds.map(String)}
            searchPlaceholder={t("teachers.form.searchContact")}
            emptyTitle={t("teachers.form.noContacts")}
            emptyHint={t("teachers.form.noContactsHint")}
            error={!!errors.contactId}
          />
          <FieldErrorMessage message={errors.contactId} />
        </Card>
      ) : null}

      {showDetailsCard ? (
        <Card accentColor="primary" className="p-5.5 px-6.5 pb-6 space-y-4.5 shadow-sm z-10">
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40">
            <School className="w-4 h-4 text-primary/70 transition-colors" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("teachers.form.sectionDetails")}</h3>
          </div>
          {showSpecialization ? (
            <Field label={specializationLabel} required={isFieldRequired("specialization")}>
              <FormSelect
                value={teacherDraft.specialization || defaultSpecialization}
                onChange={(val) => onDraftChange({ specialization: val })}
                options={specializationOptions}
              />
            </Field>
          ) : null}

          {showQualification ? (
            <Field label={qualificationLabel} required={isFieldRequired("qualification")} error={errors.qualification}>
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
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}

interface TeacherEmploymentSectionProps extends TeacherSectionBaseProps {
  autoGenerateId: boolean;
  idPrefix: string;
  nextEmployeeId?: string;
  statusOptions: TeacherStatusOption[];
  teacher?: Teacher;
}

export function TeacherEmploymentSection({
  autoGenerateId,
  errors,
  fields,
  idPrefix,
  nextEmployeeId,
  statusOptions,
  teacher,
  teacherDraft,
  isFieldEnabled,
  isFieldRequired,
  onDraftChange,
}: TeacherEmploymentSectionProps): React.JSX.Element {
  const { t } = useTranslation();
  const showEmployeeId = isFieldEnabled("employeeId");
  const showStatus = isFieldEnabled("status");
  const showJoinDate = isFieldEnabled("joinDate");
  const showNotes = isFieldEnabled("notes");
  const showEmploymentCard = showEmployeeId || showStatus || showJoinDate || showNotes;
  const employeeIdLabel = resolveTeacherFieldLabel(
    fields,
    "employment",
    "employeeId",
    "teachers.field.employeeId",
    t,
  );
  const statusLabel = resolveTeacherFieldLabel(
    fields,
    "employment",
    "status",
    "teachers.field.status",
    t,
  );
  const joinDateLabel = resolveTeacherFieldLabel(
    fields,
    "employment",
    "joinDate",
    "teachers.field.joinDate",
    t,
  );
  const notesLabel = resolveTeacherFieldLabel(
    fields,
    "employment",
    "notes",
    "teachers.field.notes",
    t,
  );

  return (
    <div className="space-y-4 text-start">
      {showEmploymentCard ? (
        <Card accentColor="primary" className="p-5.5 px-6.5 pb-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40">
            <Briefcase className="w-4 h-4 text-primary/70 transition-colors" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("teachers.form.sectionEmployment")}</h3>
          </div>
          {showEmployeeId ? (
            <Field label={employeeIdLabel} required error={errors.employeeId}>
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
          ) : null}

          {showStatus ? (
            <Field label={statusLabel} required={isFieldRequired("status")}>
              <FormSelect
                value={teacherDraft.status || DEFAULT_TEACHER_STATUS}
                onChange={(val) => onDraftChange({ status: val as Teacher["status"] })}
                options={statusOptions}
              />
            </Field>
          ) : null}

          {showJoinDate ? (
            <Field
              label={joinDateLabel}
              id="teacher-join-date"
              required={isFieldRequired("joinDate")}
              error={errors.joinDate}
            >
              <DatePicker
                id="teacher-join-date"
                name="joinDate"
                value={teacherDraft.joinDate || undefined}
                onChange={(dateStr) => onDraftChange({ joinDate: dateStr })}
              />
            </Field>
          ) : null}

          {showNotes ? (
            <Field label={notesLabel} required={isFieldRequired("notes")} error={errors.notes}>
              <Textarea
                value={teacherDraft.notes || ""}
                onChange={(event) => onDraftChange({ notes: event.target.value })}
                placeholder={t("teachers.form.notesPlaceholder")}
                className="min-h-[5rem]"
              />
            </Field>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
