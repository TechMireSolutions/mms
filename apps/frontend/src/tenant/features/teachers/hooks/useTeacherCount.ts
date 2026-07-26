import { useQuery } from '@tanstack/react-query';
import { TEACHERS_MODULE_CONTRACT } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';

export const TEACHER_COUNT_QUERY_KEY = [TEACHERS_MODULE_CONTRACT.collectionKey, 'count'] as const;

async function fetchTeacherCount(): Promise<number> {
  const countResponse = await apiJson<{ count: number }>(`${TEACHERS_MODULE_CONTRACT.restBasePath}/count`);
  return countResponse.count;
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
