import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { PlatformSetupStatus } from "@mms/shared";
import { apiJson } from "@/lib/apiClient";
import { useTenant } from "@/lib/contexts/TenantContext";

export const PLATFORM_SETUP_STATUS_QUERY_KEY = ["platform", "setup", "status"] as const;

async function fetchPlatformSetupStatus(): Promise<PlatformSetupStatus> {
  return apiJson<PlatformSetupStatus>("/api/platform/auth/setup/status");
}

/** First-run platform super-user setup status (apex only). */
export function usePlatformSetupStatus(): {
  setupStatus: PlatformSetupStatus | undefined;
  isLoadingSetup: boolean;
} {
  const { isApex } = useTenant();

  const query = useQuery({
    queryKey: PLATFORM_SETUP_STATUS_QUERY_KEY,
    queryFn: fetchPlatformSetupStatus,
    enabled: isApex,
    staleTime: 60_000,
  });

  return {
    setupStatus: query.data,
    isLoadingSetup: isApex && query.isLoading,
  };
}

export function useInvalidatePlatformSetupStatus(): () => void {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: PLATFORM_SETUP_STATUS_QUERY_KEY });
  };
}
