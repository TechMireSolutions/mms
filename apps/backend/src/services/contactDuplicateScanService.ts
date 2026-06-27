import {
  filterActiveContacts,
  findContactDuplicatePairs,
  paginateContactDuplicatePairs,
  type Contact,
  type ContactDuplicatePair,
  type ContactsDuplicatePairsPageResult,
} from '@mms/shared';
import { contactListSchema } from '../validation/contactSchemas.js';
import { deletePersistedObject, fetchCollection, fetchObject, persistObject } from './dbSyncService.js';
import { loadContactPreferences } from './contactPreferencesService.js';

const CACHE_KEY = 'contacts_duplicate_scan_cache';

export interface ContactDuplicateScanCache {
  computedAt: string;
  contactCount: number;
  pairCount: number;
  pairs: ContactDuplicatePair[];
}

async function loadActiveContacts(): Promise<Contact[]> {
  const contactCollection = await fetchCollection('contacts');
  const parsedContacts = contactListSchema.safeParse(contactCollection ?? []);
  const allContacts = parsedContacts.success ? (parsedContacts.data as Contact[]) : [];
  return filterActiveContacts(allContacts);
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
  const contacts = await loadActiveContacts();
  const total = contacts.length;
  await onProgress?.(0, total);

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
    const contacts = await loadActiveContacts();
    const preferences = (await loadContactPreferences()) ?? {};
    pairs = findContactDuplicatePairs(contacts, preferences);
  }
  return paginateContactDuplicatePairs(pairs, query.page ?? 1, query.limit ?? 50);
}

/** Count duplicate matches for a draft contact (globle2 §10 — server-side, no client full list). */
export async function countContactDuplicateMatches(contact: Contact): Promise<number> {
  const contacts = await loadActiveContacts();
  const preferences = (await loadContactPreferences()) ?? {};
  const peers = contacts.filter((row) => String(row.id) !== String(contact.id));
  const pairs = findContactDuplicatePairs([...peers, contact], preferences);
  return pairs.filter((pair) =>
    pair.contacts.some((row) => String(row.id) === String(contact.id)),
  ).length;
}
