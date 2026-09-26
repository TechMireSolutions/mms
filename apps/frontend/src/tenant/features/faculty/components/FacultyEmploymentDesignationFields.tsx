import type React from "react";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { useTranslation } from "@/hooks/useTranslation";
import type { FacultyDesignationDefinition, Teacher } from "@mms/shared";

export interface FacultyEmploymentDesignationFieldsProps {
  teacher?: Teacher;
  teacherDraft: Partial<Teacher>;
  errors: Record<string, string>;
  designationOptions?: FacultyDesignationDefinition[];
  designationLabel: string;
  isFieldRequired: (fieldId: string) => boolean;
  onDraftChange: (patch: Partial<Teacher>) => void;
}

export function FacultyEmploymentDesignationFields({
  teacher,
  teacherDraft,
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
          value={teacherDraft.designationId || ""}
          placeholder={t("faculty.designations.selectPlaceholder")}
          disabled={Boolean(teacher?.id)}
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
            .filter((item) => item.isActive || item.id === teacherDraft.designationId)
            .map((item) => ({ value: item.id, label: item.name }))}
        />
        {teacher?.id ? (
          <p className="mt-1 text-xs text-muted-foreground">{t("faculty.designations.manageInHistory")}</p>
        ) : !teacherDraft.designationId && teacherDraft.designation ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {t("faculty.designations.current")}: {teacherDraft.designation}
          </p>
        ) : null}
      </Field>
      {!teacher?.id ? (
        <Field label={t("faculty.designations.startsOn")} id="designationStartsOn" required error={errors.designationStartsOn}>
          <DatePicker
            id="designationStartsOn"
            name="designationStartsOn"
            value={teacherDraft.designationStartsOn || undefined}
            onChange={(dateStr) => onDraftChange({ designationStartsOn: dateStr })}
          />
        </Field>
      ) : null}
    </div>
  );
}
