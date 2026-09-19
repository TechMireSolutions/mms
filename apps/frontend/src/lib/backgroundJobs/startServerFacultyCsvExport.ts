import type { BackgroundJobRecord, TeacherExportColumn, TeachersListQuery } from '@mms/shared';
import { startServerModuleCsvExport } from '@/lib/backgroundJobs/startServerModuleCsvExport';

export async function startServerFacultyCsvExport(options: {
  query: TeachersListQuery;
  columns: TeacherExportColumn[];
  filename: string;
  label: string;
  ids?: Array<string | number>;
}): Promise<BackgroundJobRecord> {
  return startServerModuleCsvExport({
    path: '/api/faculty/export/csv',
    body: {
      query: options.query,
      columns: options.columns,
      filename: options.filename,
      label: options.label,
      ids: options.ids,
    },
  });
}

export const startServerTeachersCsvExport = startServerFacultyCsvExport;

