import type React from "react";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { FORM_INPUT, FORM_INPUT_ERROR } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import {
  type Teacher,
  type Faculty,
  type FacultyHierarchyPreset,
  FACULTY_HIERARCHY_RANK_PRESETS,
} from "@mms/shared";

export interface FacultyHierarchyFormFieldsProps {
  teacherDraft: Partial<Teacher>;
  errors: Record<string, string>;
  isFieldEnabled: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
  onDraftChange: (patch: Partial<Teacher>) => void;
  supervisorCandidates?: Faculty[];
  hierarchyRankPresets?: readonly FacultyHierarchyPreset[];
}

export function FacultyHierarchyFormFields({
  teacherDraft,
  errors,
  isFieldEnabled,
  isFieldRequired,
  onDraftChange,
  supervisorCandidates,
  hierarchyRankPresets,
}: FacultyHierarchyFormFieldsProps): React.JSX.Element {
  const { t } = useTranslation();
  const showDepartment = isFieldEnabled("department");
  const showHierarchyRank = isFieldEnabled("hierarchyRank");
  const showSupervisor = isFieldEnabled("reportingFacultyId");

  return (
    <>
      {showDepartment && (
        <Field
          label={t("teachers.form.department")}
          id="department"
          required={isFieldRequired("department")}
          error={errors.department}
        >
          <Input
            id="department"
            name="department"
            value={teacherDraft.department ?? ""}
            onChange={(e) => onDraftChange({ department: e.target.value })}
            placeholder={t("teachers.form.departmentPlaceholder")}
            className={cn(FORM_INPUT, errors.department && FORM_INPUT_ERROR)}
          />
        </Field>
      )}

      {showHierarchyRank && (
        <Field
          label={t("teachers.form.hierarchyRank")}
          id="hierarchyRank"
          required={isFieldRequired("hierarchyRank")}
          error={errors.hierarchyRank}
        >
          <FormSelect
            id="hierarchyRank"
            name="hierarchyRank"
            value={String(teacherDraft.hierarchyRank ?? 4)}
            onChange={(val) => {
              const rankNum = Number(val) || 4;
              onDraftChange({
                hierarchyRank: rankNum,
                ...(rankNum === 1 ? { reportingFacultyId: null } : {}),
              });
            }}
            options={(hierarchyRankPresets || FACULTY_HIERARCHY_RANK_PRESETS).map((p) => ({
              value: String(p.rank),
              label: `Rank ${p.rank} — ${p.label}`,
            }))}
          />
        </Field>
      )}

      {showSupervisor && (
        <Field
          label={t("teachers.form.reportingSupervisor")}
          id="reportingFacultyId"
          required={isFieldRequired("reportingFacultyId")}
          error={errors.reportingFacultyId}
        >
          <FormSelect
            id="reportingFacultyId"
            name="reportingFacultyId"
            value={teacherDraft.reportingFacultyId ? String(teacherDraft.reportingFacultyId) : ""}
            disabled={teacherDraft.hierarchyRank === 1}
            onChange={(val) => onDraftChange({ reportingFacultyId: val || null })}
            options={[
              { value: "", label: t("teachers.form.noSupervisor") },
              ...(supervisorCandidates || []).map((cand) => ({
                value: String(cand.id),
                label: `${cand.name || cand.employeeId || "Faculty"} (Rank ${cand.hierarchyRank ?? 4}${cand.designation ? ` · ${cand.designation}` : ""})`,
              })),
            ]}
          />
          {teacherDraft.hierarchyRank === 1 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("teachers.form.topLevelRankNotice")}
            </p>
          )}
        </Field>
      )}
    </>
  );
}
