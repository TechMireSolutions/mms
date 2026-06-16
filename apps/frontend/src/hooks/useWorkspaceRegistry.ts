import { useQuery } from "@tanstack/react-query";
import type { PublicWorkspaceSummary, WorkspaceRegistryResponse } from "@mms/shared";
import { apiJson } from "@/lib/apiClient";

export const WORKSPACE_REGISTRY_QUERY_KEY = ["workspace", "registry"] as const;

async function fetchWorkspaceRegistry(): Promise<PublicWorkspaceSummary[]> {
  const body = await apiJson<WorkspaceRegistryResponse>("/api/workspace/registry");
  return body.workspaces;
}

/** Apex-only list of registered madrasa workspaces (TanStack Query). */
export function useWorkspaceRegistry() {
  return useQuery({
    queryKey: WORKSPACE_REGISTRY_QUERY_KEY,
    queryFn: fetchWorkspaceRegistry,
    staleTime: 30_000,
  });
}
