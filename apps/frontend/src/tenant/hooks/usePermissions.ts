import { useCallback, useMemo } from "react";
import { roleHasPermission, type Permission } from "@mms/shared";
import { useAuth } from "@/lib/contexts/AuthContext";

export interface UsePermissionsResult {
  role: string | undefined;
  can: (permission: Permission) => boolean;
}

/** Centralised RBAC hook — delegates to `@mms/shared` role matrix. */
export function usePermissions(): UsePermissionsResult {
  const { user } = useAuth();
  const role = user?.role;

  const can = useCallback(
    (permission: Permission) => roleHasPermission(role, permission),
    [role],
  );

  return useMemo(() => ({ role, can }), [role, can]);
}

export interface ModulePermissionsContract {
  permissions: {
    read?: Permission;
    write?: Permission;
    delete?: Permission;
    export?: Permission;
    reports?: Permission;
    setupView?: Permission;
    setupWrite?: Permission;
  };
}

/** Resolves all standard tier & action permissions for a module contract (Rule 11 / DRY). */
export function useModulePermissions(contract: ModulePermissionsContract) {
  const { can } = usePermissions();
  return useMemo(() => {
    const p = contract.permissions;
    return {
      canRead: p.read ? can(p.read) : false,
      canWrite: p.write ? can(p.write) : false,
      canDelete: p.delete ? can(p.delete) : false,
      canExport: p.export ? can(p.export) : false,
      canReports: p.reports ? can(p.reports) : false,
      canViewSetup: p.setupView ? (can(p.setupView) || (p.setupWrite ? can(p.setupWrite) : false)) : false,
      canEditSetup: p.setupWrite ? can(p.setupWrite) : false,
    };
  }, [can, contract.permissions]);
}

