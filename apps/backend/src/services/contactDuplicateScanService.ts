import {
  CONTACTS_MODULE_MANIFEST,
  findContactDuplicatePairs,
  paginateContactDuplicatePairs,
  CONTACTS_DUPLICATE_SCAN_CACHE_OBJECT_KEY,
  type Contact,
  type ContactDuplicatePair,
  type ContactsDuplicatePairsPageResult,
} from '@mms/shared';
import { deletePersistedObject, fetchObject, persistObject } from './dbSyncService.js';
import { loadContactPreferences } from './contactPreferencesService.js';
import { loadContactsPage } from './contactServiceLoad.js';

const CACHE_KEY = CONTACTS_DUPLICATE_SCAN_CACHE_OBJECT_KEY;
const PAGE_SIZE = CONTACTS_MODULE_MANIFEST.maxPageSize;

export interface ContactDuplicateScanCache {
  computedAt: string;
  contactCount: number;
  pairCount: number;
  pairs: ContactDuplicatePair[];
}

/**
 * SQL-paginate active contacts for duplicate pairing (no single full-list hydrate).
 * Pair finding still needs the full active set in memory after the walk.
 */
async function loadActiveContactsPaged(
  onProgress?: (processed: number, total: number) => void | Promise<void>,
): Promise<Contact[]> {
  const contacts: Contact[] = [];
  let page = 1;
  for (;;) {
    const pageResult = await loadContactsPage({
      page,
      limit: PAGE_SIZE,
      includeDeleted: false,
    });
    contacts.push(...(pageResult.contacts as Contact[]));
    await onProgress?.(contacts.length, pageResult.total);
    if (!pageResult.hasMore) break;
    page += 1;
  }
  return contacts;
}

export async function getDuplicateScanCache(): Promise<ContactDuplicateScanCache | null> {
  const raw = await fetchObject(CACHE_KEY);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const cache = raw as ContactDuplicateScanCache;
  if (!Array.isArray(cache.pairs)) return null;
  return cache;
}

export async function invalidateDuplicateScanCache(): Promise<void> {
  await deletePersistedObject(CACHE_KEY);
}

export async function getCachedDuplicatePairs(): Promise<ContactDuplicatePair[] | null> {
  const cache = await getDuplicateScanCache();
  return cache?.pairs ?? null;
}

export async function runContactsDuplicateScan(
  onProgress?: (processed: number, total: number) => void | Promise<void>,
): Promise<{ pairCount: number; contactCount: number }> {
  const contacts = await loadActiveContactsPaged(onProgress);
  const total = contacts.length;

  const preferences = (await loadContactPreferences()) ?? {};
  const pairs = findContactDuplicatePairs(contacts, preferences);

  const cache: ContactDuplicateScanCache = {
    computedAt: new Date().toISOString(),
    contactCount: total,
    pairCount: pairs.length,
    pairs,
  };
  await persistObject(CACHE_KEY, cache);
  await onProgress?.(total, total);

  return { pairCount: pairs.length, contactCount: total };
}

export async function loadDuplicatePairsPage(query: {
  page?: number;
  limit?: number;
}): Promise<ContactsDuplicatePairsPageResult> {
  let pairs = await getCachedDuplicatePairs();
  if (!pairs) {
    const contacts = await loadActiveContactsPaged();
    const preferences = (await loadContactPreferences()) ?? {};
    pairs = findContactDuplicatePairs(contacts, preferences);
  }
  return paginateContactDuplicatePairs(pairs, query.page ?? 1, query.limit ?? 50);
}

/** Count duplicate matches for a draft contact (globle2 §10 — server-side, no client full list). */
export async function countContactDuplicateMatches(contact: Contact): Promise<number> {
  const contacts = await loadActiveContactsPaged();
  const preferences = (await loadContactPreferences()) ?? {};
  const peers = contacts.filter((row) => String(row.id) !== String(contact.id));
  const pairs = findContactDuplicatePairs([...peers, contact], preferences);
  return pairs.filter((pair) =>
    pair.contacts.some((row) => String(row.id) === String(contact.id)),
  ).length;
}
