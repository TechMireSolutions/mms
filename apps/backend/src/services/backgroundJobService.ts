import {
  BACKGROUND_JOBS_MAX_PER_USER,
  type BackgroundJobRecord,
} from '@mms/shared';
import { fetchObject, persistObject } from './dbSyncService.js';

const STORAGE_KEY = 'user_background_jobs';

type UserJobMap = Record<string, BackgroundJobRecord[]>;

async function loadMap(): Promise<UserJobMap> {
  const raw = await fetchObject(STORAGE_KEY);
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as UserJobMap;
  }
  return {};
}

async function saveMap(map: UserJobMap): Promise<void> {
  await persistObject(STORAGE_KEY, map);
}

export async function listUserBackgroundJobs(userId: string): Promise<BackgroundJobRecord[]> {
  const map = await loadMap();
  return (map[userId] ?? []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function upsertUserBackgroundJob(
  userId: string,
  job: BackgroundJobRecord,
): Promise<BackgroundJobRecord> {
  const map = await loadMap();
  const list = map[userId] ?? [];
  const idx = list.findIndex((j) => j.id === job.id);
  if (idx >= 0) {
    list[idx] = job;
  } else {
    list.unshift(job);
  }
  map[userId] = list.slice(0, BACKGROUND_JOBS_MAX_PER_USER);
  await saveMap(map);
  return job;
}

export async function dismissUserBackgroundJob(userId: string, jobId: string): Promise<boolean> {
  const map = await loadMap();
  const list = map[userId] ?? [];
  const next = list.filter((j) => j.id !== jobId);
  if (next.length === list.length) return false;
  map[userId] = next;
  await saveMap(map);
  return true;
}

export async function clearFinishedUserBackgroundJobs(userId: string): Promise<number> {
  const map = await loadMap();
  const list = map[userId] ?? [];
  const next = list.filter((j) => j.status === 'running');
  const removed = list.length - next.length;
  map[userId] = next;
  await saveMap(map);
  return removed;
}
