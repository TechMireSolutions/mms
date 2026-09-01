/**
 * Cross-module public surface for Users Query hooks.
 * Other features and shared UI must import from here — not `@/tenant/features/users/hooks/*`.
 */
export {
  USERS_LIST_QUERY_KEY,
  USERS_METRICS_QUERY_KEY,
  ACTIVITY_LOGS_QUERY_KEY,
  useUsersCollection,
  useUsersMetrics,
  useActivityLogs,
  useUsersMutations,
} from '@/tenant/features/users/hooks/useUsersApi';
export { useUsersPaginated, fetchAllUsersForQuery } from '@/tenant/features/users/hooks/useUsersListQueries';
export {
  setUserFieldConfigMemory,
  setUserPreferencesMemory,
} from '@/tenant/features/users/hooks/userSetupConfigApi';
export { invalidateUsersQueries } from '@/tenant/features/users/hooks/invalidateUsersQueries';
// Phase 7: contract-driven tsrClient hooks
export {
  useUsersContractList,
  useUsersContractCreate,
  useUsersContractUpdate,
  useUsersContractInvite,
  useUsersContractBulkUpdate,
  useUsersContractBulkDelete,
  useUsersContractBulkRestore,
  useUsersContractDelete,
  useUsersContractRestore,
  useUsersContractVerifyEmail,
} from '@/tenant/features/users/hooks/useUsersTsrHooks';
