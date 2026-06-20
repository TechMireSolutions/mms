import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { normalizeStoredStudent } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { getCollection, saveCollection } from '@/lib/db';
import { useLiveCollection } from '@/hooks/useLiveCollection';
import { STUDENT_COUNT_QUERY_KEY } from './useStudentCount';
import type { Student } from '@/lib/data/studentsData';
import { STUDENTS } from '@/lib/data/studentsData';

export const STUDENTS_QUERY_KEY = ['students', 'list'] as const;

export interface StudentRecord {
  id: string | number;
  [key: string]: unknown;
}

async function fetchStudents(): Promise<StudentRecord[]> {
  const body = await apiJson<{ students: StudentRecord[] }>('/api/students');
  saveCollection('students', body.students);
  return getCollection<StudentRecord>('students', []);
}

export function useStudents(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: STUDENTS_QUERY_KEY,
    queryFn: fetchStudents,
    enabled: isAuthenticated && queryEnabled,
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
    mutationFn: async (student: StudentRecord) => {
      const [normalized] = [normalizeStoredStudent(student)];
      return apiJson<{ student: StudentRecord }>('/api/students', {
        method: 'POST',
        body: JSON.stringify(normalized),
      });
    },
    onSuccess: invalidate,
  });

  const updateStudent = useMutation({
    mutationFn: async ({ id, student }: { id: string; student: StudentRecord }) => {
      const normalized = normalizeStoredStudent(student);
      return apiJson<{ student: StudentRecord }>(`/api/students/${id}`, {
        method: 'PUT',
        body: JSON.stringify(normalized),
      });
    },
    onSuccess: invalidate,
  });

  const deleteStudent = useMutation({
    mutationFn: async (id: string) =>
      apiFetch(`/api/students/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  return { createStudent, updateStudent, deleteStudent };
}

/** Query-first students for analytics; falls back to localStorage cache (hydrated). */
export function useStudentsCollection(options?: { enabled?: boolean }): Student[] {
  const enabled = options?.enabled ?? true;
  const { data: fromQuery = [] } = useStudents({ enabled });
  const fromLocal = useLiveCollection<Student>('students', STUDENTS, { enabled });
  if (!enabled) return [];
  if (fromQuery.length > 0) {
    return fromQuery as unknown as Student[];
  }
  return fromLocal;
}
