import type React from "react";
import { Award, BadgeCheck, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";
import {
  type Faculty,
  type FacultyDepartmentEntity,
  type FacultyDesignationDefinition,
  type FacultyHierarchyPreset,
  type FacultyMember,
  FACULTY_HIERARCHY_RANK_PRESETS,
} from "@mms/shared";
import { FacultyDepartmentSelectField } from "./FacultyDepartmentSelectField";
import { FacultyDesignationSelectField } from "./FacultyDesignationSelectField";

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
    hierarchyRankPresets = FACULTY_HIERARCHY_RANK_PRESETS,
  } = props;
  const { t } = useTranslation();

  const showDesignation = isFieldEnabled("designation");
  const showDepartment = isFieldEnabled("department");
  const showSupervisor = supervisorCandidates !== undefined && isFieldEnabled("reportingFacultyId");
  const showHierarchyRank = supervisorCandidates !== undefined && isFieldEnabled("hierarchyRank");

  if (!showDesignation && !showDepartment && !showSupervisor && !showHierarchyRank) return null;

  const currentDefinition = designationOptions.find((item) => item.id === facultyDraft.designationId);
  const assignableRoles = currentDefinition?.assignableRoles ?? facultyDraft.designationAssignableRoles ?? [];

  return (
    <div className="space-y-4 text-start">
      <SectionCard title={t("faculty.form.tab.designationHierarchy")} icon={Award} accentColor="primary">
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
            <Field label={t("faculty.form.reportingSupervisor")} id="reportingFacultyId" required={isFieldRequired("reportingFacultyId")} error={errors.reportingFacultyId}>
              <FormSelect
                id="reportingFacultyId"
                name="reportingFacultyId"
                value={facultyDraft.reportingFacultyId ? String(facultyDraft.reportingFacultyId) : ""}
                disabled={facultyDraft.hierarchyRank === 1}
                onChange={(val) => onDraftChange({ reportingFacultyId: val || null })}
                options={[
                  { value: "", label: t("faculty.form.noSupervisor") },
                  ...(supervisorCandidates || []).map((cand) => ({
                    value: String(cand.id),
                    label: `${cand.name || cand.employeeId || "Faculty"} (Rank ${cand.hierarchyRank ?? 4}${cand.designation ? ` · ${cand.designation}` : ""})`,
                  })),
                ]}
              />
              {facultyDraft.hierarchyRank === 1 && <p className="mt-1 text-xs text-muted-foreground">{t("faculty.form.topLevelRankNotice")}</p>}
            </Field>
          )}

          {showHierarchyRank && (
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3" id="hierarchyRank">
              <div className="flex items-center gap-2">
                <BadgeCheck className="size-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-foreground">{t("faculty.form.hierarchyRank")}</p>
                  <p className="text-xs text-muted-foreground">
                    {hierarchyRankPresets.find((p) => p.rank === (facultyDraft.hierarchyRank ?? 4))?.label ?? t("common.notSpecified")}
                    {` · ${t("faculty.form.rankValue", { rank: facultyDraft.hierarchyRank ?? 4 })}`}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{t("faculty.designations.rankDerivedHint")}</p>
              {errors.hierarchyRank ? <p className="mt-1 text-xs text-destructive">{errors.hierarchyRank}</p> : null}
            </div>
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
