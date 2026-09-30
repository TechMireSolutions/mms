import type React from "react";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { useTranslation } from "@/hooks/useTranslation";
import type { FacultyDesignationDefinition, FacultyMember } from "@mms/shared";

export interface FacultyEmploymentDesignationFieldsProps {
  faculty?: FacultyMember;
  facultyDraft?: Partial<FacultyMember>;
  errors: Record<string, string>;
  designationOptions?: FacultyDesignationDefinition[];
  designationLabel: string;
  isFieldRequired: (fieldId: string) => boolean;
  onDraftChange: (patch: Partial<FacultyMember>) => void;
}

export function FacultyEmploymentDesignationFields({
  faculty,
  facultyDraft = {},
  errors,
  designationOptions,
  designationLabel,
  isFieldRequired,
  onDraftChange,
}: FacultyEmploymentDesignationFieldsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <Field
        label={designationLabel}
        id="designationId"
        required={isFieldRequired("designation")}
        error={errors.designationId || errors.designation}
      >
        <FormSelect
          id="designationId"
          name="designationId"
          value={facultyDraft.designationId || ""}
          placeholder={t("faculty.designations.selectPlaceholder")}
          disabled={Boolean(faculty?.id)}
          onChange={(value) => {
            const definition = designationOptions?.find((item) => item.id === value);
            onDraftChange({
              designationId: value,
              designation: definition?.name ?? "",
              hierarchyRank: definition?.hierarchyRank,
              designationAssignableRoles: definition?.assignableRoles ?? [],
              ...(definition?.hierarchyRank === 1 ? { reportingFacultyId: null } : {}),
            });
          }}
          options={(designationOptions ?? [])
            .filter((item) => item.isActive || item.id === facultyDraft.designationId)
            .map((item) => ({ value: item.id, label: item.name }))}
        />
        {faculty?.id ? (
          <p className="mt-1 text-xs text-muted-foreground">{t("faculty.designations.manageInHistory")}</p>
        ) : !facultyDraft.designationId && facultyDraft.designation ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {t("faculty.designations.current")}: {facultyDraft.designation}
          </p>
        ) : null}
      </Field>
      {!faculty?.id ? (
        <Field label={t("faculty.designations.startsOn")} id="designationStartsOn" required error={errors.designationStartsOn}>
          <DatePicker
            id="designationStartsOn"
            name="designationStartsOn"
            value={facultyDraft.designationStartsOn || undefined}
            onChange={(dateStr) => onDraftChange({ designationStartsOn: dateStr })}
          />
        </Field>
      ) : null}
    </div>
  );
}
