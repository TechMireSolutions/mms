import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Award } from "lucide-react";
import { FormCollectionShell } from "@/components/ui/FormPrimitives";
import { WarningCallout } from "@/components/ui/WarningCallout";
import { useTranslation } from "@/hooks/useTranslation";
import {
  type FacultyDepartmentEntity,
  type FacultyDesignationDefinition,
  type FacultyMember,
} from "@mms/shared";
import { useOrganizationPositions } from "@/tenant/hooks/collections/organization";
import { FacultyDepartmentSelectField } from "./FacultyDepartmentSelectField";
import { FacultyFormDesignationOverlays } from "./FacultyFormDesignationOverlays";
import { FacultyFormDesignationRoles } from "./FacultyFormDesignationRoles";
import { FacultyFormDesignationRows } from "./FacultyFormDesignationRows";
import { FacultyFormDesignationSummary } from "./FacultyFormDesignationSummary";
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
  const catalogCreate = useFacultyFormCatalogQuickCreate();
  const { data: positions = [] } = useOrganizationPositions();
  const [createPositionOpen, setCreatePositionOpen] = useState(false);
  const [positionRowKey, setPositionRowKey] = useState<string | null>(null);

  const showDesignation = isFieldEnabled("designation") || isFieldEnabled("designationId");
  const showDepartment = isFieldEnabled("department") || isFieldEnabled("departmentId");
  const [rows, setRows] = useState<FacultyDesignationDraftRow[]>(() =>
    getInitialDesignationRows(faculty ?? facultyDraft),
  );

  useEffect(() => {
    setRows(getInitialDesignationRows(faculty ?? facultyDraft));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- draft identity changes every keystroke
  }, [faculty?.id]);

  const positionOptions = useMemo(() => {
    const deptId = rows[0]?.departmentId;
    const desigId = rows[0]?.designationId;
    return positions
      .filter((p) => p.isActive !== false)
      .filter((p) => !deptId || !p.departmentId || p.departmentId === deptId)
      .filter((p) => !desigId || !p.designationId || p.designationId === desigId)
      .map((p) => ({ value: p.id, label: `${p.name} (${p.code})` }));
  }, [positions, rows]);
  const requiresPosition = !isExisting && positions.some((p) => p.isActive !== false);

  if (!showDesignation && !showDepartment) return null;

  if (isExisting && showDesignation) {
    return (
      <FacultyFormDesignationSummary
        facultyDraft={facultyDraft}
        designationOptions={designationOptions}
        showCollectionTitle={showCollectionTitle}
      />
    );
  }

  const commitRows = (nextRows: FacultyDesignationDraftRow[]) => {
    setRows(nextRows);
    onDraftChange(syncPrimaryDesignationPatch(nextRows, { designationOptions, departmentEntities }));
  };
  const patchRowByKey = (rowKey: string | null, patch: Partial<FacultyDesignationDraftRow>) => {
    if (!rowKey) {
      if (!rows[0]) return;
      commitRows(rows.map((row, i) => (i === 0 ? { ...row, ...patch } : row)));
      return;
    }
    commitRows(rows.map((row) => (row.key === rowKey ? { ...row, ...patch } : row)));
  };

  const assignableRoles = [...new Set(
    rows.flatMap((row) => {
      if (row.status !== "active" || !row.designationId) return [];
      return designationOptions.find((item) => item.id === row.designationId)?.assignableRoles ?? [];
    }),
  )];

  const overlays = (
    <FacultyFormDesignationOverlays
      catalogCreate={catalogCreate}
      showDesignation={showDesignation}
      createPositionOpen={createPositionOpen}
      positionRowKey={positionRowKey}
      onClosePosition={() => setCreatePositionOpen(false)}
      onDraftChange={onDraftChange}
      patchRowByKey={patchRowByKey}
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
          {isExisting ? (
            <WarningCallout tone="info" density="compact" description={t("faculty.form.primaryRoleAssignmentsHint")} />
          ) : null}
          <FacultyDepartmentSelectField
            value={facultyDraft.department ?? ""}
            departmentId={typeof facultyDraft.departmentId === "string" ? facultyDraft.departmentId : undefined}
            error={errors.department || errors.departmentId}
            required={isFieldRequired("department") || isFieldRequired("departmentId")}
            disabled={isExisting}
            departmentOptions={departmentOptions}
            departmentEntities={departmentEntities}
            canAdd={!isExisting}
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
          allowAdd
          listKey="faculty-des-new"
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
            disabled={false}
            positionOptions={positionOptions}
            requiresPosition={requiresPosition}
            canAddCatalog
            onOpenAddDepartment={catalogCreate.openCreateDepartment}
            onOpenAddDesignation={catalogCreate.openCreateDesignation}
            onOpenAddPosition={(rowKey) => {
              setPositionRowKey(rowKey);
              setCreatePositionOpen(true);
            }}
            onChangeRows={commitRows}
          />
        </FormCollectionShell>
        <FacultyFormDesignationRoles
          assignableRoles={assignableRoles}
          hasDesignation={rows.some((row) => row.designationId)}
        />
      </div>
      {overlays}
    </>
  );
}
