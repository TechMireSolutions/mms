import { useContext } from 'react';
import { QueryClient, QueryClientContext, useMutation, useQuery } from '@tanstack/react-query';
import {
  facultyDepartmentSchema,
  type FacultyDepartmentEntity,
  type FacultyDepartmentWrite,
} from '@mms/shared';
import { apiContract } from '@/lib/api';
import { FACULTY_QUERY_KEY } from './facultyQueryKeys';

export const FACULTY_DEPARTMENTS_QUERY_KEY = [...FACULTY_QUERY_KEY, 'departments'] as const;

const fallbackQueryClient = new QueryClient();

/**
 * Server-authoritative list of faculty departments.
 * Falls back to an empty array on parse failure so the UI never hard-crashes.
 */
export function useFacultyDepartments(options: { includeDeleted?: boolean } = {}) {
  const includeDeleted = Boolean(options.includeDeleted);
  return useQuery({
    queryKey: [...FACULTY_DEPARTMENTS_QUERY_KEY, { includeDeleted }] as const,
    queryFn: async ({ signal }) => {
      const response = await apiContract.faculty.listDepartments({
        query: includeDeleted ? { includeDeleted: true } : undefined,
        fetchOptions: { signal },
      });
      if (response.status !== 200) throw new Error('Failed to load faculty departments');
      const parsed = facultyDepartmentSchema
        .array()
        .safeParse((response.body as { departments?: unknown }).departments);
      if (!parsed.success) throw new Error('Invalid faculty departments response');
      return parsed.data;
    },
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

/** Saves a department (create or update) and invalidates the departments list. */
export function useSaveFacultyDepartment(customClient?: QueryClient) {
  const contextClient = useContext(QueryClientContext);
  const client = customClient ?? contextClient ?? fallbackQueryClient;
  return useMutation(
    {
      mutationFn: async (input: FacultyDepartmentWrite & { id: string }) => {
        const response = await apiContract.faculty.saveDepartment({
          params: { id: input.id },
          body: input,
        });
        if (response.status !== 200) {
          const message =
            typeof response.body === 'object' && response.body && 'message' in response.body
              ? String(response.body.message)
              : 'Failed to save faculty department';
          throw new Error(message);
        }
        return facultyDepartmentSchema.parse(
          (response.body as { department?: unknown }).department,
        );
      },
      onSuccess: () =>
        client.invalidateQueries({ queryKey: FACULTY_DEPARTMENTS_QUERY_KEY }),
    },
    client,
  );
}

/** Soft-deletes a department. Rejects (409) when active assignments reference it. */
export function useDeleteFacultyDepartment(customClient?: QueryClient) {
  const contextClient = useContext(QueryClientContext);
  const client = customClient ?? contextClient ?? fallbackQueryClient;
  return useMutation(
    {
      mutationFn: async (id: string) => {
        const response = await apiContract.faculty.deleteDepartment({
          params: { id },
          body: {},
        });
        if (response.status !== 200) {
          const message =
            typeof response.body === 'object' && response.body && 'message' in response.body
              ? String(response.body.message)
              : 'Failed to delete faculty department';
          throw new Error(message);
        }
      },
      onSuccess: () =>
        client.invalidateQueries({ queryKey: FACULTY_DEPARTMENTS_QUERY_KEY }),
    },
    client,
  );
}

/** Restores a soft-deleted department. */
export function useRestoreFacultyDepartment(customClient?: QueryClient) {
  const contextClient = useContext(QueryClientContext);
  const client = customClient ?? contextClient ?? fallbackQueryClient;
  return useMutation(
    {
      mutationFn: async (id: string) => {
        const response = await apiContract.faculty.restoreDepartment({
          params: { id },
          body: {},
        });
        if (response.status !== 200) {
          const message =
            typeof response.body === 'object' && response.body && 'message' in response.body
              ? String(response.body.message)
              : 'Failed to restore faculty department';
          throw new Error(message);
        }
        return facultyDepartmentSchema.parse(
          (response.body as { department?: unknown }).department,
        );
      },
      onSuccess: () =>
        client.invalidateQueries({ queryKey: FACULTY_DEPARTMENTS_QUERY_KEY }),
    },
    client,
  );
}

/** Convenience: extract department names from entity list (for legacy dropdown compatibility). */
export function departmentEntitiesToNames(departments: FacultyDepartmentEntity[]): string[] {
  return departments.map((d) => d.name);
}
