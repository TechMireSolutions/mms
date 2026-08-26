import { tsrClient } from '@/lib/api';
import { usePlatformPermissions } from '@/platform/hooks/usePlatformPermissions';

export interface PlatformActivityLogItem {
  id: string;
  userId: string | null;
  userEmail: string;
  action: string;
  targetResource: string | null;
  targetId: string | null;
  ipAddress: string | null;
  metadataMessage: string | null;
  createdAt: string;
}

export interface PlatformActivityLogsResponse {
  logs: PlatformActivityLogItem[];
}

export const PLATFORM_ACTIVITY_LOGS_QUERY_KEY = ['platform', 'activity-logs'] as const;

/** Super-user activity logs query hook. */
export function usePlatformActivityLogs(): { data: PlatformActivityLogItem[] | undefined; isLoading: boolean; isError: boolean; refetch: () => Promise<unknown> } {
  const { isPlatformAuthenticated, canSystem } = usePlatformPermissions();

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const { data: rawData, ...rest } = tsrClient.platform.getActivityLogs.useQuery({
    queryKey: PLATFORM_ACTIVITY_LOGS_QUERY_KEY,
    queryData: {},
    enabled: isPlatformAuthenticated && canSystem,
    staleTime: 30_000,
  });

  const data: PlatformActivityLogItem[] | undefined = (rawData?.body as any)?.logs;

  return { ...rest, data };
}
