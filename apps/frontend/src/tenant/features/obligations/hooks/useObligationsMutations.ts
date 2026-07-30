import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ObligationType,
  Mujtahid,
  MujtahidRep,
  WakalaType,
  ObligationDistribution,
  ObligationCollection,
} from '@mms/shared';
import { OBLIGATIONS_MODULE_MANIFEST } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import {
  OBLIGATIONS_TYPES_QUERY_KEY,
  OBLIGATIONS_MUJTAHIDS_QUERY_KEY,
  OBLIGATIONS_REPS_QUERY_KEY,
  OBLIGATIONS_WAKALA_QUERY_KEY,
  OBLIGATIONS_DISTRIBUTIONS_QUERY_KEY,
  OBLIGATIONS_COLLECTIONS_QUERY_KEY,
  OBLIGATIONS_METRICS_QUERY_KEY,
} from '@/tenant/features/obligations/hooks/obligationsQueryKeys';

const OBLIGATIONS_API = OBLIGATIONS_MODULE_MANIFEST.restBasePath;

export function useObligationsMutations() {
  const queryClient = useQueryClient();

  const invalidateCollections = () => {
    void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_COLLECTIONS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_METRICS_QUERY_KEY });
  };

  const replaceTypes = useMutation({
    mutationFn: async (types: ObligationType[]) =>
      apiJson<{ types: ObligationType[] }>(`${OBLIGATIONS_API}/types/bulk`, {
        method: 'PUT',
        body: JSON.stringify(types),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_TYPES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_METRICS_QUERY_KEY });
    },
  });

  const replaceMujtahids = useMutation({
    mutationFn: async (mujtahids: Mujtahid[]) =>
      apiJson<{ mujtahids: Mujtahid[] }>(`${OBLIGATIONS_API}/mujtahids/bulk`, {
        method: 'PUT',
        body: JSON.stringify(mujtahids),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_MUJTAHIDS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_METRICS_QUERY_KEY });
    },
  });

  const replaceReps = useMutation({
    mutationFn: async (reps: MujtahidRep[]) =>
      apiJson<{ reps: MujtahidRep[] }>(`${OBLIGATIONS_API}/reps/bulk`, {
        method: 'PUT',
        body: JSON.stringify(reps),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_REPS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_METRICS_QUERY_KEY });
    },
  });

  const replaceWakala = useMutation({
    mutationFn: async (wakalaTypes: WakalaType[]) =>
      apiJson<{ wakalaTypes: WakalaType[] }>(`${OBLIGATIONS_API}/wakala/bulk`, {
        method: 'PUT',
        body: JSON.stringify(wakalaTypes),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_WAKALA_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_METRICS_QUERY_KEY });
    },
  });

  const replaceDistributions = useMutation({
    mutationFn: async (distributions: ObligationDistribution[]) =>
      apiJson<{ distributions: ObligationDistribution[] }>(`${OBLIGATIONS_API}/distributions/bulk`, {
        method: 'PUT',
        body: JSON.stringify(distributions),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_DISTRIBUTIONS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_METRICS_QUERY_KEY });
    },
  });

  const replaceCollections = useMutation({
    mutationFn: async (collections: ObligationCollection[]) =>
      apiJson<{ collections: ObligationCollection[] }>(`${OBLIGATIONS_API}/collections/bulk`, {
        method: 'PUT',
        body: JSON.stringify(collections),
      }),
    onSuccess: () => {
      invalidateCollections();
    },
  });

  const deleteCollection = useMutation({
    mutationFn: async (id: string) =>
      apiJson<{ success: boolean }>(`${OBLIGATIONS_API}/collections/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    onSuccess: () => invalidateCollections(),
  });

  const restoreCollection = useMutation({
    mutationFn: async (id: string) =>
      apiJson<{ success: boolean }>(
        `${OBLIGATIONS_API}/collections/${encodeURIComponent(id)}/restore`,
        { method: 'POST' },
      ),
    onSuccess: () => invalidateCollections(),
  });

  const bulkDeleteCollections = useMutation({
    mutationFn: async (ids: string[]) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(
        `${OBLIGATIONS_API}/collections/bulk-delete`,
        { method: 'POST', body: JSON.stringify({ ids }) },
      ),
    onSuccess: () => invalidateCollections(),
  });

  const bulkRestoreCollections = useMutation({
    mutationFn: async (ids: string[]) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(
        `${OBLIGATIONS_API}/collections/bulk-restore`,
        { method: 'POST', body: JSON.stringify({ ids }) },
      ),
    onSuccess: () => invalidateCollections(),
  });

  return {
    replaceTypes,
    replaceMujtahids,
    replaceReps,
    replaceWakala,
    replaceDistributions,
    replaceCollections,
    deleteCollection,
    restoreCollection,
    bulkDeleteCollections,
    bulkRestoreCollections,
  };
}
