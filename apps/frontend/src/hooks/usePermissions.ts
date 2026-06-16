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

export default usePermissions;
