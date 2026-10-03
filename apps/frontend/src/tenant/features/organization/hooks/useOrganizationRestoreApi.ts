/**
 * @file useOrganizationRestoreApi.ts
 * @description Restore mutations for archived organization locations and positions.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { OrganizationLocationRecord, OrganizationPositionRecord } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { invalidateOrganizationQueries } from './useOrganizationApi';

export function useRestoreLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiJson<{ success: boolean; location: OrganizationLocationRecord }>(
        `/api/organization/locations/${id}/restore`,
        { method: 'POST' },
      ),
    onSuccess: () => {
      void invalidateOrganizationQueries(queryClient);
    },
  });
}

export function useRestorePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiJson<{ success: boolean; position: OrganizationPositionRecord }>(
        `/api/organization/positions/${id}/restore`,
        { method: 'POST' },
      ),
    onSuccess: () => {
      void invalidateOrganizationQueries(queryClient);
    },
  });
}
