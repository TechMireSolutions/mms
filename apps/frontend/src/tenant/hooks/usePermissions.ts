import { useCallback, useMemo } from "react";
import {
  getPermissionsForRole,
  hasAllPermissions,
  hasAnyPermission,
  roleHasPermission,
  type Permission,
} from "@mms/shared";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useWorkspaceRoles } from "@/tenant/hooks/useWorkspaceRoles";

export interface UsePermissionsResult {
  role: string | undefined;
  can: (permission: Permission) => boolean;
  canAny: (...permissions: readonly Permission[]) => boolean;
  canAll: (...permissions: readonly Permission[]) => boolean;
  isAdmin: boolean;
  permissions: readonly Permission[];
}

/** Centralised RBAC hook — delegates to `@mms/shared` dynamic role matrix. */
export function usePermissions(): UsePermissionsResult {
  const { user } = useAuth();
  const workspaceRoles = useWorkspaceRoles();
  const role = user?.role;

  const can = useCallback(
    (permission: Permission) => roleHasPermission(role, permission, workspaceRoles),
    [role, workspaceRoles],
  );

  const canAny = useCallback(
    (...permissions: readonly Permission[]) => hasAnyPermission(role, permissions, workspaceRoles),
    [role, workspaceRoles],
  );

  const canAll = useCallback(
    (...permissions: readonly Permission[]) => hasAllPermissions(role, permissions, workspaceRoles),
    [role, workspaceRoles],
  );

  const permissions = useMemo(
    () => getPermissionsForRole(role, workspaceRoles),
    [role, workspaceRoles],
  );

  const isAdmin = useMemo(() => {
    const normalized = (role ?? "").trim().toLowerCase();
    return normalized === "admin" || normalized === "super_admin" || can("users.manage");
  }, [role, can]);

  return {
    role,
    can,
    canAny,
    canAll,
    isAdmin,
    permissions,
  };
}

export interface ModulePermissionsManifest {
  permissions: {
    read?: Permission;
    write?: Permission;
    delete?: Permission;
    export?: Permission;
    reports?: Permission;
    setupView?: Permission;
    setupWrite?: Permission;
    clearLogs?: Permission;
  };
}

export interface UseModulePermissionsResult {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canExport: boolean;
  canReports: boolean;
  canViewSetup: boolean;
  canEditSetup: boolean;
  canClearLogs: boolean;
}

/** Resolves all standard tier & action permissions for a module manifest (Rule 11 / DRY). */
export function useModulePermissions(manifest: ModulePermissionsManifest): UseModulePermissionsResult {
  const { can } = usePermissions();
  const p = manifest.permissions;

  return {
    canRead: p.read ? can(p.read) : false,
    canWrite: p.write ? can(p.write) : false,
    canDelete: p.delete ? can(p.delete) : false,
    canExport: p.export ? can(p.export) : false,
    canReports: p.reports ? can(p.reports) : false,
    canViewSetup: p.setupView ? (can(p.setupView) || (p.setupWrite ? can(p.setupWrite) : false)) : false,
    canEditSetup: p.setupWrite ? can(p.setupWrite) : false,
    canClearLogs: p.clearLogs ? can(p.clearLogs) : false,
  };
}


