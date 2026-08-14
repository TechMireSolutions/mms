import { useQuery } from '@tanstack/react-query';
import { apiJson } from '@/lib/apiClient';
import { usePlatformPermissions } from '@/platform/hooks/usePlatformPermissions';

export interface PlatformActivityLogItem {
  id: string;
  userId: string | null;
  userEmail: string;
  action: string;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

export interface PlatformActivityLogsResponse {
  logs: PlatformActivityLogItem[];
}

export const PLATFORM_ACTIVITY_LOGS_QUERY_KEY = ['platform', 'activity-logs'] as const;

async function fetchPlatformActivityLogs(signal?: AbortSignal): Promise<PlatformActivityLogItem[]> {
  const res = await apiJson<PlatformActivityLogsResponse>('/api/platform/admin/system/activity-logs', {
    signal,
  });
  return res.logs;
}

/** Super-user activity logs query hook. */
export function usePlatformActivityLogs() {
  const { isPlatformAuthenticated, isSuperUser } = usePlatformPermissions();

  return useQuery({
    queryKey: PLATFORM_ACTIVITY_LOGS_QUERY_KEY,
    queryFn: ({ signal }) => fetchPlatformActivityLogs(signal),
    enabled: isPlatformAuthenticated && isSuperUser,
    staleTime: 30_000,
  });
}
