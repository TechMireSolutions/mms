import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/lib/apiClient';

/**
 * Shared React Query client — server state defaults for tenant REST resources.
 */
export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
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
