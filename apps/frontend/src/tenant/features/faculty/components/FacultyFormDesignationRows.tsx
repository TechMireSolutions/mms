import type React from "react";
import { Award } from "lucide-react";
import type { FacultyDepartmentEntity, FacultyDesignationDefinition } from "@mms/shared";
import { DatePicker } from "@/components/ui/DatePicker";
import {
  Field,
  FormCardTypeSelect,
  FormListFieldCard,
  FormSelect,
  FormSelectWithQuickCreate,
  TYPE_SELECT_WIDTH,
} from "@/components/ui/FormPrimitives";
import { useTranslation } from "@/hooks/useTranslation";
import { FacultyDepartmentSelectField } from "./FacultyDepartmentSelectField";
import { FacultyDesignationSelectField } from "./FacultyDesignationSelectField";
import type { FacultyDesignationDraftRow } from "./facultyFormDesignationDraft";

export interface FacultyFormDesignationRowsProps {
  rows: FacultyDesignationDraftRow[];
  designationOptions: FacultyDesignationDefinition[];
  departmentOptions?: string[];
  departmentEntities?: FacultyDepartmentEntity[];
  legacyDesignationName?: string;
  errors: Record<string, string>;
  requiredFirst: boolean;
  showDepartment: boolean;
  departmentRequired: boolean;
  disabled: boolean;
  positionOptions?: Array<{ value: string; label: string }>;
  requiresPosition?: boolean;
  canAddCatalog?: boolean;
  onOpenAddDepartment?: (rowKey: string) => void;
  onOpenAddDesignation?: (rowKey: string) => void;
  onOpenAddPosition?: (rowKey: string) => void;
  onChangeRows: (rows: FacultyDesignationDraftRow[]) => void;
}

export function FacultyFormDesignationRows({
  rows,
  designationOptions,
  departmentOptions,
  departmentEntities,
  legacyDesignationName,
  errors,
  requiredFirst,
  showDepartment,
  departmentRequired,
  disabled,
  positionOptions = [],
  requiresPosition = false,
  canAddCatalog = false,
  onOpenAddDepartment,
  onOpenAddDesignation,
  onOpenAddPosition,
  onChangeRows,
}: FacultyFormDesignationRowsProps): React.JSX.Element {
  const { t } = useTranslation();
  const statusOptions = [
    { value: "active", label: t("faculty.designations.statusActive") },
    { value: "inactive", label: t("faculty.designations.statusInactive") },
  ];

  const patchRow = (key: string, patch: Partial<FacultyDesignationDraftRow>) => {
    onChangeRows(
      rows.map((candidate) => (candidate.key === key ? { ...candidate, ...patch } : candidate)),
    );
  };

  return (
    <>
      {disabled ? (
        <p className="text-xs text-muted-foreground">{t("faculty.designations.manageInHistory")}</p>
      ) : null}

      {rows.map((row, index) => {
        const startsId = `designation-startsOn-${row.key}`;
        const endsId = `designation-endsOn-${row.key}`;
        const statusId = `designation-status-${row.key}`;
        const deptFieldId = `department-${row.key}`;
        const desigFieldId = `designationId-${row.key}`;

        return (
          <FormListFieldCard
            key={row.key}
            id={`faculty-designation-${row.key}`}
            index={index}
            icon={Award}
            label={undefined}
            typeSelect={(
              <FormCardTypeSelect label={t("faculty.designations.holdingStatus")}>
                <FormSelect
                  id={statusId}
                  value={row.status}
                  disabled={disabled}
                  className={TYPE_SELECT_WIDTH}
                  onChange={(value) => {
                    patchRow(row.key, { status: value === "inactive" ? "inactive" : "active" });
                  }}
                  options={statusOptions}
                />
              </FormCardTypeSelect>
            )}
            removeLabel={t("faculty.designations.removeRow")}
            canRemove={!disabled && rows.length > 1}
            onRemove={
              disabled
                ? undefined
                : () => onChangeRows(rows.filter((candidate) => candidate.key !== row.key))
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
              {showDepartment ? (
                <FacultyDepartmentSelectField
                  id={deptFieldId}
                  value={row.department}
                  departmentId={row.departmentId || undefined}
                  error={
                    index === 0
                      ? (errors.department || errors.departmentId || errors[`designations.${index}.departmentId`])
                      : errors[`designations.${index}.departmentId`]
                  }
                  required={index === 0 && departmentRequired}
                  disabled={disabled}
                  canAdd={canAddCatalog}
                  onOpenAdd={
                    onOpenAddDepartment ? () => onOpenAddDepartment(row.key) : undefined
                  }
                  departmentOptions={departmentOptions}
                  departmentEntities={departmentEntities}
                  onChange={(patch) => {
                    patchRow(row.key, {
                      department: patch.department,
                      departmentId: patch.departmentId ?? "",
                    });
                  }}
                />
              ) : null}

              <FacultyDesignationSelectField
                id={desigFieldId}
                designationId={row.designationId}
                designationName={
                  designationOptions.find((item) => item.id === row.designationId)?.name
                  ?? (index === 0 ? legacyDesignationName : undefined)
                }
                error={
                  index === 0
                    ? (errors.designationId || errors.designation || errors[`designations.${index}.designationId`])
                    : errors[`designations.${index}.designationId`]
                }
                required={index === 0 && requiredFirst}
                disabled={disabled}
                canAdd={canAddCatalog}
                onOpenAdd={
                  onOpenAddDesignation ? () => onOpenAddDesignation(row.key) : undefined
                }
                designationOptions={designationOptions}
                onChange={(patch) => {
                  patchRow(row.key, { designationId: patch.designationId, positionId: "" });
                }}
              />

              {!disabled && (requiresPosition || positionOptions.length > 0) && index === 0 ? (
                <Field
                  id={`position-${row.key}`}
                  label={t("faculty.assignments.position")}
                  required={requiresPosition}
                  error={errors.positionId || errors[`designations.${index}.positionId`]}
                >
                  <FormSelectWithQuickCreate
                    id={`position-${row.key}`}
                    value={row.positionId}
                    onChange={(value) => patchRow(row.key, { positionId: value })}
                    options={positionOptions}
                    canAdd={canAddCatalog}
                    onOpenAdd={onOpenAddPosition ? () => onOpenAddPosition(row.key) : undefined}
                    addAriaLabel={t("faculty.assignments.position")}
                  />
                </Field>
              ) : null}

              <Field
                label={t("faculty.designations.startsOn")}
                id={startsId}
                required={index === 0 && requiredFirst}
                error={
                  index === 0
                    ? (errors.designationStartsOn || errors[`designations.${index}.startsOn`])
                    : errors[`designations.${index}.startsOn`]
                }
              >
                <DatePicker
                  id={startsId}
                  name={startsId}
                  value={row.startsOn || undefined}
                  disabled={disabled}
                  onChange={(dateStr) => patchRow(row.key, { startsOn: dateStr })}
                />
              </Field>

              <Field
                label={t("faculty.designations.endsOn")}
                id={endsId}
                error={
                  index === 0
                    ? (errors.designationEndsOn || errors[`designations.${index}.endsOn`])
                    : errors[`designations.${index}.endsOn`]
                }
              >
                <DatePicker
                  id={endsId}
                  name={endsId}
                  value={row.endsOn || undefined}
                  min={row.startsOn || undefined}
                  disabled={disabled}
                  onChange={(dateStr) => patchRow(row.key, { endsOn: dateStr || "" })}
                />
              </Field>
            </div>
          </FormListFieldCard>
        );
      })}
    </>
  );
}
