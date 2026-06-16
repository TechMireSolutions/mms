import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/contexts/AuthContext";
import { apiJson } from "@/lib/apiClient";

export const STUDENT_COUNT_QUERY_KEY = ["students", "count"] as const;

async function fetchStudentCount(): Promise<number> {
  const body = await apiJson<{ count: number }>("/api/students/count");
  return body.count;
}

/** Server-first: student count via dedicated API route. */
export function useStudentCount() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: STUDENT_COUNT_QUERY_KEY,
    queryFn: fetchStudentCount,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export default useStudentCount;
