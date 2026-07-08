import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiJson } from '@/lib/apiClient';

export interface CustomTab {
  id?: string;
  moduleId: string;
  key: string;
  label: string;
  icon?: string | null;
  enabled: boolean;
  sortOrder: number;
  permissions?: string[] | null;
  description?: string | null;
  color?: string | null;
  isSystem: boolean;
}

export const CUSTOM_TABS_QUERY_KEY = ['custom-tabs'] as const;

export function useCustomTabs(moduleId?: string) {
  const url = moduleId ? `/api/custom-tabs?moduleId=${moduleId}` : '/api/custom-tabs';
  return useQuery({
    queryKey: [...CUSTOM_TABS_QUERY_KEY, moduleId ?? 'all'],
    queryFn: async () => {
      const response = await apiJson<{ tabs: CustomTab[] }>(url);
      return response.tabs;
    },
  });
}

export function useCustomTabsMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: CUSTOM_TABS_QUERY_KEY });
  };

  const createTab = useMutation({
    mutationFn: async (tab: Omit<CustomTab, 'id'>) =>
      apiJson<{ tab: CustomTab }>('/api/custom-tabs', {
        method: 'POST',
        body: JSON.stringify(tab),
      }),
    onSuccess: invalidateAll,
  });

  const updateTab = useMutation({
    mutationFn: async ({ id, tab }: { id: string; tab: Partial<CustomTab> }) =>
      apiJson<{ tab: CustomTab }>(`/api/custom-tabs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(tab),
      }),
    onSuccess: invalidateAll,
  });

  const deleteTab = useMutation({
    mutationFn: async (id: string) =>
      apiFetch(`/api/custom-tabs/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: invalidateAll,
  });

  const bulkReplaceTabs = useMutation({
    mutationFn: async ({ moduleId, tabs }: { moduleId: string; tabs: Omit<CustomTab, 'id' | 'moduleId'>[] }) =>
      apiJson<{ tabs: CustomTab[] }>('/api/custom-tabs/bulk', {
        method: 'PUT',
        body: JSON.stringify({ moduleId, tabs }),
      }),
    onSuccess: invalidateAll,
  });

  return {
    createTab,
    updateTab,
    deleteTab,
    bulkReplaceTabs,
  };
}
