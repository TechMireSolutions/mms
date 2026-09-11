import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/lib/apiClient';

/** Standard tiered stale times for TanStack Query caching across MMS domains. */
export const TRANSACTIONAL_STALE_TIME = 30_000;      // 30s: directory lists, recent logs, live queues
export const SUMMARY_STALE_TIME = 60_000;            // 60s: dashboard KPIs, aggregate report strips
export const SETUP_STALE_TIME = 5 * 60_000;          // 5m: module settings, custom fields, fee structures
export const STATIC_LOOKUP_STALE_TIME = 30 * 60_000; // 30m: branding, static enums, reference tables

/**
 * Shared React Query client — server state defaults for tenant REST resources.
 */
export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: TRANSACTIONAL_STALE_TIME,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        if (isApiError(error) && (error.status === 401 || error.status === 403)) {
          return false;
        }
        return failureCount < 1;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
