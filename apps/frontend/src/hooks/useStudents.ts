import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { saveCollection } from '@/lib/db';
import { useLiveCollection } from '@/hooks/useLiveCollection';
import { STUDENT_COUNT_QUERY_KEY } from './useStudentCount';
import type { Student } from '@/lib/data/studentsData';

export const STUDENTS_QUERY_KEY = ['students', 'list'] as const;

export interface StudentRecord {
  id: string | number;
  [key: string]: unknown;
}

async function fetchStudents(): Promise<StudentRecord[]> {
  const body = await apiJson<{ students: StudentRecord[] }>('/api/students');
  saveCollection('students', body.students);
  return body.students;
}

export function useStudents() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: STUDENTS_QUERY_KEY,
    queryFn: fetchStudents,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useStudentMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: STUDENTS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: STUDENT_COUNT_QUERY_KEY });
  };

  const createStudent = useMutation({
    mutationFn: async (student: StudentRecord) =>
      apiJson<{ student: StudentRecord }>('/api/students', {
        method: 'POST',
        body: JSON.stringify(student),
      }),
    onSuccess: invalidate,
  });

  const updateStudent = useMutation({
    mutationFn: async ({ id, student }: { id: string; student: StudentRecord }) =>
      apiJson<{ student: StudentRecord }>(`/api/students/${id}`, {
        method: 'PUT',
        body: JSON.stringify(student),
      }),
    onSuccess: invalidate,
  });

  const deleteStudent = useMutation({
    mutationFn: async (id: string) =>
      apiFetch(`/api/students/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  return { createStudent, updateStudent, deleteStudent };
}

/** Query-first students for analytics; falls back to localStorage cache. */
export function useStudentsCollection(): Student[] {
  const { data: fromQuery = [] } = useStudents();
  const fromLocal = useLiveCollection<Student>('students');
  if (fromQuery.length > 0) {
    return fromQuery as unknown as Student[];
  }
  return fromLocal;
}
