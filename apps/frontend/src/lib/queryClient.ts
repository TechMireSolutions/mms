import { QueryClient, dehydrate, hydrate, onlineManager } from '@tanstack/react-query';
import { isApiError } from '@/lib/apiClient';
import { createIdbCachePersister } from '@/lib/query/idbCachePersister';

/** Standard tiered stale times for TanStack Query caching across MMS domains. */
export const TRANSACTIONAL_STALE_TIME = 30_000;      // 30s: directory lists, recent logs, live queues
export const SUMMARY_STALE_TIME = 60_000;            // 60s: dashboard KPIs, aggregate report strips
export const SETUP_STALE_TIME = 5 * 60_000;          // 5m: module settings, custom fields, fee structures
export const STATIC_LOOKUP_STALE_TIME = 30 * 60_000; // 30m: branding, static enums, reference tables

/**
 * Shared React Query client — server state defaults for tenant REST resources.
 * Features 3-attempt exponential backoff, 24h gcTime for offline readiness, and online-mode pausing.
 */
export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: TRANSACTIONAL_STALE_TIME,
      gcTime: 24 * 60 * 60_000, // 24 hours to support offline restoration
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: 'online',
      retry: (failureCount, error) => {
        if (isApiError(error) && (error.status === 401 || error.status === 403 || error.status === 404)) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
    },
    mutations: {
      networkMode: 'online',
      retry: false,
    },
  },
});

const idbPersister = createIdbCachePersister();

/**
 * Restores dehydrated query cache from IndexedDB upon startup and schedules debounced
 * persistence on query cache updates.
 */
export async function initQueryClientPersistence(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const restored = await idbPersister.restoreClient();
    if (restored) {
      hydrate(queryClientInstance, restored);
    }
  } catch (err) {
    // Non-blocking fallback
  }

  // Subscribe to query cache changes with debounce to persist client state
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  queryClientInstance.getQueryCache().subscribe(() => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        const state = dehydrate(queryClientInstance, {
          shouldDehydrateQuery: (query) => {
            const firstKey = query.queryKey[0];
            // Never persist platform super-user queries — they are session-scoped
            // and must not bleed across logins or test retries via IDB hydration.
            if (firstKey === 'platform') return false;
            return (
              query.state.status === 'success' &&
              query.state.data !== undefined &&
              !query.queryKey.some((k) => typeof k === 'string' && k.includes('auth'))
            );
          },
        });
        void idbPersister.persistClient(state);
      } catch {
        // Non-blocking
      }
    }, 1000);
  });
}

// Automatically resume paused mutations upon network recovery
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    onlineManager.setOnline(true);
    void queryClientInstance.resumePausedMutations();
  });
  window.addEventListener('offline', () => {
    onlineManager.setOnline(false);
  });

  // Initialize persistence on client start
  void initQueryClientPersistence();
}
