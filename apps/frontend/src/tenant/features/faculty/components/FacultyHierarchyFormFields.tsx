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
}: FacultyHierarchyFormFieldsProps): React.JSX.Element {
  const { t } = useTranslation();
  const showDepartment = isFieldEnabled("department");
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
