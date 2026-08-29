import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiJson } from "@/lib/apiClient";
import type { PlatformSetupStatus } from "@mms/shared";
import { useTenant } from "@/lib/contexts/TenantContext";

export const PLATFORM_SETUP_STATUS_QUERY_KEY = ["platform", "setup", "status"] as const;

/** First-run platform super-user setup status (apex only). */
export function usePlatformSetupStatus(): {
  setupStatus: PlatformSetupStatus | undefined;
  isLoadingSetup: boolean;
  isError: boolean;
  refetch: () => Promise<unknown>;
} {
  const { isApex } = useTenant();

  const query = useQuery({
    queryKey: PLATFORM_SETUP_STATUS_QUERY_KEY,
    queryFn: async ({ signal }) => {
      return await apiJson<PlatformSetupStatus>('/api/platform/auth/setup/status', {
        signal,
      });
    },
    enabled: isApex,
    staleTime: 60_000,
    retry: 5,
    retryDelay: (attempt: number) => Math.min(attempt * 1000, 5000),
  });

  return {
    setupStatus: query.data,
    isLoadingSetup: isApex && query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useInvalidatePlatformSetupStatus(): () => void {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: PLATFORM_SETUP_STATUS_QUERY_KEY });
  };
}
