import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TabConfig, CustomFieldConfig } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';

export function useModuleTabs(moduleName: string) {
  return useQuery<TabConfig[]>({
    queryKey: ['module-tabs', moduleName],
    queryFn: async () => {
      const response = await apiJson<{ data: TabConfig[] }>(
        `/api/v2/modules/${moduleName}/tabs`
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveFieldMutation(moduleName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tabId,
      field,
    }: {
      tabId: string;
      field: Partial<CustomFieldConfig>;
    }) => {
      if (field.id) {
        return apiJson(
          `/api/v2/modules/${moduleName}/tabs/${tabId}/fields/${field.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify(field),
          }
        );
      }
      return apiJson(`/api/v2/modules/${moduleName}/tabs/${tabId}/fields`, {
        method: 'POST',
        body: JSON.stringify(field),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-tabs', moduleName] });
    },
  });
}

export function useCheckUniqueMutation(moduleName: string) {
  return useMutation({
    mutationFn: async ({
      fieldKey,
      value,
    }: {
      fieldKey: string;
      value: unknown;
    }) => {
      const response = await apiJson<{ data: { isUnique: boolean } }>(
        `/api/v2/modules/${moduleName}/fields/check-unique`,
        {
          method: 'POST',
          body: JSON.stringify({ fieldKey, value }),
        }
      );
      return response.data.isUnique;
    },
  });
}
