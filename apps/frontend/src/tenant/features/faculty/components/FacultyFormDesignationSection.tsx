import type React from "react";
import { useEffect, useState } from "react";
import { Award, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FormCollectionShell } from "@/components/ui/FormPrimitives";
import { useTranslation } from "@/hooks/useTranslation";
import {
  type FacultyDepartmentEntity,
  type FacultyDesignationDefinition,
  type FacultyMember,
} from "@mms/shared";
import { FacultyCatalogCreateOverlays } from "./FacultyCatalogCreateOverlays";
import { FacultyDepartmentSelectField } from "./FacultyDepartmentSelectField";
import { FacultyFormDesignationRows } from "./FacultyFormDesignationRows";
import { useFacultyFormCatalogQuickCreate } from "../hooks/useFacultyFormCatalogQuickCreate";
import {
  createEmptyDesignationRow,
  getInitialDesignationRows,
  syncPrimaryDesignationPatch,
  type FacultyDesignationDraftRow,
} from "./facultyFormDesignationDraft";

export interface FacultyFormDesignationSectionProps {
  faculty?: FacultyMember;
  facultyDraft?: Partial<FacultyMember>;
  errors: Record<string, string>;
  designationOptions?: FacultyDesignationDefinition[];
  departmentOptions?: string[];
  departmentEntities?: FacultyDepartmentEntity[];
  /** True in all-sections layout; false when a FormModal tab already names the area. */
  showCollectionTitle?: boolean;
  isFieldEnabled: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
  onDraftChange: (patch: Partial<FacultyMember>) => void;
}

export function FacultyFormDesignationSection(props: FacultyFormDesignationSectionProps): React.JSX.Element | null {
  const {
    faculty,
    facultyDraft = {},
    errors,
    designationOptions = [],
    departmentOptions,
    departmentEntities,
    showCollectionTitle = false,
    isFieldEnabled,
    isFieldRequired,
    onDraftChange,
  } = props;
  const { t } = useTranslation();
  const isExisting = Boolean(faculty?.id);
  const canAddCatalog = !isExisting;
  const catalogCreate = useFacultyFormCatalogQuickCreate();

  const showDesignation = isFieldEnabled("designation") || isFieldEnabled("designationId");
  const showDepartment = isFieldEnabled("department") || isFieldEnabled("departmentId");

  const [rows, setRows] = useState<FacultyDesignationDraftRow[]>(() =>
    getInitialDesignationRows(faculty ?? facultyDraft),
  );

  useEffect(() => {
    setRows(getInitialDesignationRows(faculty ?? facultyDraft));
    // Re-seed when opening a different faculty record.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- draft identity changes every keystroke
  }, [faculty?.id]);

  if (!showDesignation && !showDepartment) return null;

  const commitRows = (nextRows: FacultyDesignationDraftRow[]) => {
    setRows(nextRows);
    onDraftChange(syncPrimaryDesignationPatch(nextRows, {
      designationOptions,
      departmentEntities,
    }));
  };

  const patchRowByKey = (rowKey: string | null, patch: Partial<FacultyDesignationDraftRow>) => {
    if (!rowKey) {
      const first = rows[0];
      if (!first) return;
      commitRows(rows.map((row, index) => (index === 0 ? { ...row, ...patch } : row)));
      return;
    }
    commitRows(rows.map((row) => (row.key === rowKey ? { ...row, ...patch } : row)));
  };

  const activeRoleSet = new Set<string>();
  for (const row of rows) {
    if (row.status !== "active" || !row.designationId) continue;
    const def = designationOptions.find((item) => item.id === row.designationId);
    for (const role of def?.assignableRoles ?? []) activeRoleSet.add(role);
  }
  const assignableRoles = [...activeRoleSet];

  const overlays = (
    <FacultyCatalogCreateOverlays
      createDepartmentOpen={catalogCreate.createDepartmentOpen}
      onCloseDepartment={catalogCreate.closeDepartment}
      createDesignationOpen={catalogCreate.createDesignationOpen}
      onCloseDesignation={catalogCreate.closeDesignation}
      onDepartmentCreated={(department) => {
        catalogCreate.applyDepartmentCreated(department, (rowKey, patch) => {
          if (!showDesignation) {
            onDraftChange(patch);
            return;
          }
          patchRowByKey(rowKey, patch);
        });
      }}
      onDesignationCreated={(designation) => {
        catalogCreate.applyDesignationCreated(designation, (rowKey, patch) => {
          patchRowByKey(rowKey, {
            designationId: patch.designationId,
          });
        });
      }}
    />
  );

  if (!showDesignation) {
    return (
      <>
        <div className="space-y-3 text-start">
          {showCollectionTitle ? (
            <div className="flex items-center gap-2">
              <Award className="size-4 text-primary" aria-hidden />
              <h3 className="text-sm font-semibold text-foreground">{t("faculty.form.tab.designation")}</h3>
            </div>
          ) : null}
          <FacultyDepartmentSelectField
            value={facultyDraft.department ?? ""}
            departmentId={typeof facultyDraft.departmentId === "string" ? facultyDraft.departmentId : undefined}
            error={errors.department || errors.departmentId}
            required={isFieldRequired("department") || isFieldRequired("departmentId")}
            departmentOptions={departmentOptions}
            departmentEntities={departmentEntities}
            canAdd={canAddCatalog}
            onOpenAdd={() => catalogCreate.openCreateDepartment(null)}
            onChange={onDraftChange}
          />
        </div>
        {overlays}
      </>
    );
  }

  return (
    <>
      <div className="space-y-4 text-start">
        <FormCollectionShell
          title={showCollectionTitle ? t("faculty.form.tab.designation") : undefined}
          icon={showCollectionTitle ? Award : undefined}
          addLabel={t("faculty.designations.addDesignation")}
          onAdd={() => commitRows([...rows, createEmptyDesignationRow()])}
          allowAdd={!isExisting}
          listKey={faculty?.id ? `faculty-des-${faculty.id}` : "faculty-des-new"}
        >
          <FacultyFormDesignationRows
            rows={rows}
            designationOptions={designationOptions}
            departmentOptions={departmentOptions}
            departmentEntities={departmentEntities}
            legacyDesignationName={facultyDraft.designation}
            errors={errors}
            requiredFirst={isFieldRequired("designation") || isFieldRequired("designationId")}
            showDepartment={showDepartment}
            departmentRequired={isFieldRequired("department") || isFieldRequired("departmentId")}
            disabled={isExisting}
            canAddCatalog={canAddCatalog}
            onOpenAddDepartment={catalogCreate.openCreateDepartment}
            onOpenAddDesignation={catalogCreate.openCreateDesignation}
            onChangeRows={commitRows}
          />
        </FormCollectionShell>

        {assignableRoles.length > 0 || rows.some((row) => row.designationId) ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Shield className="size-3.5 text-primary" aria-hidden />
              <span>{t("faculty.designations.roles")}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {assignableRoles.map((role) => (
                <Badge key={role} variant="secondary" className="text-xs font-normal">{role}</Badge>
              ))}
              {!assignableRoles.length && (
                <span className="text-xs text-muted-foreground">{t("faculty.designations.noAssignableRoles")}</span>
              )}
            </div>
          </div>
        ) : null}
      </div>
      {overlays}
    </>
  );
}
