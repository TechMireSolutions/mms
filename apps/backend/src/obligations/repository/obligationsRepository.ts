import type {
  ObligationType,
  Mujtahid,
  MujtahidRep,
  WakalaType,
  ObligationDistribution,
  ObligationCollection,
  ObligationsCommandMetricsSnapshot,
  ObligationsReportAggregates,
  ObligationsReportQuery,
} from '@mms/shared';

/**
 * Sole storage gateway for the obligations module (types, mujtahids, reps,
 * wakala types, distributions, collections).
 *
 * Mirrors the `contacts`/`sessions`/`enrollments`/`finance`/`attendance`/`hasanat`/
 * `questionBank`/`examinations` reference pattern: routes and use-cases depend on
 * this interface (never on Drizzle directly), and the Drizzle-backed adapter is
 * the only implementation. Tests can inject a fake repository at the seam.
 */
export interface ObligationsRepository {
  // Types
  listObligationTypesByWorkspace(tenant: string): Promise<ObligationType[]>;
  bulkSaveObligationTypes(tenant: string, records: ObligationType[]): Promise<void>;
  replaceObligationTypesForWorkspace(tenant: string, records: ObligationType[]): Promise<void>;

  // Mujtahids
  listMujtahidsByWorkspace(tenant: string): Promise<Mujtahid[]>;
  bulkSaveMujtahids(tenant: string, records: Mujtahid[]): Promise<void>;
  replaceMujtahidsForWorkspace(tenant: string, records: Mujtahid[]): Promise<void>;

  // Mujtahid reps
  listMujtahidRepsByWorkspace(tenant: string): Promise<MujtahidRep[]>;
  bulkSaveMujtahidReps(tenant: string, records: MujtahidRep[]): Promise<void>;
  replaceMujtahidRepsForWorkspace(tenant: string, records: MujtahidRep[]): Promise<void>;

  // Wakala types
  listWakalaTypesByWorkspace(tenant: string): Promise<WakalaType[]>;
  bulkSaveWakalaTypes(tenant: string, records: WakalaType[]): Promise<void>;
  replaceWakalaTypesForWorkspace(tenant: string, records: WakalaType[]): Promise<void>;

  // Distributions
  listObligationDistributionsByWorkspace(tenant: string): Promise<ObligationDistribution[]>;
  bulkSaveObligationDistributions(tenant: string, records: ObligationDistribution[]): Promise<void>;
  replaceObligationDistributionsForWorkspace(tenant: string, records: ObligationDistribution[]): Promise<void>;

  // Collections
  listObligationCollectionsByWorkspace(tenant: string): Promise<ObligationCollection[]>;
  findObligationCollectionById(tenant: string, id: string): Promise<ObligationCollection | null>;
  saveObligationCollection(tenant: string, record: ObligationCollection): Promise<void>;
  bulkSaveObligationCollections(tenant: string, records: ObligationCollection[]): Promise<void>;
  replaceObligationCollectionsForWorkspace(tenant: string, records: ObligationCollection[]): Promise<void>;

  // Aggregates
  aggregateObligationsCommandMetrics(
    tenant: string,
    periodDays?: number,
  ): Promise<ObligationsCommandMetricsSnapshot>;
  aggregateObligationsReport(
    tenant: string,
    query?: ObligationsReportQuery,
  ): Promise<ObligationsReportAggregates>;
}
