import { useQueryClient } from '@tanstack/react-query';
import type {
  ObligationType,
  Mujtahid,
  MujtahidRep,
  WakalaType,
  ObligationDistribution,
  ObligationCollection,
} from '@mms/shared';
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

export function useObligationsMutations() {
  const queryClient = useQueryClient();

  const invalidateCollections = () => {
    void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_COLLECTIONS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_METRICS_QUERY_KEY });
  };

  // @ts-expect-error - TS union discrimination limit with ts-rest

  const _replaceTypes = tsrClient.obligations.replaceTypes.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_TYPES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_METRICS_QUERY_KEY });
    },
  });
  const replaceTypes = { ..._replaceTypes, mutateAsync: (types: ObligationType[]) => _replaceTypes.mutateAsync({ body: types }) };

  // @ts-expect-error - TS union discrimination limit with ts-rest

  const _replaceMujtahids = tsrClient.obligations.replaceMujtahids.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_MUJTAHIDS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_METRICS_QUERY_KEY });
    },
  });
  const replaceMujtahids = { ..._replaceMujtahids, mutateAsync: (mujtahids: Mujtahid[]) => _replaceMujtahids.mutateAsync({ body: mujtahids }) };

  // @ts-expect-error - TS union discrimination limit with ts-rest

  const _replaceReps = tsrClient.obligations.replaceReps.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_REPS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_METRICS_QUERY_KEY });
    },
  });
  const replaceReps = { ..._replaceReps, mutateAsync: (reps: MujtahidRep[]) => _replaceReps.mutateAsync({ body: reps }) };

  // @ts-expect-error - TS union discrimination limit with ts-rest

  const _replaceWakala = tsrClient.obligations.replaceWakala.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_WAKALA_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_METRICS_QUERY_KEY });
    },
  });
  const replaceWakala = { ..._replaceWakala, mutateAsync: (wakalaTypes: WakalaType[]) => _replaceWakala.mutateAsync({ body: wakalaTypes }) };

  // @ts-expect-error - TS union discrimination limit with ts-rest

  const _replaceDistributions = tsrClient.obligations.replaceDistributions.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_DISTRIBUTIONS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: OBLIGATIONS_METRICS_QUERY_KEY });
    },
  });
  const replaceDistributions = { ..._replaceDistributions, mutateAsync: (distributions: ObligationDistribution[]) => _replaceDistributions.mutateAsync({ body: distributions }) };

  // @ts-expect-error - TS union discrimination limit with ts-rest

  const _replaceCollections = tsrClient.obligations.replaceCollections.useMutation({
    onSuccess: () => invalidateCollections(),
  });
  const replaceCollections = { ..._replaceCollections, mutateAsync: (collections: ObligationCollection[]) => _replaceCollections.mutateAsync({ body: collections }) };

  // @ts-expect-error - TS union discrimination limit with ts-rest

  const _deleteCollection = tsrClient.obligations.deleteCollection.useMutation({
    onSuccess: () => invalidateCollections(),
  });
  const deleteCollection = { ..._deleteCollection, mutateAsync: (id: string) => _deleteCollection.mutateAsync({ params: { id } }) };

  // @ts-expect-error - TS union discrimination limit with ts-rest

  const _restoreCollection = tsrClient.obligations.restoreCollection.useMutation({
    onSuccess: () => invalidateCollections(),
  });
  const restoreCollection = { ..._restoreCollection, mutateAsync: (id: string) => _restoreCollection.mutateAsync({ params: { id } }) };

  // @ts-expect-error - TS union discrimination limit with ts-rest

  const _bulkDeleteCollections = tsrClient.obligations.bulkDeleteCollections.useMutation({
    onSuccess: () => invalidateCollections(),
  });
  const bulkDeleteCollections = { ..._bulkDeleteCollections, mutateAsync: (ids: string[]) => _bulkDeleteCollections.mutateAsync({ body: { ids } }) };

  // @ts-expect-error - TS union discrimination limit with ts-rest

  const _bulkRestoreCollections = tsrClient.obligations.bulkRestoreCollections.useMutation({
    onSuccess: () => invalidateCollections(),
  });
  const bulkRestoreCollections = { ..._bulkRestoreCollections, mutateAsync: (ids: string[]) => _bulkRestoreCollections.mutateAsync({ body: { ids } }) };

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
