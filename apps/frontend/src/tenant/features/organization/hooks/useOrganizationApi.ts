import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  OrganizationLocationRecord,
  OrganizationLocationInsert,
  OrganizationLocationUpdate,
  OrganizationPositionRecord,
  OrganizationPositionInsert,
  OrganizationPositionUpdate,
  OrganizationPositionTreeNode,
  OrganizationBlueprint,
  ApplyBlueprintRequest,
} from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import {
  ORGANIZATION_QUERY_KEY,
  ORGANIZATION_LOCATIONS_QUERY_KEY,
  ORGANIZATION_POSITIONS_QUERY_KEY,
  ORGANIZATION_TREE_QUERY_KEY,
  ORGANIZATION_BLUEPRINTS_QUERY_KEY,
} from './organizationQueryKeys';

export function invalidateOrganizationQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: ORGANIZATION_QUERY_KEY });
}

// ── Locations ───────────────────────────────────────────────────────────────
export function useOrganizationLocations(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ORGANIZATION_LOCATIONS_QUERY_KEY,
    queryFn: ({ signal }) =>
      apiJson<OrganizationLocationRecord[]>('/api/organization/locations', { signal }),
    enabled: options.enabled ?? true,
    staleTime: 30_000,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OrganizationLocationInsert) =>
      apiJson<OrganizationLocationRecord>('/api/organization/locations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void invalidateOrganizationQueries(queryClient);
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrganizationLocationUpdate }) =>
      apiJson<OrganizationLocationRecord>(`/api/organization/locations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void invalidateOrganizationQueries(queryClient);
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiJson<{ success: boolean }>(`/api/organization/locations/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void invalidateOrganizationQueries(queryClient);
    },
  });
}

// ── Positions & Tree ───────────────────────────────────────────────────────
export function useOrganizationPositions(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ORGANIZATION_POSITIONS_QUERY_KEY,
    queryFn: ({ signal }) =>
      apiJson<OrganizationPositionRecord[]>('/api/organization/positions', { signal }),
    enabled: options.enabled ?? true,
    staleTime: 30_000,
  });
}

export function useOrganizationTree(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ORGANIZATION_TREE_QUERY_KEY,
    queryFn: ({ signal }) =>
      apiJson<OrganizationPositionTreeNode[]>('/api/organization/positions/tree', { signal }),
    enabled: options.enabled ?? true,
    staleTime: 15_000,
  });
}

export function useCreatePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OrganizationPositionInsert) =>
      apiJson<OrganizationPositionRecord>('/api/organization/positions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void invalidateOrganizationQueries(queryClient);
    },
  });
}

export function useUpdatePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrganizationPositionUpdate }) =>
      apiJson<OrganizationPositionRecord>(`/api/organization/positions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void invalidateOrganizationQueries(queryClient);
    },
  });
}

export function useDeletePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiJson<{ success: boolean }>(`/api/organization/positions/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void invalidateOrganizationQueries(queryClient);
    },
  });
}

// ── Blueprints ─────────────────────────────────────────────────────────────
export function useOrganizationBlueprints(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ORGANIZATION_BLUEPRINTS_QUERY_KEY,
    queryFn: ({ signal }) =>
      apiJson<OrganizationBlueprint[]>('/api/organization/blueprints', { signal }),
    enabled: options.enabled ?? true,
    staleTime: 60_000,
  });
}

export function useApplyBlueprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ApplyBlueprintRequest) =>
      apiJson<{ success: boolean; blueprint: OrganizationBlueprint }>(
        '/api/organization/blueprints/apply',
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
      ),
    onSuccess: () => {
      void invalidateOrganizationQueries(queryClient);
    },
  });
}
