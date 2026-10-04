import { useCallback, useRef, useState } from "react";
import type { FacultyDepartmentEntity, FacultyDesignationDefinition } from "@mms/shared";

export type FacultyCatalogQuickCreateKind = "department" | "designation";

export interface FacultyCatalogQuickCreateTarget {
  kind: FacultyCatalogQuickCreateKind;
  rowKey: string | null;
}

/**
 * In-form department/designation quick-create: tracks which holding row
 * requested create and exposes overlay open state + apply helpers.
 */
export function useFacultyFormCatalogQuickCreate() {
  const [createDepartmentOpen, setCreateDepartmentOpen] = useState(false);
  const [createDesignationOpen, setCreateDesignationOpen] = useState(false);
  const pendingRef = useRef<FacultyCatalogQuickCreateTarget | null>(null);

  const openCreateDepartment = useCallback((rowKey: string | null = null) => {
    pendingRef.current = { kind: "department", rowKey };
    setCreateDepartmentOpen(true);
  }, []);

  const openCreateDesignation = useCallback((rowKey: string | null = null) => {
    pendingRef.current = { kind: "designation", rowKey };
    setCreateDesignationOpen(true);
  }, []);

  const closeDepartment = useCallback(() => {
    setCreateDepartmentOpen(false);
    if (pendingRef.current?.kind === "department") pendingRef.current = null;
  }, []);

  const closeDesignation = useCallback(() => {
    setCreateDesignationOpen(false);
    if (pendingRef.current?.kind === "designation") pendingRef.current = null;
  }, []);

  const consumePending = useCallback((): FacultyCatalogQuickCreateTarget | null => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    return pending;
  }, []);

  return {
    createDepartmentOpen,
    createDesignationOpen,
    openCreateDepartment,
    openCreateDesignation,
    closeDepartment,
    closeDesignation,
    consumePending,
    applyDepartmentCreated: (
      department: FacultyDepartmentEntity,
      apply: (rowKey: string | null, patch: { department: string; departmentId: string }) => void,
    ) => {
      const pending = consumePending();
      apply(pending?.rowKey ?? null, {
        department: department.name,
        departmentId: department.id,
      });
    },
    applyDesignationCreated: (
      designation: FacultyDesignationDefinition,
      apply: (
        rowKey: string | null,
        patch: {
          designationId: string;
          designation: string;
          designationAssignableRoles: string[];
        },
      ) => void,
    ) => {
      const pending = consumePending();
      apply(pending?.rowKey ?? null, {
        designationId: designation.id,
        designation: designation.name,
        designationAssignableRoles: designation.assignableRoles ?? [],
      });
    },
  };
}
