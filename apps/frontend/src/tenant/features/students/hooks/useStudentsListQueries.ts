import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { STUDENTS_MODULE_MANIFEST, type Student } from "@mms/shared";
import { useAuth } from "@/lib/contexts/AuthContext";
import { apiJson } from "@/lib/apiClient";
import { uniqueRegistryIds } from "@/lib/registryResolve";
import {
  STUDENTS_API,
  STUDENTS_QUERY_KEY,
  buildStudentsPageUrl,
  sameStudentsListFilters,
  studentDetailQueryKey,
  studentsListQueryKeyParams,
  studentsPaginatedQueryKey,
  type StudentRecord,
  type StudentsListPageResult,
  type StudentsPaginatedParams,
} from "@/tenant/features/students/hooks/studentsQueryKeys";

/** Performs server-authoritative paginated query for Student directory views. */
export function useStudentsPaginated(params: StudentsPaginatedParams) {
  const { isAuthenticated } = useAuth();
  const enabled = params.enabled ?? true;
  return useQuery({
    queryKey: studentsPaginatedQueryKey(params),
    queryFn: async ({ signal }) =>
      apiJson<StudentsListPageResult>(buildStudentsPageUrl(params), { signal }),
    enabled: isAuthenticated && enabled,
    staleTime: 15_000,
    placeholderData: (previousData, previousQuery) => {
      const previousParams = previousQuery?.queryKey[2] as
        | ReturnType<typeof studentsListQueryKeyParams>
        | undefined;
      const keyParams = studentsListQueryKeyParams(params);
      return sameStudentsListFilters(previousParams, keyParams) ? previousData : undefined;
    },
  });
}

/** Fetches all pages matching Work filters for export (globle1 §8). */
export async function fetchAllStudentsForQuery(
  params: Omit<StudentsPaginatedParams, "page" | "enabled">,
  onProgress?: (fetched: number, total: number) => void,
): Promise<StudentRecord[]> {
  const limit = STUDENTS_MODULE_MANIFEST.maxPageSize;
  const all: StudentRecord[] = [];
  let page = 1;
  let total = 0;

  for (;;) {
    const studentsPage = await apiJson<StudentsListPageResult>(
      buildStudentsPageUrl({ ...params, page, limit }),
    );
    all.push(...(studentsPage.students as StudentRecord[]));
    total = studentsPage.total;
    onProgress?.(all.length, total);
    if (!studentsPage.hasMore || page >= 200) break;
    page += 1;
  }

  return all;
}

export function useStudentById(studentId: string | undefined, enabled = true) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: studentDetailQueryKey(studentId ?? ""),
    queryFn: async ({ signal }) => {
      const studentResponse = await apiJson<{ student: StudentRecord }>(`${STUDENTS_API}/${studentId}`, {
        signal,
      });
      return studentResponse.student as unknown as Student;
    },
    enabled: isAuthenticated && enabled && Boolean(studentId),
    staleTime: 30_000,
  });
}

export function useStudentLinkedContactIds(excludeStudentId?: string, enabled = true) {
  const { isAuthenticated } = useAuth();
  const queryString = excludeStudentId ? `?excludeId=${encodeURIComponent(excludeStudentId)}` : "";
  return useQuery({
    queryKey: [...STUDENTS_QUERY_KEY, "linked-contact-ids", excludeStudentId ?? ""] as const,
    queryFn: async ({ signal }) => {
      const linkedContactsResponse = await apiJson<{ contactIds: Array<string | number> }>(
        `${STUDENTS_API}/linked-contact-ids${queryString}`,
        { signal },
      );
      return linkedContactsResponse.contactIds;
    },
    enabled: isAuthenticated && enabled,
    staleTime: 30_000,
  });
}

/** Batch-resolve student rows by id (globle2 §10 — cross-module labels). */
export function useStudentsByIds(ids: (string | number | null | undefined)[]) {
  const { isAuthenticated } = useAuth();
  const normalized = useMemo(() => uniqueRegistryIds(ids), [ids]);
  const signature = normalized.join(",");

  return useQuery({
    queryKey: [...STUDENTS_QUERY_KEY, "resolve", signature] as const,
    queryFn: async ({ signal }) => {
      const studentsResponse = await apiJson<{ students: StudentRecord[] }>(`${STUDENTS_API}/resolve`, {
        method: "POST",
        body: JSON.stringify({ ids: normalized }),
        signal,
      });
      return studentsResponse.students as unknown as Student[];
    },
    enabled: isAuthenticated && normalized.length > 0,
    staleTime: 30_000,
  });
}

export type { StudentsPaginatedParams };
