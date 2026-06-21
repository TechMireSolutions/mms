import { CONTACTS_MODULE_CONTRACT } from '@mms/shared';
import {
  clearFinishedBackgroundJobs,
  completeBackgroundJob,
  dismissBackgroundJob,
  failBackgroundJob,
  getModuleBackgroundJobs,
  startBackgroundJob,
  updateBackgroundJobProgress,
  type BackgroundJob,
} from '@/lib/backgroundJobs/backgroundJobStore';

const MODULE_ID = CONTACTS_MODULE_CONTRACT.moduleId;

export type ContactsBackgroundJobKind = 'export' | 'sync';
export type ContactsBackgroundJobStatus = 'running' | 'completed' | 'failed';

export type ContactsBackgroundJob = BackgroundJob & {
  kind: ContactsBackgroundJobKind;
  status: ContactsBackgroundJobStatus;
};

export function getContactsBackgroundJobs(): ContactsBackgroundJob[] {
  return getModuleBackgroundJobs(MODULE_ID) as ContactsBackgroundJob[];
}

export function getActiveContactsBackgroundJobs(): ContactsBackgroundJob[] {
  return getContactsBackgroundJobs().filter((j) => j.status === 'running');
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

export function dismissContactsBackgroundJob(id: string): void {
  dismissBackgroundJob(id);
}

export function clearCompletedContactsBackgroundJobs(): void {
  clearFinishedBackgroundJobs();
}
