import type { BackgroundJobRecord, ContactExportColumn, ContactsListQuery } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { upsertLocalBackgroundJob } from '@/lib/backgroundJobs/backgroundJobStore';
import { pollBackgroundJobUntilDone } from '@/lib/backgroundJobs/pollBackgroundJob';

export async function startServerContactsCsvExport(options: {
  query: ContactsListQuery;
  columns: ContactExportColumn[];
  filename: string;
  label: string;
}): Promise<BackgroundJobRecord> {
  const body = await apiJson<{ job: BackgroundJobRecord }>(
    '/api/contacts/export/csv',
    {
      method: 'POST',
      body: JSON.stringify({
        query: options.query,
        columns: options.columns,
        filename: options.filename,
        label: options.label,
      }),
    },
  );
  upsertLocalBackgroundJob(body.job);

  if (body.job.status === 'running') {
    return pollBackgroundJobUntilDone(body.job.id);
  }
  return body.job;
}

export async function startContactsDuplicateScan(label?: string): Promise<BackgroundJobRecord> {
  const body = await apiJson<{ job: BackgroundJobRecord }>(
    '/api/contacts/duplicates/scan',
    { method: 'POST', body: JSON.stringify({ label }) },
  );
  upsertLocalBackgroundJob(body.job);

  if (body.job.status === 'running') {
    return pollBackgroundJobUntilDone(body.job.id);
  }
  return body.job;
}
