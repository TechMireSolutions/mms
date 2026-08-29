import { useQuery } from "@tanstack/react-query";
import type { PublicWorkspaceSummary } from "@mms/shared";
import { apiJson } from "@/lib/apiClient";
import { useTenant } from "@/lib/contexts/TenantContext";

export const WORKSPACE_REGISTRY_QUERY_KEY = ["workspace", "registry"] as const;

/** Apex-only list of registered madrasa workspaces (TanStack Query). */
export function useWorkspaceRegistry(options?: { enabled?: boolean }): {
  data: PublicWorkspaceSummary[] | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<unknown>;
} {
  const { isApex } = useTenant();

  const query = useQuery({
    queryKey: WORKSPACE_REGISTRY_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const res = await apiJson<{ workspaces: PublicWorkspaceSummary[] }>('/api/workspaces/registry', {
        signal,
      });
      return res.workspaces;
    },
    enabled: options?.enabled ?? isApex,
    staleTime: 60_000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
