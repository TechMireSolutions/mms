import type { PublicWorkspaceSummary } from "@mms/shared";
import { tsrClient } from "@/lib/api";
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

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const { data: rawData, ...rest } = tsrClient.workspace.registry.useQuery({
    queryKey: WORKSPACE_REGISTRY_QUERY_KEY,
    queryData: {},
    enabled: options?.enabled ?? isApex,
    staleTime: 60_000,
  });

  const responseBody = rawData && typeof rawData === 'object' && 'body' in rawData && rawData.body && typeof rawData.body === 'object' && 'workspaces' in rawData.body
    ? (rawData.body as { workspaces?: PublicWorkspaceSummary[] })
    : undefined;

  const data: PublicWorkspaceSummary[] | undefined = responseBody?.workspaces;

  return { ...rest, data };
}
