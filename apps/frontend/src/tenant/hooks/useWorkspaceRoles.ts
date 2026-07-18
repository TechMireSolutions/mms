import { useMemo } from "react";
import {
  cloneDefaultWorkspaceRoles,
  type WorkspaceRole,
} from "@mms/shared";
import { useUsersConfig } from "@/hooks/useStandardModuleConfig";

/** Live workspace roles from `users_settings` (system + custom). */
export function useWorkspaceRoles(): WorkspaceRole[] {
  const { settings } = useUsersConfig();

  const roles = useMemo(() => {
    if (settings.workspaceRoles?.length) {
      return settings.workspaceRoles.map((r) => ({
        ...r,
        permissions: structuredClone(r.permissions),
      }));
    }
    return cloneDefaultWorkspaceRoles();
  }, [settings.workspaceRoles]);

  return roles;
}
