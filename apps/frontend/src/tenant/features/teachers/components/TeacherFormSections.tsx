import type React from "react";
import { Briefcase, GraduationCap, Hash, School, User } from "lucide-react";
import ContactPicker from "@/components/contactLink/ContactPicker";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { FORM_INPUT_ERROR } from "@/components/ui/formStyles";
import { LeadingIconInput } from "@/components/ui/LeadingIconInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";
import type { FieldDefinition, Teacher } from "@mms/shared";
import { resolveTeacherStatus } from "@mms/shared";
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

export interface TeacherBasicSectionProps extends TeacherSectionBaseProps {
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
  const contactLabel = resolveTeacherFieldLabel(fields, "basic", "contactId", t);
  const specializationLabel = resolveTeacherFieldLabel(fields, "basic", "specialization", t);
  const qualificationLabel = resolveTeacherFieldLabel(fields, "basic", "qualification", t);

  return (
    <div className="space-y-4 text-start">
      {showContact ? (
        <SectionCard title={contactLabel} icon={User} accentColor="primary" className="z-20">
          <ContactPicker
            label={contactLabel}
            value={teacherDraft.contactId ? String(teacherDraft.contactId) : null}
            onChange={(contactId) => onDraftChange({ contactId: contactId ? String(contactId) : "" })}
            excludeIds={linkedTeacherContactIds.map(String)}
            searchPlaceholder={t("teachers.form.searchContact")}
            emptyTitle={t("teachers.form.noContacts")}
            emptyHint={t("teachers.form.noContactsHint")}
            error={!!errors.contactId}
            errorMessage={errors.contactId}
          />
        </SectionCard>
      ) : null}

      {showDetailsCard ? (
        <SectionCard title={t("teachers.form.sectionDetails")} icon={School} accentColor="primary" className="z-10">
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
        </SectionCard>
      ) : null}
    </div>
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
        </SectionCard>
      ) : null}
    </div>
  );
}
