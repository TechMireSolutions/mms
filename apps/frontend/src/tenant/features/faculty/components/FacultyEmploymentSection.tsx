import type React from "react";
import { Briefcase } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";
import {
  resolveFacultyStatus,
  type FieldDefinition,
  type Faculty,
  type FacultyMember,
  type FacultyHierarchyPreset,
  type FacultyDesignationDefinition,
} from "@mms/shared";
import { FacultyHierarchyFormFields } from "@/tenant/features/faculty/components/FacultyHierarchyFormFields";
import { resolveFacultyFieldLabel } from "@/tenant/features/faculty/components/FacultyFormSectionShared";
import { FacultyEmploymentDesignationFields } from "@/tenant/features/faculty/components/FacultyEmploymentDesignationFields";
import { FacultyEmploymentAcademicFields } from "@/tenant/features/faculty/components/FacultyEmploymentAcademicFields";
import { FacultyEmploymentEmployeeIdField } from "@/tenant/features/faculty/components/FacultyEmploymentEmployeeIdField";

export interface FacultySectionBaseProps {
  facultyDraft?: Partial<FacultyMember>;
  errors: Record<string, string>;
  fields: Record<string, FieldDefinition[]>;
  onDraftChange: (patch: Partial<FacultyMember>) => void;
  isFieldEnabled: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
}

export interface FacultyStatusOption {
  value: string;
  label: string;
}

export interface FacultyEmploymentSectionProps extends FacultySectionBaseProps {
  autoGenerateId: boolean;
  idPrefix: string;
  nextEmployeeId?: string;
  onRegenerateEmployeeId?: () => void;
  isFetchingNextEmployeeId?: boolean;
  statusOptions: FacultyStatusOption[];
  specializationOptions?: string[];
  departmentOptions?: string[];
  designationOptions?: FacultyDesignationDefinition[];
  faculty?: FacultyMember;
  supervisorCandidates?: Faculty[];
  hierarchyRankPresets?: readonly FacultyHierarchyPreset[];
  hideDesignation?: boolean;
  hideHierarchy?: boolean;
}

export function FacultyEmploymentSection(props: FacultyEmploymentSectionProps): React.JSX.Element | null {
  const {
    autoGenerateId,
    designationOptions,
    errors,
    fields,
    idPrefix,
    nextEmployeeId,
    onRegenerateEmployeeId,
    isFetchingNextEmployeeId,
    statusOptions,
    departmentOptions,
    isFieldEnabled,
    isFieldRequired,
    onDraftChange,
    supervisorCandidates,
    hierarchyRankPresets,
    hideDesignation = false,
    hideHierarchy = false,
  } = props;
  const faculty = props.faculty;
  const facultyDraft = props.facultyDraft ?? {};
  const { t } = useTranslation();
  const showEmployeeId = isFieldEnabled("employeeId");
  const showDesignation = !hideDesignation && isFieldEnabled("designation");
  const showDepartment = isFieldEnabled("department");
  const showStatus = isFieldEnabled("status");
  const showJoinDate = isFieldEnabled("joinDate");
  const hasVisibleFields = showEmployeeId || showDesignation || showDepartment ||
    showStatus || showJoinDate ||
    (!hideHierarchy && (isFieldEnabled("hierarchyRank") || isFieldEnabled("reportingFacultyId")));
  if (!hasVisibleFields) return null;

  const lbl = (field: string) => resolveFacultyFieldLabel(fields, "employment", field, t);

  return (
    <div className="space-y-4 text-start">
      <SectionCard title={t("faculty.form.sectionEmployment")} icon={Briefcase} accentColor="primary">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {showEmployeeId && (
            <FacultyEmploymentEmployeeIdField
              label={lbl("employeeId")}
              required={isFieldRequired("employeeId")}
              error={errors.employeeId}
              employeeId={facultyDraft.employeeId}
              idPrefix={idPrefix}
              autoGenerateId={autoGenerateId}
              isExistingFaculty={Boolean(faculty?.id)}
              hasNextEmployeeId={Boolean(nextEmployeeId)}
              isFetchingNextEmployeeId={isFetchingNextEmployeeId}
              onDraftChange={onDraftChange}
              onRegenerateEmployeeId={onRegenerateEmployeeId}
              t={t}
            />
          )}

          {showDesignation && (
            <FacultyEmploymentDesignationFields
              faculty={faculty}
              facultyDraft={facultyDraft}
              errors={errors}
              designationOptions={designationOptions}
              designationLabel={lbl("designation")}
              isFieldRequired={isFieldRequired}
              onDraftChange={onDraftChange}
            />
          )}

          <FacultyEmploymentAcademicFields
            facultyDraft={facultyDraft}
            errors={errors}
            departmentLabel={lbl("department")}
            showDepartment={showDepartment}
            isFieldRequired={isFieldRequired}
            onDraftChange={onDraftChange}
            departmentOptions={departmentOptions}
          />

          {!hideHierarchy && (
            <FacultyHierarchyFormFields
              facultyDraft={facultyDraft}
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
                value={resolveFacultyStatus(facultyDraft.status)}
                onChange={(val) => onDraftChange({ status: val as FacultyMember["status"] })}
                options={statusOptions}
              />
            </Field>
          )}

          {showJoinDate && (
            <div className="md:col-span-2">
              <Field label={lbl("joinDate")} id="faculty-join-date" required={isFieldRequired("joinDate")} error={errors.joinDate}>
                <DatePicker
                  id="faculty-join-date"
                  name="joinDate"
                  value={facultyDraft.joinDate || undefined}
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
