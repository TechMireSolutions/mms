import type { BackgroundJobRecord } from '@mms/shared';
import {
  clearFinishedBackgroundJobsRemote,
  dismissBackgroundJobRemote,
  upsertBackgroundJobRemote,
} from '@/lib/backgroundJobs/backgroundJobApi';

const STORAGE_KEY = 'mms_background_jobs_v2';
const LEGACY_CONTACTS_KEY = 'mms_contacts_background_jobs';
const MAX_JOBS_PER_MODULE = 20;
export const BACKGROUND_JOBS_EVENT = 'mms-background-jobs-changed';

export type BackgroundJobStatus = BackgroundJobRecord['status'];
export type BackgroundJob = BackgroundJobRecord;

type JobStore = Record<string, BackgroundJob[]>;

function readStore(): JobStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as JobStore;
  } catch {
    /* ignore */
  }
  return migrateLegacyContactsJobs();
}

function writeStore(store: JobStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent(BACKGROUND_JOBS_EVENT));
}

function migrateLegacyContactsJobs(): JobStore {
  const store: JobStore = {};
  try {
    const raw = localStorage.getItem(LEGACY_CONTACTS_KEY);
    if (!raw) return store;
    const legacy = JSON.parse(raw) as Array<Omit<BackgroundJob, 'moduleId'>>;
    if (legacy.length > 0) {
      store.contacts = legacy.map((j) => ({ ...j, moduleId: 'contacts' }));
      localStorage.removeItem(LEGACY_CONTACTS_KEY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    }
  } catch {
    /* ignore */
  }
  return store;
}

function syncRemote(job: BackgroundJob): void {
  void upsertBackgroundJobRemote(job).catch(() => {});
}

export function mergeServerBackgroundJobs(serverJobs: BackgroundJob[]): BackgroundJob[] {
  const local = getAllBackgroundJobs();
  const byId = new Map<string, BackgroundJob>();
  for (const job of serverJobs) byId.set(job.id, job);
  for (const job of local) {
    const existing = byId.get(job.id);
    if (!existing || job.status === 'running') {
      byId.set(job.id, job);
    }
  }
  return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function hydrateBackgroundJobsFromServer(serverJobs: BackgroundJob[]): void {
  const store: JobStore = {};
  for (const job of serverJobs) {
    const list = store[job.moduleId] ?? [];
    list.push(job);
    store[job.moduleId] = list.slice(0, MAX_JOBS_PER_MODULE);
  }
  writeStore(store);
}

export function upsertLocalBackgroundJob(job: BackgroundJob): void {
  const store = readStore();
  const list = store[job.moduleId] ?? [];
  const idx = list.findIndex((j) => j.id === job.id);
  if (idx >= 0) {
    list[idx] = job;
  } else {
    list.unshift(job);
  }
  store[job.moduleId] = list.slice(0, MAX_JOBS_PER_MODULE);
  writeStore(store);
}

export function getAllBackgroundJobs(): BackgroundJob[] {
  const store = readStore();
  return Object.values(store)
    .flat()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getModuleBackgroundJobs(moduleId: string): BackgroundJob[] {
  return readStore()[moduleId] ?? [];
}

export function getActiveBackgroundJobs(): BackgroundJob[] {
  return getAllBackgroundJobs().filter((j) => j.status === 'running');
}

export function startBackgroundJob(
  moduleId: string,
  kind: string,
  label: string,
  total?: number,
): string {
  const id = crypto.randomUUID();
  const job: BackgroundJob = {
    id,
    moduleId,
    kind,
    status: 'running',
    label,
    progress: total != null ? { current: 0, total } : undefined,
    createdAt: new Date().toISOString(),
  };
  const store = readStore();
  const list = [job, ...(store[moduleId] ?? [])].slice(0, MAX_JOBS_PER_MODULE);
  store[moduleId] = list;
  writeStore(store);
  syncRemote(job);
  return id;
}

export function updateBackgroundJobProgress(id: string, current: number, total: number): void {
  const store = readStore();
  for (const moduleId of Object.keys(store)) {
    const idx = store[moduleId].findIndex((j) => j.id === id);
    if (idx < 0) continue;
    const job = { ...store[moduleId][idx], progress: { current, total } };
    store[moduleId][idx] = job;
    writeStore(store);
    syncRemote(job);
    return;
  }
}

export function completeBackgroundJob(id: string): void {
  patchJob(id, { status: 'completed', completedAt: new Date().toISOString() });
}

export function failBackgroundJob(id: string, error: string): void {
  patchJob(id, { status: 'failed', error, completedAt: new Date().toISOString() });
}

function patchJob(id: string, patch: Partial<BackgroundJob>): void {
  const store = readStore();
  for (const moduleId of Object.keys(store)) {
    const idx = store[moduleId].findIndex((j) => j.id === id);
    if (idx < 0) continue;
    const job = { ...store[moduleId][idx], ...patch };
    store[moduleId][idx] = job;
    writeStore(store);
    syncRemote(job);
    return;
  }
}

export function dismissBackgroundJob(id: string): void {
  const store = readStore();
  for (const moduleId of Object.keys(store)) {
    store[moduleId] = (store[moduleId] ?? []).filter((j) => j.id !== id);
  }
  writeStore(store);
  void dismissBackgroundJobRemote(id).catch(() => {});
}

export function clearFinishedBackgroundJobs(): void {
  const store = readStore();
  for (const moduleId of Object.keys(store)) {
    store[moduleId] = (store[moduleId] ?? []).filter((j) => j.status === 'running');
  }
  writeStore(store);
  void clearFinishedBackgroundJobsRemote().catch(() => {});
}
