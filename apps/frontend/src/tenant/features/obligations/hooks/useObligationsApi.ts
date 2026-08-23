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
import { useAuth } from '@/lib/contexts/AuthContext';
import { NotifiedMutationError } from '@/lib/notifiedMutationError';
import { tsrClient } from '@/lib/api';
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
  const { isAuthenticated } = useAuth();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.obligations.listTypes.useQuery({
    queryKey: OBLIGATIONS_TYPES_QUERY_KEY,
    staleTime: 30_000,
  });
}

export function useObligationsTypesCollection(options?: { enabled?: boolean }): ObligationType[] {
  const query = useObligationsTypes(options);
  if (!query.data || query.data.status !== 200) return [];
  const body = query.data.body as any;
  return Array.isArray(body) ? body : (body?.types ?? []);
}

export function useObligationsMujtahids(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.obligations.listMujtahids.useQuery({
    queryKey: OBLIGATIONS_MUJTAHIDS_QUERY_KEY,
    staleTime: 30_000,
  });
}

export function useObligationsMujtahidsCollection(options?: { enabled?: boolean }): Mujtahid[] {
  const query = useObligationsMujtahids(options);
  if (!query.data || query.data.status !== 200) return [];
  const body = query.data.body as any;
  return Array.isArray(body) ? body : (body?.mujtahids ?? []);
}

export function useObligationsReps(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.obligations.listReps.useQuery({
    queryKey: OBLIGATIONS_REPS_QUERY_KEY,
    staleTime: 30_000,
  });
}

export function useObligationsRepsCollection(options?: { enabled?: boolean }): MujtahidRep[] {
  const query = useObligationsReps(options);
  if (!query.data || query.data.status !== 200) return [];
  const body = query.data.body as any;
  return Array.isArray(body) ? body : (body?.reps ?? []);
}

export function useObligationsWakala(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.obligations.listWakala.useQuery({
    queryKey: OBLIGATIONS_WAKALA_QUERY_KEY,
    staleTime: 30_000,
  });
}

export function useObligationsWakalaCollection(options?: { enabled?: boolean }): WakalaType[] {
  const query = useObligationsWakala(options);
  if (!query.data || query.data.status !== 200) return [];
  const body = query.data.body as any;
  return Array.isArray(body) ? body : (body?.wakalaTypes ?? []);
}

export function useObligationsDistributions(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.obligations.listDistributions.useQuery({
    queryKey: OBLIGATIONS_DISTRIBUTIONS_QUERY_KEY,
    staleTime: 30_000,
  });
}

export function useObligationsDistributionsCollection(options?: { enabled?: boolean }): ObligationDistribution[] {
  const query = useObligationsDistributions(options);
  if (!query.data || query.data.status !== 200) return [];
  const body = query.data.body as any;
  return Array.isArray(body) ? body : (body?.distributions ?? []);
}

export function useObligationsCollections(options?: { enabled?: boolean; includeDeleted?: boolean }) {
  const { isAuthenticated } = useAuth();
  const includeDeleted = options?.includeDeleted ?? false;
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.obligations.listCollections.useQuery({
    queryKey: [...OBLIGATIONS_COLLECTIONS_QUERY_KEY, { includeDeleted }] as any,
    queryData: { query: { includeDeleted: includeDeleted ? 'true' : undefined } },
    staleTime: 30_000,
  });
}

export function useObligationsCollectionsCollection(options?: {
  enabled?: boolean;
  includeDeleted?: boolean;
}): ObligationCollection[] {
  const query = useObligationsCollections(options);
  if (!query.data || query.data.status !== 200) return [];
  const body = query.data.body as any;
  return Array.isArray(body) ? body : (body?.collections ?? []);
}

export function useObligationsMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<ObligationsCommandMetricsSnapshot>({
    moduleId: OBLIGATIONS_MODULE_MANIFEST.moduleId,
    apiPath: OBLIGATIONS_MODULE_MANIFEST.restBasePath,
    enabled: options?.enabled,
  });
}
