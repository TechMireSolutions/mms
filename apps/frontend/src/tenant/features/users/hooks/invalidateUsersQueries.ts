import type { QueryClient } from '@tanstack/react-query';
import {
  USERS_FIELD_CONFIG_QUERY_KEY,
  USERS_PREFERENCES_QUERY_KEY,
} from '@/tenant/features/users/hooks/useUserSetupConfig';
import {
  ACTIVITY_LOGS_QUERY_KEY,
  USERS_LIST_QUERY_KEY,
  USERS_METRICS_QUERY_KEY,
} from '@/tenant/features/users/hooks/usersQueryKeys';

/** Invalidate Users list/metrics/activity-logs/setup Query keys (mutations + live push). */
export function invalidateUsersQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: USERS_LIST_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: USERS_METRICS_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: ACTIVITY_LOGS_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: USERS_FIELD_CONFIG_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: USERS_PREFERENCES_QUERY_KEY });
}
