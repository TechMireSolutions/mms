import React, { useMemo } from "react";
import { Info } from "lucide-react";
import type { FacultyDesignationDefinition } from "@mms/shared";
import { Field, FormSelectWithQuickCreate } from "@/components/ui/FormPrimitives";
import { useTranslation } from "@/hooks/useTranslation";

export interface FacultyDesignationSelectFieldProps {
  id?: string;
  designationId?: string;
  designationName?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  designationOptions?: FacultyDesignationDefinition[];
  canAdd?: boolean;
  onOpenAdd?: () => void;
  onChange: (patch: {
    designationId: string;
    designation: string;
    designationAssignableRoles?: string[];
  }) => void;
}

export function FacultyDesignationSelectField({
  id = "designationId",
  designationId,
  designationName,
  error,
  required,
  disabled,
  designationOptions = [],
  canAdd = false,
  onOpenAdd,
  onChange,
}: FacultyDesignationSelectFieldProps): React.JSX.Element {
  const { t } = useTranslation();

  const activeOptions = useMemo(
    () => designationOptions.filter((item) => item.isActive || item.id === designationId),
    [designationOptions, designationId],
  );

  return (
    <Field
      label={t("faculty.field.designation")}
      id={id}
      required={required}
      error={error}
    >
      <FormSelectWithQuickCreate
        id={id}
        name={id}
        value={designationId || ""}
        placeholder={t("faculty.designations.selectPlaceholder")}
        disabled={disabled}
        canAdd={canAdd}
        onOpenAdd={onOpenAdd}
        addAriaLabel={t("faculty.designations.addDesignation")}
        onChange={(value) => {
          const def = designationOptions.find((item) => item.id === value);
          onChange({
            designationId: value,
            designation: def?.name ?? "",
            designationAssignableRoles: def?.assignableRoles ?? [],
          });
        }}
        options={activeOptions.map((item) => ({ value: item.id, label: item.name }))}
      />
      {activeOptions.length === 0 ? (
        <p role="status" className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3.5 shrink-0" aria-hidden />
          {t("faculty.designations.empty")}
        </p>
      ) : null}
      {!designationId && designationName ? (
        <p className="mt-1 text-xs text-muted-foreground">
          {t("faculty.designations.current")}: {designationName}
        </p>
      ) : null}
    </Field>
  );
}
