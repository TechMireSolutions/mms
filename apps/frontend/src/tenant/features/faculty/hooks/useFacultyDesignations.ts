import { useContext } from 'react';
import { QueryClient, QueryClientContext, useMutation, useQuery } from '@tanstack/react-query';
import {
  facultyDesignationSchema,
  type FacultyDesignationWrite,
} from '@mms/shared';
import { apiContract } from '@/lib/api';
import { FACULTY_QUERY_KEY } from './facultyQueryKeys';

export const FACULTY_DESIGNATIONS_QUERY_KEY = [...FACULTY_QUERY_KEY, 'designations'] as const;

const fallbackQueryClient = new QueryClient();

/** Server-authoritative dynamic designation definitions. */
export function useFacultyDesignations(options: { includeDeleted?: boolean } = {}) {
  const includeDeleted = Boolean(options.includeDeleted);
  return useQuery({
    queryKey: [...FACULTY_DESIGNATIONS_QUERY_KEY, { includeDeleted }] as const,
    queryFn: async ({ signal }) => {
      const response = await apiContract.faculty.listDesignations({
        query: includeDeleted ? { includeDeleted: true } : undefined,
        fetchOptions: { signal },
      });
      if (response.status !== 200) throw new Error('Failed to load Faculty designations');
      const parsed = facultyDesignationSchema.array().safeParse((response.body as { designations?: unknown }).designations);
      if (!parsed.success) throw new Error('Invalid Faculty designation response');
      return parsed.data;
    },
    staleTime: 30_000,
  });
}

/** Saves a designation definition and refreshes every designation projection. */
export function useSaveFacultyDesignation(customClient?: QueryClient) {
  const contextClient = useContext(QueryClientContext);
  const client = customClient ?? contextClient ?? fallbackQueryClient;
  return useMutation(
    {
      mutationFn: async (input: FacultyDesignationWrite) => {
        const response = await apiContract.faculty.saveDesignation({ params: { id: input.id }, body: input });
        if (response.status !== 200) throw new Error('Failed to save Faculty designation');
        return facultyDesignationSchema.parse((response.body as { designation?: unknown }).designation);
      },
      onSuccess: () => client.invalidateQueries({ queryKey: FACULTY_DESIGNATIONS_QUERY_KEY }),
    },
    client,
  );
}

/** Soft-deletes a designation definition. Rejects (409) when active appointments reference it. */
export function useDeleteFacultyDesignation(customClient?: QueryClient) {
  const contextClient = useContext(QueryClientContext);
  const client = customClient ?? contextClient ?? fallbackQueryClient;
  return useMutation(
    {
      mutationFn: async (id: string) => {
        const response = await apiContract.faculty.deleteDesignation({
          params: { id },
          body: {},
        });
        if (response.status !== 200) {
          const message =
            typeof response.body === 'object' && response.body && 'message' in response.body
              ? String(response.body.message)
              : 'Failed to delete faculty designation';
          throw new Error(message);
        }
      },
      onSuccess: () =>
        client.invalidateQueries({ queryKey: FACULTY_DESIGNATIONS_QUERY_KEY }),
    },
    client,
  );
}

/** Restores a soft-deleted designation definition. */
export function useRestoreFacultyDesignation(customClient?: QueryClient) {
  const contextClient = useContext(QueryClientContext);
  const client = customClient ?? contextClient ?? fallbackQueryClient;
  return useMutation(
    {
      mutationFn: async (id: string) => {
        const response = await apiContract.faculty.restoreDesignation({
          params: { id },
          body: {},
        });
        if (response.status !== 200) {
          const message =
            typeof response.body === 'object' && response.body && 'message' in response.body
              ? String(response.body.message)
              : 'Failed to restore faculty designation';
          throw new Error(message);
        }
        return facultyDesignationSchema.parse(
          (response.body as { designation?: unknown }).designation,
        );
      },
      onSuccess: () =>
        client.invalidateQueries({ queryKey: FACULTY_DESIGNATIONS_QUERY_KEY }),
    },
    client,
  );
}
