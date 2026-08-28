import { useQueryClient } from "@tanstack/react-query";
import { tsrClient } from "@/lib/api";
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

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const query = tsrClient.platform.getSetupStatus.useQuery({
    queryKey: PLATFORM_SETUP_STATUS_QUERY_KEY,
    queryData: {},
    enabled: isApex,
    staleTime: 60_000,
    retry: 5,
    retryDelay: (attempt: number) => Math.min(attempt * 1000, 5000),
  });

  const rawData = query.data;
  const setupStatus: PlatformSetupStatus | undefined =
    rawData && typeof rawData === 'object' && 'body' in rawData && rawData.body && typeof rawData.body === 'object'
      ? (rawData.body as PlatformSetupStatus)
      : undefined;

  return {
    setupStatus,
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
