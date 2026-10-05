import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  facultyAssignmentSchema,
  type FacultyAssignmentEntity,
  type FacultyAssignmentWrite,
} from '@mms/shared';
import { apiContract } from '@/lib/api';
import { FACULTY_QUERY_KEY } from './facultyQueryKeys';
import { invalidateFacultyQueries } from './invalidateFacultyQueries';
import { useTranslation } from '@/hooks/useTranslation';

export const FACULTY_ASSIGNMENTS_QUERY_KEY = (facultyId: string) =>
  [...FACULTY_QUERY_KEY, 'assignments', facultyId] as const;

export const ASSIGNMENT_SUBORDINATES_QUERY_KEY = (assignmentId: string) =>
  [...FACULTY_QUERY_KEY, 'assignment-subordinates', assignmentId] as const;

export const ASSIGNMENT_MANAGERS_QUERY_KEY = (assignmentId: string) =>
  [...FACULTY_QUERY_KEY, 'assignment-managers', assignmentId] as const;

export function useFacultyAssignments(
  facultyId: string,
  options: { activeOnly?: boolean; enabled?: boolean } = {},
) {
  const { t } = useTranslation();
  return useQuery({
    queryKey: [...FACULTY_ASSIGNMENTS_QUERY_KEY(facultyId), { activeOnly: options.activeOnly ?? true }],
    queryFn: async ({ signal }): Promise<FacultyAssignmentEntity[]> => {
      const response = await apiContract.faculty.listAssignments({
        params: { facultyId },
        query: { activeOnly: options.activeOnly ?? true },
        fetchOptions: { signal },
      });
      if (response.status !== 200) throw new Error(t('faculty.errors.loadAssignments'));
      const parsed = facultyAssignmentSchema
        .array()
        .safeParse((response.body as { assignments?: unknown }).assignments);
      if (!parsed.success) throw new Error(t('faculty.errors.invalidAssignmentsResponse'));
      return parsed.data;
    },
    enabled: Boolean(facultyId) && (options.enabled ?? true),
    staleTime: 30_000,
  });
}

export function useSaveFacultyAssignment(facultyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: FacultyAssignmentWrite & { id: string }) => {
      const response = await apiContract.faculty.saveAssignment({
        params: { facultyId, id: input.id },
        body: input,
      });
      if (response.status !== 200) {
        const message =
          typeof response.body === 'object' && response.body && 'message' in response.body
            ? String(response.body.message)
            : 'Failed to save faculty assignment';
        throw new Error(message);
      }
      return facultyAssignmentSchema.parse(
        (response.body as { assignment?: unknown }).assignment,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FACULTY_ASSIGNMENTS_QUERY_KEY(facultyId) });
      invalidateFacultyQueries(queryClient);
    },
  });
}

export function useCloseFacultyAssignment(facultyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, endDate }: { id: string; endDate: string }) => {
      const response = await apiContract.faculty.closeAssignment({
        params: { facultyId, id },
        body: { endDate },
      });
      if (response.status !== 200) {
        const message =
          typeof response.body === 'object' && response.body && 'message' in response.body
            ? String(response.body.message)
            : 'Failed to close faculty assignment';
        throw new Error(message);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FACULTY_ASSIGNMENTS_QUERY_KEY(facultyId) });
      invalidateFacultyQueries(queryClient);
    },
  });
}

export function useDeleteFacultyAssignment(facultyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiContract.faculty.deleteAssignment({
        params: { facultyId, id },
        body: {},
      });
      if (response.status !== 200) {
        const message =
          typeof response.body === 'object' && response.body && 'message' in response.body
            ? String(response.body.message)
            : 'Failed to delete faculty assignment';
        throw new Error(message);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FACULTY_ASSIGNMENTS_QUERY_KEY(facultyId) });
      invalidateFacultyQueries(queryClient);
    },
  });
}

export function useAssignmentSubordinates(assignmentId: string, enabled = true) {
  return useQuery({
    queryKey: ASSIGNMENT_SUBORDINATES_QUERY_KEY(assignmentId),
    queryFn: async ({ signal }) => {
      const response = await apiContract.faculty.getAssignmentSubordinates({
        params: { id: assignmentId },
        fetchOptions: { signal },
      });
      if (response.status !== 200) throw new Error('Failed to load assignment subordinates');
      return (response.body as { tree: Array<Record<string, unknown>> }).tree;
    },
    enabled: Boolean(assignmentId) && enabled,
    staleTime: 60_000,
  });
}

export function useAssignmentManagerChain(assignmentId: string, enabled = true) {
  return useQuery({
    queryKey: ASSIGNMENT_MANAGERS_QUERY_KEY(assignmentId),
    queryFn: async ({ signal }) => {
      const response = await apiContract.faculty.getAssignmentManagerChain({
        params: { id: assignmentId },
        fetchOptions: { signal },
      });
      if (response.status !== 200) throw new Error('Failed to load assignment managers');
      return (response.body as { chain: Array<Record<string, unknown>> }).chain;
    },
    enabled: Boolean(assignmentId) && enabled,
    staleTime: 60_000,
  });
}
