import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  facultyDesignationAssignmentSchema,
  facultyDesignationSchema,
  type FacultyDesignationAssignmentWrite,
  type FacultyDesignationWrite,
} from '@mms/shared';
import { apiContract } from '@/lib/api';
import { FACULTY_QUERY_KEY } from './facultyQueryKeys';

export const FACULTY_DESIGNATIONS_QUERY_KEY = [...FACULTY_QUERY_KEY, 'designations'] as const;

/** Server-authoritative dynamic designation definitions. */
export function useFacultyDesignations() {
  return useQuery({
    queryKey: FACULTY_DESIGNATIONS_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const response = await apiContract.faculty.listDesignations({ fetchOptions: { signal } });
      if (response.status !== 200) throw new Error('Failed to load Faculty designations');
      const parsed = facultyDesignationSchema.array().safeParse((response.body as { designations?: unknown }).designations);
      if (!parsed.success) throw new Error('Invalid Faculty designation response');
      return parsed.data;
    },
    staleTime: 30_000,
  });
}

/** Complete dated designation history for one Faculty member. */
export function useFacultyDesignationHistory(facultyId: string, enabled = true) {
  return useQuery({
    queryKey: [...FACULTY_DESIGNATIONS_QUERY_KEY, 'history', facultyId] as const,
    queryFn: async ({ signal }) => {
      const response = await apiContract.faculty.listDesignationHistory({
        params: { facultyId },
        fetchOptions: { signal },
      });
      if (response.status !== 200) throw new Error('Failed to load designation history');
      const parsed = facultyDesignationAssignmentSchema.array().safeParse((response.body as { assignments?: unknown }).assignments);
      if (!parsed.success) throw new Error('Invalid Faculty designation history response');
      return parsed.data;
    },
    enabled: enabled && Boolean(facultyId),
    staleTime: 30_000,
  });
}

/** Saves a designation definition and refreshes every designation projection. */
export function useSaveFacultyDesignation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: FacultyDesignationWrite) => {
      const response = await apiContract.faculty.saveDesignation({ params: { id: input.id }, body: input });
      if (response.status !== 200) throw new Error('Failed to save Faculty designation');
      return facultyDesignationSchema.parse((response.body as { designation?: unknown }).designation);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FACULTY_DESIGNATIONS_QUERY_KEY }),
  });
}

/** Saves a non-overlapping designation period and refreshes the Faculty directory. */
export function useSaveFacultyDesignationAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: FacultyDesignationAssignmentWrite) => {
      const response = await apiContract.faculty.saveDesignationAssignment({
        params: { facultyId: input.facultyId, assignmentId: input.id },
        body: input,
      });
      if (response.status !== 200) {
        const message = typeof response.body === 'object' && response.body && 'message' in response.body
          ? String(response.body.message)
          : 'Failed to save designation assignment';
        throw new Error(message);
      }
      return facultyDesignationAssignmentSchema.parse((response.body as { assignment?: unknown }).assignment);
    },
    onSuccess: (_assignment, input) => Promise.all([
      queryClient.invalidateQueries({ queryKey: FACULTY_DESIGNATIONS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: [...FACULTY_QUERY_KEY, 'contract-get', input.facultyId] }),
      queryClient.invalidateQueries({ queryKey: FACULTY_QUERY_KEY }),
    ]),
  });
}
