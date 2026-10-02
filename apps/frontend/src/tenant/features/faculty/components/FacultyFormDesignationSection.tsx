import type React from "react";
import { Award, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/FormPrimitives";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";
import {
  type Faculty,
  type FacultyDepartmentEntity,
  type FacultyDesignationDefinition,
  type FacultyHierarchyPreset,
  type FacultyMember,
} from "@mms/shared";
import { FacultyDepartmentSelectField } from "./FacultyDepartmentSelectField";
import { FacultyDesignationSelectField } from "./FacultyDesignationSelectField";
import { FacultyReportingRoleSelectField } from "./FacultyReportingRoleSelectField";

export interface FacultyFormDesignationSectionProps {
  faculty?: FacultyMember;
  facultyDraft?: Partial<FacultyMember>;
  errors: Record<string, string>;
  designationOptions?: FacultyDesignationDefinition[];
  departmentOptions?: string[];
  departmentEntities?: FacultyDepartmentEntity[];
  isFieldEnabled: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
  onDraftChange: (patch: Partial<FacultyMember>) => void;
  supervisorCandidates?: Faculty[];
  hierarchyRankPresets?: readonly FacultyHierarchyPreset[];
}

export function FacultyFormDesignationSection(props: FacultyFormDesignationSectionProps): React.JSX.Element | null {
  const {
    faculty,
    facultyDraft = {},
    errors,
    designationOptions = [],
    departmentOptions,
    departmentEntities,
    isFieldEnabled,
    isFieldRequired,
    onDraftChange,
    supervisorCandidates,
  } = props;
  const { t } = useTranslation();

  const showDesignation = isFieldEnabled("designation");
  const showDepartment = isFieldEnabled("department");
  const showSupervisor = supervisorCandidates !== undefined && isFieldEnabled("reportingFacultyId");

  if (!showDesignation && !showDepartment && !showSupervisor) return null;

  const currentDefinition = designationOptions.find((item) => item.id === facultyDraft.designationId);
  const assignableRoles = currentDefinition?.assignableRoles ?? facultyDraft.designationAssignableRoles ?? [];

  return (
    <div className="space-y-4 text-start">
      <SectionCard title={t("faculty.form.tab.designation")} icon={Award} accentColor="primary">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {showDepartment && (
            <FacultyDepartmentSelectField
              value={facultyDraft.department ?? ""}
              departmentId={typeof facultyDraft.departmentId === "string" ? facultyDraft.departmentId : undefined}
              error={errors.department || errors.departmentId}
              required={isFieldRequired("department")}
              departmentOptions={departmentOptions}
              departmentEntities={departmentEntities}
              facultyId={faculty?.id}
              reportingFacultyId={facultyDraft.reportingFacultyId}
              onChange={onDraftChange}
            />
          )}

          {showDesignation && (
            <FacultyDesignationSelectField
              designationId={facultyDraft.designationId ?? ""}
              designationName={facultyDraft.designation ?? ""}
              error={errors.designationId || errors.designation}
              required={isFieldRequired("designation")}
              disabled={Boolean(faculty?.id)}
              designationOptions={designationOptions}
              onChange={onDraftChange}
            />
          )}

          {showSupervisor && (
            <FacultyReportingRoleSelectField
              facultyDraft={facultyDraft}
              errors={errors}
              required={isFieldRequired("reportingFacultyId")}
              designationOptions={designationOptions}
              supervisorCandidates={supervisorCandidates}
              onDraftChange={onDraftChange}
            />
          )}

          {showDesignation && !faculty?.id && (
            <>
              <Field label={t("faculty.designations.startsOn")} id="designationStartsOn" required error={errors.designationStartsOn}>
                <DatePicker id="designationStartsOn" name="designationStartsOn" value={facultyDraft.designationStartsOn || undefined} onChange={(dateStr) => onDraftChange({ designationStartsOn: dateStr })} />
              </Field>
              <Field label={t("faculty.designations.endsOn")} id="designationEndsOn" error={errors.designationEndsOn}>
                <DatePicker id="designationEndsOn" name="designationEndsOn" value={facultyDraft.designationEndsOn || undefined} min={facultyDraft.designationStartsOn || undefined} onChange={(dateStr) => onDraftChange({ designationEndsOn: dateStr || null })} />
              </Field>
            </>
          )}

          {showDesignation && currentDefinition && (
            <div className="md:col-span-2 space-y-1.5 rounded-lg border border-border/60 bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Shield className="size-3.5 text-primary" aria-hidden />
                <span>{t("faculty.designations.roles")}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {assignableRoles.map((role) => (
                  <Badge key={role} variant="secondary" className="text-xs font-normal">{role}</Badge>
                ))}
                {!assignableRoles.length && <span className="text-xs text-muted-foreground">{t("faculty.designations.noAssignableRoles")}</span>}
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
