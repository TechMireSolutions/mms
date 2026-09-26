import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  facultyDesignationAssignmentSchema,
  facultyDesignationSchema,
  type FacultyDesignationAssignment,
  type FacultyDesignationAssignmentWrite,
  type FacultyDesignationTransition,
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

/** Removes a single designation assignment. Rejects (409) if it is the member's only one. */
export function useDeleteFacultyDesignationAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ facultyId, assignmentId }: { facultyId: string; assignmentId: string }) => {
      const response = await apiContract.faculty.deleteDesignationAssignment({
        params: { facultyId, assignmentId },
        body: {},
      });
      if (response.status !== 200) {
        const message = typeof response.body === 'object' && response.body && 'message' in response.body
          ? String(response.body.message)
          : 'Failed to delete designation assignment';
        throw new Error(message);
      }
    },
    onSuccess: (_data, { facultyId }) => Promise.all([
      queryClient.invalidateQueries({ queryKey: FACULTY_DESIGNATIONS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: [...FACULTY_QUERY_KEY, 'contract-get', facultyId] }),
      queryClient.invalidateQueries({ queryKey: FACULTY_QUERY_KEY }),
    ]),
  });
}

/**
 * Closes the current open designation period (sets endsOn = transitionDate - 1 day)
 * and opens a new one starting transitionDate — two sequential API calls composed
 * on the frontend.
 */
export function useTransitionFacultyDesignation() {
  const save = useSaveFacultyDesignationAssignment();
  return useMutation({
    mutationFn: async ({
      facultyId,
      currentAssignment,
      newDesignationId,
      transitionDate,
      notes,
    }: FacultyDesignationTransition & { currentAssignment: FacultyDesignationAssignment | null }) => {
      // Step 1: close the current open period (if any) to the day before transitionDate.
      if (currentAssignment && !currentAssignment.endsOn) {
        const endsOn = subtractOneDay(transitionDate);
        if (endsOn >= currentAssignment.startsOn) {
          await save.mutateAsync({
            ...currentAssignment,
            facultyId,
            endsOn,
          });
        }
      }
      // Step 2: open the new period starting transitionDate.
      await save.mutateAsync({
        id: crypto.randomUUID(),
        facultyId,
        designationId: newDesignationId,
        startsOn: transitionDate,
        endsOn: null,
        notes: notes ?? null,
      });
    },
  });
}

/** Returns the ISO date for the day before the given YYYY-MM-DD string. */
function subtractOneDay(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}
