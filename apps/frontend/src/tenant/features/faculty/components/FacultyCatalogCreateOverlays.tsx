import React from "react";
import type { FacultyDepartmentEntity, FacultyDesignationDefinition } from "@mms/shared";
import { notify } from "@/lib/notify";
import { useTranslation } from "@/hooks/useTranslation";
import { FacultyDepartmentFormModal } from "@/tenant/features/faculty/components/FacultyDepartmentFormModal";
import { FacultyDesignationFormModal } from "@/tenant/features/faculty/components/FacultyDesignationFormModal";
import { useFacultyDepartmentsController } from "@/tenant/features/faculty/hooks/useFacultyDepartmentsController";
import { useSaveFacultyDepartment } from "@/tenant/features/faculty/hooks/useFacultyDepartments";
import {
  useFacultyDesignations,
  useSaveFacultyDesignation,
} from "@/tenant/features/faculty/hooks/useFacultyDesignations";
import { useWorkspaceRoles } from "@/tenant/hooks/useWorkspaceRoles";

export interface FacultyCatalogCreateOverlaysProps {
  createDepartmentOpen: boolean;
  onCloseDepartment: () => void;
  createDesignationOpen: boolean;
  onCloseDesignation: () => void;
  /** Called with the saved entity after a successful create (before close). */
  onDepartmentCreated?: (department: FacultyDepartmentEntity) => void;
  onDesignationCreated?: (designation: FacultyDesignationDefinition) => void;
}

/** Page-header / in-form create modals for department / designation catalogs. */
export function FacultyCatalogCreateOverlays({
  createDepartmentOpen,
  onCloseDepartment,
  createDesignationOpen,
  onCloseDesignation,
  onDepartmentCreated,
  onDesignationCreated,
}: FacultyCatalogCreateOverlaysProps): React.JSX.Element {
  const { t } = useTranslation();
  const { departments, parentOptions } = useFacultyDepartmentsController();
  const saveDept = useSaveFacultyDepartment();
  const designationsQuery = useFacultyDesignations();
  const saveDesig = useSaveFacultyDesignation();
  const workspaceRoles = useWorkspaceRoles();

  return (
    <>
      <FacultyDepartmentFormModal
        open={createDepartmentOpen}
        onClose={onCloseDepartment}
        department={null}
        parentOptions={parentOptions}
        existingDepartments={departments}
        isPending={saveDept.isPending}
        onSave={async (payload) => {
          try {
            const saved = await saveDept.mutateAsync({
              id: payload.id || crypto.randomUUID(),
              name: payload.name,
              code: payload.code,
              parentId: payload.parentId,
              isActive: payload.isActive,
            });
            notify.success(t("faculty.setup.departmentSaved"));
            onDepartmentCreated?.(saved);
            onCloseDepartment();
          } catch {
            notify.error(t("faculty.setup.lookupsSaveFailed"));
          }
        }}
      />

      <FacultyDesignationFormModal
        open={createDesignationOpen}
        onClose={onCloseDesignation}
        designation={null}
        workspaceRoles={workspaceRoles}
        designationOptions={designationsQuery.data ?? []}
        isPending={saveDesig.isPending}
        onSave={async (payload) => {
          try {
            const saved = await saveDesig.mutateAsync({
              ...payload,
              id: payload.id || crypto.randomUUID(),
            });
            notify.success(t("faculty.designations.saved"));
            onDesignationCreated?.(saved);
            onCloseDesignation();
          } catch {
            notify.error(t("faculty.setup.lookupsSaveFailed"));
          }
        }}
      />
    </>
  );
}
