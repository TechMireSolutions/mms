import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export interface TemplateItem {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'archived';
  updatedAt: string;
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  includeDeleted?: boolean;
}

// 1. Hierarchical tuple key factory
export const templateKeys = {
  all: ['templateItems'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  list: (params: ListParams) => [...templateKeys.lists(), params] as const,
  details: () => [...templateKeys.all, 'detail'] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
};

// 2. QueryOptions factory with AbortSignal forwarding
export const templateQueries = {
  list: (params: ListParams = {}) =>
    queryOptions({
      queryKey: templateKeys.list(params),
      queryFn: async ({ signal }) => {
        const query = new URLSearchParams();
        if (params.page) query.set('page', String(params.page));
        if (params.limit) query.set('limit', String(params.limit));
        if (params.search) query.set('search', params.search);
        if (params.includeDeleted) query.set('includeDeleted', 'true');

        return apiClient.get<TemplateItem[]>(`/api/template-items?${query.toString()}`, { signal });
      },
      staleTime: 30_000,
    }),

  detail: (id: string) =>
    queryOptions({
      queryKey: templateKeys.detail(id),
      queryFn: async ({ signal }) => {
        return apiClient.get<TemplateItem>(`/api/template-items/${id}`, { signal });
      },
      enabled: Boolean(id),
      staleTime: 60_000,
    }),
};

// 3. Facade hooks for feature components
export function useTemplateList(params: ListParams = {}) {
  return useQuery(templateQueries.list(params));
}

export function useTemplateDetail(id: string) {
  return useQuery(templateQueries.detail(id));
}

// 4. Mutation hook with automatic cache invalidation
export function useCreateTemplateItem(
  options?: UseMutationOptions<TemplateItem, Error, Partial<TemplateItem>>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      return apiClient.post<TemplateItem>('/api/template-items', payload);
    },
    onSuccess: (data, variables, context) => {
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}
