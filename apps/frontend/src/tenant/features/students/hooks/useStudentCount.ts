import { useQuery } from "@tanstack/react-query";
import { STUDENTS_MODULE_MANIFEST } from "@mms/shared";
import { useAuth } from "@/lib/contexts/AuthContext";
import { apiJson } from "@/lib/apiClient";

export const STUDENT_COUNT_QUERY_KEY = [STUDENTS_MODULE_MANIFEST.collectionKey, "count"] as const;

async function fetchStudentCount(signal?: AbortSignal): Promise<number> {
  const countResponse = await apiJson<{ count: number }>(
    `${STUDENTS_MODULE_MANIFEST.restBasePath}/count`,
    { signal },
  );
  return countResponse.count;
}

/** Server-first: student count via dedicated API route. */
export function useStudentCount() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: STUDENT_COUNT_QUERY_KEY,
    queryFn: ({ signal }) => fetchStudentCount(signal),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}
