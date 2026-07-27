/**
 * Cross-module public surface for Hasanat Query hooks.
 * Other features and shared UI must import from here — not `@/tenant/features/hasanat/hooks/*`.
 */
export {
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
