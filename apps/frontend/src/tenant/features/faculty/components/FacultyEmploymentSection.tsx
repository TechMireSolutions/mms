import type React from "react";
import { Briefcase } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";
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
import { FacultyEmploymentDesignationFields } from "@/tenant/features/faculty/components/FacultyEmploymentDesignationFields";
import { FacultyEmploymentAcademicFields } from "@/tenant/features/faculty/components/FacultyEmploymentAcademicFields";
import { FacultyEmploymentEmployeeIdField } from "@/tenant/features/faculty/components/FacultyEmploymentEmployeeIdField";

export interface TeacherSectionBaseProps {
  teacherDraft: Partial<Teacher>;
  errors: Record<string, string>;
  fields: Record<string, FieldDefinition[]>;
  onDraftChange: (patch: Partial<Teacher>) => void;
  isFieldEnabled: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
}

export interface TeacherStatusOption { value: string; label: string; }

export interface TeacherEmploymentSectionProps extends TeacherSectionBaseProps {
  autoGenerateId: boolean;
  idPrefix: string;
  nextEmployeeId?: string;
  onRegenerateEmployeeId?: () => void;
  isFetchingNextEmployeeId?: boolean;
  statusOptions: TeacherStatusOption[];
  specializationOptions?: string[];
  designationOptions?: FacultyDesignationDefinition[];
  teacher?: Teacher;
  supervisorCandidates?: Faculty[];
  hierarchyRankPresets?: readonly FacultyHierarchyPreset[];
  hideDesignation?: boolean;
  hideHierarchy?: boolean;
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
  specializationOptions,
  teacher,
  teacherDraft,
  isFieldEnabled,
  isFieldRequired,
  onDraftChange,
  supervisorCandidates,
  hierarchyRankPresets,
  hideDesignation = false,
  hideHierarchy = false,
}: TeacherEmploymentSectionProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const showEmployeeId = isFieldEnabled("employeeId");
  const showDesignation = !hideDesignation && isFieldEnabled("designation");
  const showDepartment = isFieldEnabled("department");
  const showSpecialization = isFieldEnabled("specialization");
  const showQualification = isFieldEnabled("qualification");
  const showStatus = isFieldEnabled("status");
  const showJoinDate = isFieldEnabled("joinDate");
  const hasVisibleFields = showEmployeeId || showDesignation || showDepartment ||
    showSpecialization || showQualification || showStatus || showJoinDate ||
    (!hideHierarchy && (isFieldEnabled("hierarchyRank") || isFieldEnabled("reportingFacultyId")));
  if (!hasVisibleFields) return null;

  const lbl = (field: string) => resolveTeacherFieldLabel(fields, "employment", field, t);

  return (
    <div className="space-y-4 text-start">
      <SectionCard title={t("teachers.form.sectionEmployment")} icon={Briefcase} accentColor="primary">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {showEmployeeId && (
            <FacultyEmploymentEmployeeIdField
              label={lbl("employeeId")}
              required={isFieldRequired("employeeId")}
              error={errors.employeeId}
              employeeId={teacherDraft.employeeId}
              idPrefix={idPrefix}
              autoGenerateId={autoGenerateId}
              isExistingFaculty={Boolean(teacher?.id)}
              hasNextEmployeeId={Boolean(nextEmployeeId)}
              isFetchingNextEmployeeId={isFetchingNextEmployeeId}
              onDraftChange={onDraftChange}
              onRegenerateEmployeeId={onRegenerateEmployeeId}
              t={t}
            />
          )}

          {showDesignation && (
            <FacultyEmploymentDesignationFields
              teacher={teacher}
              teacherDraft={teacherDraft}
              errors={errors}
              designationOptions={designationOptions}
              designationLabel={lbl("designation")}
              isFieldRequired={isFieldRequired}
              onDraftChange={onDraftChange}
            />
          )}

          <FacultyEmploymentAcademicFields
            teacherDraft={teacherDraft}
            errors={errors}
            departmentLabel={lbl("department")}
            specializationLabel={lbl("specialization")}
            qualificationLabel={lbl("qualification")}
            showDepartment={showDepartment}
            showSpecialization={showSpecialization}
            showQualification={showQualification}
            isFieldRequired={isFieldRequired}
            onDraftChange={onDraftChange}
            specializationOptions={specializationOptions}
          />

          {!hideHierarchy && (
            <FacultyHierarchyFormFields
              teacherDraft={teacherDraft}
              errors={errors}
              isFieldEnabled={isFieldEnabled}
              isFieldRequired={isFieldRequired}
              onDraftChange={onDraftChange}
              supervisorCandidates={supervisorCandidates}
              hierarchyRankPresets={hierarchyRankPresets}
            />
          )}

          {showStatus && (
            <Field label={lbl("status")} id="status" required={isFieldRequired("status")}>
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
              <Field label={lbl("joinDate")} id="teacher-join-date" required={isFieldRequired("joinDate")} error={errors.joinDate}>
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
export type FacultyEmploymentSectionProps = TeacherEmploymentSectionProps;
export const FacultyEmploymentSection = TeacherEmploymentSection;
