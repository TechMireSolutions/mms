import type {
  ObligationType,
  Mujtahid,
  MujtahidRep,
  WakalaType,
  ObligationDistribution,
  ObligationCollection,
  ObligationsCommandMetricsSnapshot,
} from '@mms/shared';
import { OBLIGATIONS_MODULE_MANIFEST } from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { useCollectionSync } from '@/hooks/useCollectionSync';
import { NotifiedMutationError } from '@/lib/notifiedMutationError';
import {
  OBLIGATIONS_TYPES_QUERY_KEY,
  OBLIGATIONS_MUJTAHIDS_QUERY_KEY,
  OBLIGATIONS_REPS_QUERY_KEY,
  OBLIGATIONS_WAKALA_QUERY_KEY,
  OBLIGATIONS_DISTRIBUTIONS_QUERY_KEY,
  OBLIGATIONS_COLLECTIONS_QUERY_KEY,
  OBLIGATIONS_METRICS_QUERY_KEY,
} from '@/tenant/features/obligations/hooks/obligationsQueryKeys';

export {
  OBLIGATIONS_TYPES_QUERY_KEY,
  OBLIGATIONS_MUJTAHIDS_QUERY_KEY,
  OBLIGATIONS_REPS_QUERY_KEY,
  OBLIGATIONS_WAKALA_QUERY_KEY,
  OBLIGATIONS_DISTRIBUTIONS_QUERY_KEY,
  OBLIGATIONS_COLLECTIONS_QUERY_KEY,
  OBLIGATIONS_METRICS_QUERY_KEY,
};
export { useObligationsMutations } from '@/tenant/features/obligations/hooks/useObligationsMutations';

const OBLIGATIONS_API = OBLIGATIONS_MODULE_MANIFEST.restBasePath;

/** @deprecated Prefer NotifiedMutationError — kept for form catch compatibility. */
export class NotifiedObligationsMutationError extends NotifiedMutationError {}

export function useObligationsTypes(options?: { enabled?: boolean }) {
  return useCollectionSync<ObligationType>({
    queryKey: OBLIGATIONS_TYPES_QUERY_KEY,
    apiPath: `${OBLIGATIONS_API}/types`,
    responseKey: 'types',
    collectionName: 'obligation_types',
    enabled: options?.enabled,
    mirrorToLocalCache: false,
  });
}

export function useObligationsTypesCollection(options?: { enabled?: boolean }): ObligationType[] {
  return useObligationsTypes(options).syncedData;
}

export function useObligationsMujtahids(options?: { enabled?: boolean }) {
  return useCollectionSync<Mujtahid>({
    queryKey: OBLIGATIONS_MUJTAHIDS_QUERY_KEY,
    apiPath: `${OBLIGATIONS_API}/mujtahids`,
    responseKey: 'mujtahids',
    collectionName: 'mujtahids',
    enabled: options?.enabled,
    mirrorToLocalCache: false,
  });
}

export function useObligationsMujtahidsCollection(options?: { enabled?: boolean }): Mujtahid[] {
  return useObligationsMujtahids(options).syncedData;
}

export function useObligationsReps(options?: { enabled?: boolean }) {
  return useCollectionSync<MujtahidRep>({
    queryKey: OBLIGATIONS_REPS_QUERY_KEY,
    apiPath: `${OBLIGATIONS_API}/reps`,
    responseKey: 'reps',
    collectionName: 'mujtahid_reps',
    enabled: options?.enabled,
    mirrorToLocalCache: false,
  });
}

export function useObligationsRepsCollection(options?: { enabled?: boolean }): MujtahidRep[] {
  return useObligationsReps(options).syncedData;
}

export function useObligationsWakala(options?: { enabled?: boolean }) {
  return useCollectionSync<WakalaType>({
    queryKey: OBLIGATIONS_WAKALA_QUERY_KEY,
    apiPath: `${OBLIGATIONS_API}/wakala`,
    responseKey: 'wakalaTypes',
    collectionName: 'wakala_types',
    enabled: options?.enabled,
    mirrorToLocalCache: false,
  });
}

export function useObligationsWakalaCollection(options?: { enabled?: boolean }): WakalaType[] {
  return useObligationsWakala(options).syncedData;
}

export function useObligationsDistributions(options?: { enabled?: boolean }) {
  return useCollectionSync<ObligationDistribution>({
    queryKey: OBLIGATIONS_DISTRIBUTIONS_QUERY_KEY,
    apiPath: `${OBLIGATIONS_API}/distributions`,
    responseKey: 'distributions',
    collectionName: 'obligation_distributions',
    enabled: options?.enabled,
    mirrorToLocalCache: false,
  });
}

export function useObligationsDistributionsCollection(options?: { enabled?: boolean }): ObligationDistribution[] {
  return useObligationsDistributions(options).syncedData;
}

export function useObligationsCollections(options?: { enabled?: boolean; includeDeleted?: boolean }) {
  const includeDeleted = options?.includeDeleted ?? false;
  return useCollectionSync<ObligationCollection>({
    queryKey: [...OBLIGATIONS_COLLECTIONS_QUERY_KEY, { includeDeleted }],
    apiPath: `${OBLIGATIONS_API}/collections?includeDeleted=${includeDeleted}`,
    responseKey: 'collections',
    collectionName: 'obligation_collections',
    enabled: options?.enabled,
    mirrorToLocalCache: false,
  });
}

export function useObligationsCollectionsCollection(options?: {
  enabled?: boolean;
  includeDeleted?: boolean;
}): ObligationCollection[] {
  return useObligationsCollections(options).syncedData;
}

export function useObligationsMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<ObligationsCommandMetricsSnapshot>({
    moduleId: OBLIGATIONS_MODULE_MANIFEST.moduleId,
    apiPath: OBLIGATIONS_MODULE_MANIFEST.restBasePath,
    enabled: options?.enabled,
  });
}
