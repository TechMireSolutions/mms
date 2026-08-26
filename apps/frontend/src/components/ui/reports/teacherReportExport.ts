import type { Teacher, TeachersQuickFilter } from '@mms/shared';
import { fetchAllTeachersForQuery } from '@/tenant/hooks/collections/teachers';
import { mapTeacherRow } from './teacherReportTypes';

/** Resolves full teacher roster rows for CSV/Excel/PDF export (server-side filters). */
export async function resolveTeacherReportExportRows(input: {
  search?: string;
  status?: string;
  quickFilter?: TeachersQuickFilter;
  gender?: string;
}): Promise<Record<string, unknown>[]> {
  const source = (await fetchAllTeachersForQuery(input)) as unknown as Teacher[];
  return source.map((teacher) => mapTeacherRow(teacher) as unknown as Record<string, unknown>);
}
