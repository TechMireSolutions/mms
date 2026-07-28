import { CONTACTS_MODULE_MANIFEST } from '@mms/shared';
import {
  completeBackgroundJob,
  failBackgroundJob,
  startBackgroundJob,
  updateBackgroundJobProgress,
} from '@/lib/backgroundJobs/backgroundJobStore';

const MODULE_ID = CONTACTS_MODULE_MANIFEST.moduleId;

export type ContactsBackgroundJobKind = 'export' | 'sync' | 'import' | 'duplicate_scan';

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
