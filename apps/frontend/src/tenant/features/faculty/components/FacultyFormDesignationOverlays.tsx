/**
 * @file FacultyFormDesignationOverlays.tsx
 * @description Catalog + position create overlays for the faculty designation form section.
 */

import { OrganizationPositionFormModal } from "@/tenant/components/organization/OrganizationPositionFormModal";
import { FacultyCatalogCreateOverlays } from "./FacultyCatalogCreateOverlays";
import type { FacultyDesignationDraftRow } from "./facultyFormDesignationDraft";
import type { useFacultyFormCatalogQuickCreate } from "../hooks/useFacultyFormCatalogQuickCreate";

type CatalogCreate = ReturnType<typeof useFacultyFormCatalogQuickCreate>;

export function FacultyFormDesignationOverlays({
  catalogCreate,
  showDesignation,
  createPositionOpen,
  positionRowKey,
  onClosePosition,
  onDraftChange,
  patchRowByKey,
}: {
  catalogCreate: CatalogCreate;
  showDesignation: boolean;
  createPositionOpen: boolean;
  positionRowKey: string | null;
  onClosePosition: () => void;
  onDraftChange: (patch: Record<string, string>) => void;
  patchRowByKey: (rowKey: string | null, patch: Partial<FacultyDesignationDraftRow>) => void;
}): React.JSX.Element {
  return (
    <>
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
            patchRowByKey(rowKey, { ...patch, positionId: "" });
          });
        }}
        onDesignationCreated={(designation) => {
          catalogCreate.applyDesignationCreated(designation, (rowKey, patch) => {
            patchRowByKey(rowKey, { designationId: patch.designationId, positionId: "" });
          });
        }}
      />
      <OrganizationPositionFormModal
        open={createPositionOpen}
        onClose={onClosePosition}
        onCreated={(positionId) => {
          patchRowByKey(positionRowKey, { positionId });
        }}
      />
    </>
  );
}
