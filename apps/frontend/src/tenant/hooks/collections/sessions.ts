/**
 * Cross-module public surface for Sessions Query hooks.
 * Other features and shared UI must import from here — not `@/tenant/features/sessions/hooks/*`.
 */
export {
  SESSIONS_QUERY_KEY,
  SESSIONS_METRICS_QUERY_KEY,
  useSessions,
  useSessionsPaginated,
  useSessionsCollection,
  useSessionMutations,
  useSessionsMetrics,
} from '@/tenant/features/sessions/hooks/useSessions';
