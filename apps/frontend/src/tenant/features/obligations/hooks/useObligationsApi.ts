import { useQuery } from '@tanstack/react-query';
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
import { apiJson } from '@/lib/apiClient';
import { useAuth } from '@/lib/contexts/AuthContext';
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
  const { isAuthenticated } = useAuth();
  return useQuery<ObligationType[]>({
    queryKey: OBLIGATIONS_TYPES_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const res = await apiJson<{ types: ObligationType[] }>(`${OBLIGATIONS_API}/types`, { signal });
      return res?.types ?? [];
    },
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 30_000,
  });
}

export function useObligationsTypesCollection(options?: { enabled?: boolean }): ObligationType[] {
  return useObligationsTypes(options).data ?? [];
}

export function useObligationsMujtahids(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  return useQuery<Mujtahid[]>({
    queryKey: OBLIGATIONS_MUJTAHIDS_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const res = await apiJson<{ mujtahids: Mujtahid[] }>(`${OBLIGATIONS_API}/mujtahids`, { signal });
      return res?.mujtahids ?? [];
    },
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 30_000,
  });
}

export function useObligationsMujtahidsCollection(options?: { enabled?: boolean }): Mujtahid[] {
  return useObligationsMujtahids(options).data ?? [];
}

export function useObligationsReps(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  return useQuery<MujtahidRep[]>({
    queryKey: OBLIGATIONS_REPS_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const res = await apiJson<{ reps: MujtahidRep[] }>(`${OBLIGATIONS_API}/reps`, { signal });
      return res?.reps ?? [];
    },
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 30_000,
  });
}

export function useObligationsRepsCollection(options?: { enabled?: boolean }): MujtahidRep[] {
  return useObligationsReps(options).data ?? [];
}

export function useObligationsWakala(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  return useQuery<WakalaType[]>({
    queryKey: OBLIGATIONS_WAKALA_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const res = await apiJson<{ wakalaTypes: WakalaType[] }>(`${OBLIGATIONS_API}/wakala`, { signal });
      return res?.wakalaTypes ?? [];
    },
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 30_000,
  });
}

export function useObligationsWakalaCollection(options?: { enabled?: boolean }): WakalaType[] {
  return useObligationsWakala(options).data ?? [];
}

export function useObligationsDistributions(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  return useQuery<ObligationDistribution[]>({
    queryKey: OBLIGATIONS_DISTRIBUTIONS_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const res = await apiJson<{ distributions: ObligationDistribution[] }>(
        `${OBLIGATIONS_API}/distributions`,
        { signal },
      );
      return res?.distributions ?? [];
    },
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 30_000,
  });
}

export function useObligationsDistributionsCollection(options?: { enabled?: boolean }): ObligationDistribution[] {
  return useObligationsDistributions(options).data ?? [];
}

export function useObligationsCollections(options?: { enabled?: boolean; includeDeleted?: boolean }) {
  const { isAuthenticated } = useAuth();
  const includeDeleted = options?.includeDeleted ?? false;
  return useQuery<ObligationCollection[]>({
    queryKey: [...OBLIGATIONS_COLLECTIONS_QUERY_KEY, { includeDeleted }],
    queryFn: async ({ signal }) => {
      const res = await apiJson<{ collections: ObligationCollection[] }>(
        `${OBLIGATIONS_API}/collections?includeDeleted=${includeDeleted}`,
        { signal },
      );
      return res?.collections ?? [];
    },
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 30_000,
  });
}

export function useObligationsCollectionsCollection(options?: {
  enabled?: boolean;
  includeDeleted?: boolean;
}): ObligationCollection[] {
  return useObligationsCollections(options).data ?? [];
}

export function useObligationsMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<ObligationsCommandMetricsSnapshot>({
    moduleId: OBLIGATIONS_MODULE_MANIFEST.moduleId,
    apiPath: OBLIGATIONS_MODULE_MANIFEST.restBasePath,
    enabled: options?.enabled,
  });
}
