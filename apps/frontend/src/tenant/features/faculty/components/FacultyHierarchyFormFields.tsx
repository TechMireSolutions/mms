import type React from "react";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { FORM_INPUT, FORM_INPUT_ERROR } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import {
  type Faculty,
  type FacultyMember,
  type FacultyHierarchyPreset,
} from "@mms/shared";

export interface FacultyHierarchyFormFieldsProps {
  facultyDraft?: Partial<FacultyMember>;
  errors: Record<string, string>;
  isFieldEnabled: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
  onDraftChange: (patch: Partial<FacultyMember>) => void;
  supervisorCandidates?: Faculty[];
  hierarchyRankPresets?: readonly FacultyHierarchyPreset[];
}

export function FacultyHierarchyFormFields({
  facultyDraft = {},
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
          label={t("faculty.form.department")}
          id="department"
          required={isFieldRequired("department")}
          error={errors.department}
        >
          <Input
            id="department"
            name="department"
            value={facultyDraft.department ?? ""}
            onChange={(e) => onDraftChange({ department: e.target.value })}
            placeholder={t("faculty.form.departmentPlaceholder")}
            className={cn(FORM_INPUT, errors.department && FORM_INPUT_ERROR)}
          />
        </Field>
      )}

      {showSupervisor && (
        <Field
          label={t("faculty.form.reportingSupervisor")}
          id="reportingFacultyId"
          required={isFieldRequired("reportingFacultyId")}
          error={errors.reportingFacultyId}
        >
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
          {facultyDraft.hierarchyRank === 1 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("faculty.form.topLevelRankNotice")}
            </p>
          )}
        </Field>
      )}
    </>
  );
}
