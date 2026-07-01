import { useQuery } from "@tanstack/react-query";
import type { PublicWorkspaceSummary, WorkspaceRegistryResponse } from "@mms/shared";
import { apiJson } from "@/lib/apiClient";
import { useTenant } from "@/lib/contexts/TenantContext";

export const WORKSPACE_REGISTRY_QUERY_KEY = ["workspace", "registry"] as const;

async function fetchWorkspaceRegistry(): Promise<PublicWorkspaceSummary[]> {
  const registryResponse = await apiJson<WorkspaceRegistryResponse>("/api/workspace/registry");
  return registryResponse.workspaces;
}

/** Apex-only list of registered madrasa workspaces (TanStack Query). */
export function useWorkspaceRegistry(options?: { enabled?: boolean }) {
  const { isApex } = useTenant();

  return useQuery({
    queryKey: WORKSPACE_REGISTRY_QUERY_KEY,
    queryFn: fetchWorkspaceRegistry,
    enabled: options?.enabled ?? isApex,
    staleTime: 60_000,
  });
}
