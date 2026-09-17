import type React from "react";
import { Briefcase, GraduationCap, Hash, Mail, Phone, RotateCw, School, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import ContactPicker from "@/components/contactLink/ContactPicker";
import { DatePicker } from "@/components/ui/DatePicker";
import { EditableSelect } from "@/components/ui/EditableSelect";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { FORM_INPUT_ERROR } from "@/components/ui/formStyles";
import { LeadingIconInput } from "@/components/ui/LeadingIconInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import {
  getContactQualification,
  getContactSpecialization,
  getPrimaryEmail,
  getPrimaryPhone,
  resolveTeacherStatus,
  type Contact,
  type FieldDefinition,
  type Teacher,
} from "@mms/shared";
import { resolveTeacherFieldLabel } from "@/tenant/features/faculty/components/FacultyFormSectionShared";

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
  const contactQualification = linkedContact ? getContactQualification(linkedContact) : "";
  const contactSpecialization = linkedContact ? getContactSpecialization(linkedContact) : "";
  const hasProfilePills =
    Boolean(teacherDraft.contactId) &&
    (Boolean(primaryPhone) ||
      Boolean(primaryEmail) ||
      Boolean(contactQualification) ||
      Boolean(contactSpecialization));

  return (
    <SectionCard title={contactLabel} icon={User} accentColor="primary" className="z-sticky">
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
        {hasProfilePills && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/40">
            {primaryPhone && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 text-xs text-muted-foreground font-medium">
                <Phone className="w-3.5 h-3.5 text-primary" aria-hidden />
                <span>{primaryPhone}</span>
              </div>
            )}
            {primaryEmail && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 text-xs text-muted-foreground font-medium">
                <Mail className="w-3.5 h-3.5 text-primary" aria-hidden />
                <span>{primaryEmail}</span>
              </div>
            )}
            {contactQualification && (
              <div
                data-testid="teacher-contact-qualification-pill"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 text-xs text-muted-foreground font-medium"
                title={t("teachers.field.qualification")}
              >
                <GraduationCap className="w-3.5 h-3.5 text-primary" aria-hidden />
                <span>{contactQualification}</span>
              </div>
            )}
            {contactSpecialization && (
              <div
                data-testid="teacher-contact-specialization-pill"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 text-xs text-muted-foreground font-medium"
                title={t("teachers.field.specialization")}
              >
                <School className="w-3.5 h-3.5 text-primary" aria-hidden />
                <span>{contactSpecialization}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

/**
 * @deprecated Qualification and specialization are derived directly from the linked contact's profile.
 */
export interface TeacherBasicSectionProps extends Partial<TeacherSectionBaseProps> {
  defaultSpecialization?: string;
  specializationOptions?: string[];
}

/**
 * @deprecated Retired in favor of contact-first education and skills resolution.
 */
export function TeacherBasicSection(_props: TeacherBasicSectionProps): React.JSX.Element | null {
  return null;
}

export interface TeacherEmploymentSectionProps extends TeacherSectionBaseProps {
  autoGenerateId: boolean;
  idPrefix: string;
  nextEmployeeId?: string;
  onRegenerateEmployeeId?: () => void;
  isFetchingNextEmployeeId?: boolean;
  statusOptions: TeacherStatusOption[];
  designationOptions?: string[];
  onUpdateDesignations?: (options: string[]) => void;
  teacher?: Teacher;
}

export function TeacherEmploymentSection({
  autoGenerateId,
  designationOptions,
  errors,
  fields,
  idPrefix,
  nextEmployeeId,
  onRegenerateEmployeeId,
  isFetchingNextEmployeeId,
  onUpdateDesignations,
  statusOptions,
  teacher,
  teacherDraft,
  isFieldEnabled,
  isFieldRequired,
  onDraftChange,
}: TeacherEmploymentSectionProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const showEmployeeId = isFieldEnabled("employeeId");
  const showDesignation = isFieldEnabled("designation");
  const showStatus = isFieldEnabled("status");
  const showJoinDate = isFieldEnabled("joinDate");
  if (!showEmployeeId && !showDesignation && !showStatus && !showJoinDate) return null;

  const employeeIdLabel = resolveTeacherFieldLabel(fields, "employment", "employeeId", t);
  const designationLabel = resolveTeacherFieldLabel(fields, "employment", "designation", t);
  const statusLabel = resolveTeacherFieldLabel(fields, "employment", "status", t);
  const joinDateLabel = resolveTeacherFieldLabel(fields, "employment", "joinDate", t);

  return (
    <div className="space-y-4 text-start">
      <SectionCard title={t("teachers.form.sectionEmployment")} icon={Briefcase} accentColor="primary">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {showEmployeeId && (
            <Field label={employeeIdLabel} id="employeeId" required error={errors.employeeId}>
              <div className="flex items-center gap-2">
                <div className="flex-1">
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
                </div>
                {!teacher?.id && onRegenerateEmployeeId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-9 w-9 border-border/70 hover:bg-muted"
                    onClick={onRegenerateEmployeeId}
                    disabled={isFetchingNextEmployeeId}
                    title={t("teachers.form.regenerateId")}
                    aria-label={t("teachers.form.regenerateId")}
                  >
                    <RotateCw className={cn("h-4 w-4 text-muted-foreground", isFetchingNextEmployeeId && "animate-spin text-primary")} />
                  </Button>
                )}
              </div>
            </Field>
          )}

          {showDesignation && (
            <Field label={designationLabel} id="designation" required={isFieldRequired("designation")} error={errors.designation}>
              {onUpdateDesignations ? (
                <EditableSelect
                  id="designation"
                  name="designation"
                  options={designationOptions || []}
                  value={teacherDraft.designation || ""}
                  onChange={(val) => onDraftChange({ designation: val })}
                  onUpdateOptions={onUpdateDesignations}
                  placeholder={t("teachers.form.selectDesignation")}
                  addPlaceholder={t("teachers.form.addDesignation")}
                  className={cn("w-full", errors.designation && FORM_INPUT_ERROR)}
                />
              ) : (
                <FormSelect
                  id="designation"
                  name="designation"
                  value={teacherDraft.designation || ""}
                  onChange={(val) => onDraftChange({ designation: val })}
                  options={designationOptions || []}
                />
              )}
            </Field>
          )}

          {showStatus && (
            <Field label={statusLabel} id="status" required={isFieldRequired("status")}>
              <FormSelect
                id="status"
                name="status"
                value={resolveTeacherStatus(teacherDraft.status)}
                onChange={(val) => onDraftChange({ status: val as Teacher["status"] })}
                options={statusOptions}
              />
            </Field>
          )}

          {showJoinDate && (
            <div className="md:col-span-2">
              <Field label={joinDateLabel} id="teacher-join-date" required={isFieldRequired("joinDate")} error={errors.joinDate}>
                <DatePicker
                  id="teacher-join-date"
                  name="joinDate"
                  value={teacherDraft.joinDate || undefined}
                  onChange={(dateStr) => onDraftChange({ joinDate: dateStr })}
                />
              </Field>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

export type FacultySectionBaseProps = TeacherSectionBaseProps;
export type FacultyStatusOption = TeacherStatusOption;
export type FacultyContactSectionProps = TeacherContactSectionProps;
export const FacultyContactSection = TeacherContactSection;
export type FacultyBasicSectionProps = TeacherBasicSectionProps;
export const FacultyBasicSection = TeacherBasicSection;
export type FacultyEmploymentSectionProps = TeacherEmploymentSectionProps;
export const FacultyEmploymentSection = TeacherEmploymentSection;
