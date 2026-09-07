import type React from "react";
import { Briefcase, GraduationCap, Hash, Mail, Phone, School, User } from "lucide-react";
import ContactPicker from "@/components/contactLink/ContactPicker";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { FORM_INPUT_ERROR } from "@/components/ui/formStyles";
import { LeadingIconInput } from "@/components/ui/LeadingIconInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";
import {
  getPrimaryEmail,
  getPrimaryPhone,
  resolveTeacherStatus,
  type Contact,
  type FieldDefinition,
  type Teacher,
} from "@mms/shared";
import { resolveTeacherFieldLabel } from "@/tenant/features/teachers/components/TeacherFormSectionShared";

export interface TeacherSectionBaseProps {
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

export interface TeacherContactSectionProps {
  teacherDraft: Partial<Teacher>;
  linkedContact?: Contact | null;
  linkedTeacherContactIds: Array<string | number>;
  errors: Record<string, string>;
  fields: Record<string, FieldDefinition[]>;
  isFieldEnabled: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
  onDraftChange: (patch: Partial<Teacher>) => void;
}

export function TeacherContactSection({
  teacherDraft,
  linkedContact,
  linkedTeacherContactIds,
  errors,
  fields,
  isFieldEnabled,
  isFieldRequired,
  onDraftChange,
}: TeacherContactSectionProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const showContact = isFieldEnabled("contactId");
  if (!showContact) return null;

  const contactLabel = resolveTeacherFieldLabel(fields, "basic", "contactId", t);
  const primaryPhone = linkedContact ? getPrimaryPhone(linkedContact) : null;
  const primaryEmail = linkedContact ? getPrimaryEmail(linkedContact) : null;
  const hasProfilePills = Boolean(teacherDraft.contactId) && (Boolean(primaryPhone) || Boolean(primaryEmail));

  return (
    <SectionCard title={contactLabel} icon={User} accentColor="primary" className="z-20">
      <div className="space-y-3">
        <ContactPicker
          label={contactLabel}
          value={teacherDraft.contactId ? String(teacherDraft.contactId) : null}
          onChange={(contactId) => onDraftChange({ contactId: contactId ? String(contactId) : "" })}
          excludeIds={linkedTeacherContactIds.map(String)}
          searchPlaceholder={t("teachers.form.searchContact")}
          emptyTitle={t("teachers.form.noContacts")}
          emptyHint={t("teachers.form.noContactsHint")}
          required={isFieldRequired("contactId")}
          error={!!errors.contactId}
          errorMessage={errors.contactId}
        />
        {hasProfilePills ? (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/40">
            {primaryPhone ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 text-xs text-muted-foreground font-medium">
                <Phone className="w-3.5 h-3.5 text-primary" aria-hidden />
                <span>{primaryPhone}</span>
              </div>
            ) : null}
            {primaryEmail ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 text-xs text-muted-foreground font-medium">
                <Mail className="w-3.5 h-3.5 text-primary" aria-hidden />
                <span>{primaryEmail}</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}

export interface TeacherBasicSectionProps extends TeacherSectionBaseProps {
  defaultSpecialization: string;
  specializationOptions: string[];
}

export function TeacherBasicSection({
  teacherDraft,
  errors,
  fields,
  defaultSpecialization,
  specializationOptions,
  isFieldEnabled,
  isFieldRequired,
  onDraftChange,
}: TeacherBasicSectionProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const showSpecialization = isFieldEnabled("specialization");
  const showQualification = isFieldEnabled("qualification");
  const showDetailsCard = showSpecialization || showQualification;
  if (!showDetailsCard) return null;

  const specializationLabel = resolveTeacherFieldLabel(fields, "basic", "specialization", t);
  const qualificationLabel = resolveTeacherFieldLabel(fields, "basic", "qualification", t);

  return (
    <SectionCard title={t("teachers.form.sectionDetails")} icon={School} accentColor="primary" className="z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {showSpecialization ? (
              <Field label={specializationLabel} id="specialization" required={isFieldRequired("specialization")}>
                <FormSelect
                  id="specialization"
                  name="specialization"
                  value={teacherDraft.specialization || defaultSpecialization}
                  onChange={(val) => onDraftChange({ specialization: val })}
                  options={specializationOptions}
                />
              </Field>
            ) : null}

            {showQualification ? (
              <Field label={qualificationLabel} id="qualification" required={isFieldRequired("qualification")} error={errors.qualification}>
                <LeadingIconInput
                  id="qualification"
                  name="qualification"
                  icon={GraduationCap}
                  value={teacherDraft.qualification || ""}
                  onChange={(event) => onDraftChange({ qualification: event.target.value })}
                  placeholder={t("teachers.form.qualificationPlaceholder")}
                  aria-invalid={Boolean(errors.qualification)}
                  aria-describedby={errors.qualification ? "qualification-error" : undefined}
                  className={errors.qualification ? FORM_INPUT_ERROR : undefined}
                />
              </Field>
            ) : null}
          </div>
        </SectionCard>
  );
}

export interface TeacherEmploymentSectionProps extends TeacherSectionBaseProps {
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
  const showEmploymentCard = showEmployeeId || showStatus || showJoinDate;
  const employeeIdLabel = resolveTeacherFieldLabel(fields, "employment", "employeeId", t);
  const statusLabel = resolveTeacherFieldLabel(fields, "employment", "status", t);
  const joinDateLabel = resolveTeacherFieldLabel(fields, "employment", "joinDate", t);

  return (
    <div className="space-y-4 text-start">
      {showEmploymentCard ? (
        <SectionCard title={t("teachers.form.sectionEmployment")} icon={Briefcase} accentColor="primary">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {showEmployeeId ? (
              <Field label={employeeIdLabel} id="employeeId" required error={errors.employeeId}>
                <LeadingIconInput
                  id="employeeId"
                  name="employeeId"
                  icon={Hash}
                  value={teacherDraft.employeeId || ""}
                  onChange={(event) => onDraftChange({ employeeId: event.target.value })}
                  placeholder={t("teachers.form.employeeIdPlaceholder", { prefix: idPrefix })}
                  disabled={autoGenerateId && !teacher?.id && Boolean(nextEmployeeId)}
                  aria-invalid={Boolean(errors.employeeId)}
                  aria-describedby={errors.employeeId ? "employeeId-error" : undefined}
                  className={errors.employeeId ? FORM_INPUT_ERROR : undefined}
                />
              </Field>
            ) : null}

            {showStatus ? (
              <Field label={statusLabel} id="status" required={isFieldRequired("status")}>
                <FormSelect
                  id="status"
                  name="status"
                  value={resolveTeacherStatus(teacherDraft.status)}
                  onChange={(val) => onDraftChange({ status: val as Teacher["status"] })}
                  options={statusOptions}
                />
              </Field>
            ) : null}

            {showJoinDate ? (
              <div className="md:col-span-2">
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
              </div>
            ) : null}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
