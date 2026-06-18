import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';

export const TEACHER_COUNT_QUERY_KEY = ['teachers', 'count'] as const;

async function fetchTeacherCount(): Promise<number> {
  const body = await apiJson<{ count: number }>('/api/teachers/count');
  return body.count;
}

/** Server-first: teacher count via dedicated API route. */
export function useTeacherCount() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: TEACHER_COUNT_QUERY_KEY,
    queryFn: fetchTeacherCount,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export default useTeacherCount;
