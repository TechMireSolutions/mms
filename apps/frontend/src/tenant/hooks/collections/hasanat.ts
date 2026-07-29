/**
 * Cross-module public surface for Hasanat Query hooks.
 * Other features and shared UI must import from here — not `@/tenant/features/hasanat/hooks/*`.
 */
export {
  HASANAT_DENOMS_QUERY_KEY,
  HASANAT_BATCHES_QUERY_KEY,
  HASANAT_DISTRIBUTIONS_QUERY_KEY,
  HASANAT_REDEMPTIONS_QUERY_KEY,
  HASANAT_METRICS_QUERY_KEY,
  useHasanatDenoms,
  useHasanatDenomsCollection,
  useHasanatBatches,
  useHasanatBatchesCollection,
  useHasanatDistributions,
  useHasanatDistributionsCollection,
  useHasanatRedemptions,
  useHasanatRedemptionsCollection,
  useHasanatMetrics,
  useHasanatMutations,
} from "@/tenant/features/hasanat/hooks/useHasanatApi";
