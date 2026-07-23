import { useMemo } from 'react';
import { CONTACTS_MODULE_CONTRACT } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import {
  completeBackgroundJob,
  failBackgroundJob,
  getModuleBackgroundJobs,
  startBackgroundJob,
  updateBackgroundJobProgress,
  type BackgroundJob,
} from '@/lib/backgroundJobs/backgroundJobStore';
import { useBackgroundJobs } from '@/tenant/hooks/useBackgroundJobs';

const MODULE_ID = CONTACTS_MODULE_CONTRACT.moduleId;

export type ContactsBackgroundJobKind = 'export' | 'sync' | 'import' | 'duplicate_scan';
export type ContactsBackgroundJobStatus = 'running' | 'completed' | 'failed';

export type ContactsBackgroundJob = BackgroundJob & {
  kind: ContactsBackgroundJobKind;
  status: ContactsBackgroundJobStatus;
};

export function getContactsBackgroundJobs(): ContactsBackgroundJob[] {
  return getModuleBackgroundJobs(MODULE_ID) as ContactsBackgroundJob[];
}

/** Reactive hook subscribing to background job changes scoped specifically to the Contacts feature module. */
export function useContactsBackgroundJobs() {
  const { jobs, refresh, dismiss, clearFinished } = useBackgroundJobs();

  const contactsJobs = useMemo(
    () => jobs.filter((job) => job.moduleId === MODULE_ID) as ContactsBackgroundJob[],
    [jobs],
  );

  return {
    jobs: contactsJobs,
    activeJobs: contactsJobs.filter((job) => job.status === 'running'),
    activeCount: contactsJobs.filter((job) => job.status === 'running').length,
    refresh,
    dismiss,
    clearFinished,
  };
}

/** Resolves download REST URL for completed Contacts jobs with a downloadable artifact. */
export function getContactsJobArtifactUrl(job: ContactsBackgroundJob): string | null {
  if (job.status !== 'completed' || !job.hasDownload) return null;
  return `${CONTACTS_MODULE_CONTRACT.restBasePath}/export/download/${encodeURIComponent(job.id)}`;
}

/** Requests server-side job cancellation and marks local status as failed. */
export async function cancelContactsBackgroundJob(jobId: string): Promise<void> {
  try {
    await apiJson(`${CONTACTS_MODULE_CONTRACT.restBasePath}/background-jobs/${encodeURIComponent(jobId)}/cancel`, {
      method: 'POST',
    });
  } catch {
    /* ignore network failure when updating local status */
  }
  failBackgroundJob(jobId, 'Cancelled by user');
}

export function startContactsBackgroundJob(
  kind: ContactsBackgroundJobKind,
  label: string,
  total?: number,
): string {
  return startBackgroundJob(MODULE_ID, kind, label, total);
}

export function updateContactsBackgroundJobProgress(id: string, current: number, total: number): void {
  updateBackgroundJobProgress(id, current, total);
}

export function completeContactsBackgroundJob(id: string): void {
  completeBackgroundJob(id);
}

export function failContactsBackgroundJob(id: string, error: string): void {
  failBackgroundJob(id, error);
}
