import type React from "react";
import { Briefcase, Hash, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { FORM_INPUT_ERROR } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { LeadingIconInput } from "@/components/ui/LeadingIconInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import {
  resolveTeacherStatus,
  type FieldDefinition,
  type Teacher,
  type Faculty,
  type FacultyHierarchyPreset,
  type FacultyDesignationDefinition,
} from "@mms/shared";
import { FacultyHierarchyFormFields } from "@/tenant/features/faculty/components/FacultyHierarchyFormFields";
import { resolveTeacherFieldLabel } from "@/tenant/features/faculty/components/FacultyFormSectionShared";
import { extractEmployeeId } from "@/tenant/features/faculty/components/facultyFormDraft";

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

import {
  TeacherContactSection,
  type TeacherContactSectionProps,
} from "@/tenant/features/faculty/components/FacultyFormContactSection";

export {
  TeacherContactSection,
  type TeacherContactSectionProps,
};

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
  designationOptions?: FacultyDesignationDefinition[];
  teacher?: Teacher;
  supervisorCandidates?: Faculty[];
  hierarchyRankPresets?: readonly FacultyHierarchyPreset[];
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
  statusOptions,
  teacher,
  teacherDraft,
  isFieldEnabled,
  isFieldRequired,
  onDraftChange,
  supervisorCandidates,
  hierarchyRankPresets,
}: TeacherEmploymentSectionProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const showEmployeeId = isFieldEnabled("employeeId");
  const showDesignation = isFieldEnabled("designation");
  const showDepartment = isFieldEnabled("department");
  const showHierarchyRank = isFieldEnabled("hierarchyRank");
  const showSupervisor = isFieldEnabled("reportingFacultyId");
  const showStatus = isFieldEnabled("status");
  const showJoinDate = isFieldEnabled("joinDate");
  if (
    !showEmployeeId &&
    !showDesignation &&
    !showDepartment &&
    !showHierarchyRank &&
    !showSupervisor &&
    !showStatus &&
    !showJoinDate
  ) {
    return null;
  }

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
                    value={extractEmployeeId(teacherDraft.employeeId)}
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
            <div className="space-y-3">
              <Field label={designationLabel} id="designationId" required error={errors.designationId}>
                <FormSelect
                  id="designationId"
                  name="designationId"
                  value={teacherDraft.designationId || ""}
                  disabled={Boolean(teacher?.id)}
                  onChange={(value) => {
                    const definition = designationOptions?.find((item) => item.id === value);
                    onDraftChange({
                      designationId: value,
                      designation: definition?.name ?? "",
                      hierarchyRank: definition?.hierarchyRank,
                      designationAssignableRoles: definition?.assignableRoles ?? [],
                    });
                  }}
                  options={(designationOptions ?? []).filter((item) => item.isActive || item.id === teacherDraft.designationId).map((item) => ({ value: item.id, label: item.name }))}
                />
                {teacher?.id ? <p className="mt-1 text-xs text-muted-foreground">{t('faculty.designations.manageInHistory')}</p> : null}
              </Field>
              {!teacher?.id ? (
                <Field label={t('faculty.designations.startsOn')} id="designationStartsOn" required error={errors.designationStartsOn}>
                  <Input id="designationStartsOn" type="date" value={teacherDraft.designationStartsOn ?? ""} onChange={(event) => onDraftChange({ designationStartsOn: event.target.value })} />
                </Field>
              ) : null}
            </div>
          )}

          <FacultyHierarchyFormFields
            teacherDraft={teacherDraft}
            errors={errors}
            isFieldEnabled={isFieldEnabled}
            isFieldRequired={isFieldRequired}
            onDraftChange={onDraftChange}
            supervisorCandidates={supervisorCandidates}
            hierarchyRankPresets={hierarchyRankPresets}
          />

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
