import type { PublicWorkspaceSummary } from "@mms/shared";
import { tsrClient } from "@/lib/api";
import { useTenant } from "@/lib/contexts/TenantContext";

export const WORKSPACE_REGISTRY_QUERY_KEY = ["workspace", "registry"] as const;

/** Apex-only list of registered madrasa workspaces (TanStack Query). */
export function useWorkspaceRegistry(options?: { enabled?: boolean }): { data: PublicWorkspaceSummary[] | undefined; isLoading: boolean; isError: boolean; refetch: () => Promise<unknown> } {
  const { isApex } = useTenant();

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const { data: rawData, ...rest } = tsrClient.workspace.registry.useQuery({
    queryKey: WORKSPACE_REGISTRY_QUERY_KEY,
    queryData: {},
    enabled: options?.enabled ?? isApex,
    staleTime: 60_000,
  });

  const data: PublicWorkspaceSummary[] | undefined = (rawData?.body as any)?.workspaces;

  return { ...rest, data };
}
