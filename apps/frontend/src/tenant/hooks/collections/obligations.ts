/**
 * Cross-module public surface for Obligations Query hooks.
 * Other features and shared UI must import from here — not `@/tenant/features/obligations/hooks/*`.
 */
export {
  OBLIGATIONS_TYPES_QUERY_KEY,
  OBLIGATIONS_MUJTAHIDS_QUERY_KEY,
  OBLIGATIONS_REPS_QUERY_KEY,
  OBLIGATIONS_WAKALA_QUERY_KEY,
  OBLIGATIONS_DISTRIBUTIONS_QUERY_KEY,
  OBLIGATIONS_COLLECTIONS_QUERY_KEY,
  OBLIGATIONS_METRICS_QUERY_KEY,
  useObligationsTypes,
  useObligationsTypesCollection,
  useObligationsMujtahids,
  useObligationsMujtahidsCollection,
  useObligationsReps,
  useObligationsRepsCollection,
  useObligationsWakala,
  useObligationsWakalaCollection,
  useObligationsDistributions,
  useObligationsDistributionsCollection,
  useObligationsCollections,
  useObligationsCollectionsCollection,
  useObligationsMetrics,
  useObligationsMutations,
} from '@/tenant/features/obligations/hooks/useObligationsApi';
export { invalidateObligationsQueries } from '@/tenant/features/obligations/hooks/invalidateObligationsQueries';
// Phase 7: contract-driven tsrClient hooks
export {
  useObligationsContractCollections,
  useObligationsContractTypes,
  useObligationsContractMujtahids,
  useObligationsContractDistributions,
  useObligationsContractReps,
  useObligationsContractWakala,
  useObligationsContractDeleteCollection,
  useObligationsContractRestoreCollection,
  useObligationsContractBulkDeleteCollections,
  useObligationsContractBulkRestoreCollections,
} from '@/tenant/features/obligations/hooks/useObligationsTsrHooks';
