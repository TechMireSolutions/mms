import type { Contact } from '@mms/shared';

const OUTBOX_KEY = 'mms_contacts_sync_outbox';
const CONFLICTS_KEY = 'mms_contacts_sync_conflicts';

export type ContactsOutboxEntry =
  | { id: string; kind: 'upsert'; contact: Contact; createdAt: string }
  | { id: string; kind: 'update'; contactId: string; contact: Contact; createdAt: string }
  | { id: string; kind: 'delete'; contactId: string; deletionReason?: string; createdAt: string };

export type ContactsSyncConflict = ContactsOutboxEntry & { failedAt: string };

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getContactsOutbox(): ContactsOutboxEntry[] {
  return readJson<ContactsOutboxEntry[]>(OUTBOX_KEY, []);
}

export function getContactsSyncConflicts(): ContactsSyncConflict[] {
  return readJson<ContactsSyncConflict[]>(CONFLICTS_KEY, []);
}

export type ContactsOutboxInput =
  | { kind: 'upsert'; contact: Contact; id?: string }
  | { kind: 'update'; contactId: string; contact: Contact; id?: string }
  | { kind: 'delete'; contactId: string; deletionReason?: string; id?: string };

export function enqueueContactsOutbox(entry: ContactsOutboxInput): void {
  const queue = getContactsOutbox();
  const full = {
    ...entry,
    id: entry.id ?? crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  } as ContactsOutboxEntry;
  queue.push(full);
  writeJson(OUTBOX_KEY, queue);
  window.dispatchEvent(new CustomEvent('contacts-sync-outbox-changed'));
}

function removeOutboxEntry(id: string): void {
  writeJson(
    OUTBOX_KEY,
    getContactsOutbox().filter((outboxEntry) => outboxEntry.id !== id),
  );
  window.dispatchEvent(new CustomEvent('contacts-sync-outbox-changed'));
}

function recordConflict(entry: ContactsOutboxEntry): void {
  const conflicts = getContactsSyncConflicts();
  conflicts.push({ ...entry, failedAt: new Date().toISOString() });
  writeJson(CONFLICTS_KEY, conflicts);
}

export interface ContactsOutboxFlushHandlers {
  upsert: (contact: Contact) => Promise<unknown>;
  update: (contactId: string, contact: Contact) => Promise<unknown>;
  delete: (contactId: string, deletionReason?: string) => Promise<unknown>;
}

export interface ContactsOutboxFlushResult {
  synced: number;
  failed: number;
  conflicts: number;
}

/** Replays queued mutations when back online (globle1 §1.4). */
export async function flushContactsOutbox(
  handlers: ContactsOutboxFlushHandlers,
): Promise<ContactsOutboxFlushResult> {
  const queue = [...getContactsOutbox()];
  let synced = 0;
  let failed = 0;
  let conflicts = 0;

  for (const entry of queue) {
    try {
      if (entry.kind === 'upsert') {
        await handlers.upsert(entry.contact);
      } else if (entry.kind === 'update') {
        await handlers.update(entry.contactId, entry.contact);
      } else {
        await handlers.delete(entry.contactId, entry.deletionReason);
      }
      removeOutboxEntry(entry.id);
      synced += 1;
    } catch {
      removeOutboxEntry(entry.id);
      recordConflict(entry);
      failed += 1;
      conflicts += 1;
    }
  }

  if (synced > 0 || conflicts > 0) {
    window.dispatchEvent(new CustomEvent('contacts-sync-outbox-changed'));
  }

  return { synced, failed, conflicts };
}

export function clearContactsSyncConflicts(): void {
  writeJson(CONFLICTS_KEY, []);
  window.dispatchEvent(new CustomEvent('contacts-sync-outbox-changed'));
}

export function requeueContactsSyncConflict(id: string): void {
  const conflicts = getContactsSyncConflicts();
  const entry = conflicts.find((conflict) => conflict.id === id);
  if (!entry) return;
  const { failedAt: _failedAt, ...outboxEntry } = entry;
  const queue = getContactsOutbox();
  queue.push(outboxEntry);
  writeJson(OUTBOX_KEY, queue);
  dismissContactsSyncConflict(id);
}

export function requeueAllContactsSyncConflicts(): number {
  const conflicts = [...getContactsSyncConflicts()];
  for (const entry of conflicts) {
    requeueContactsSyncConflict(entry.id);
  }
  return conflicts.length;
}

export function dismissContactsSyncConflict(id: string): void {
  writeJson(
    CONFLICTS_KEY,
    getContactsSyncConflicts().filter((conflict) => conflict.id !== id),
  );
  window.dispatchEvent(new CustomEvent('contacts-sync-outbox-changed'));
}

export function describeContactsOutboxEntry(entry: ContactsOutboxEntry): {
  title: string;
  subtitle: string;
} {
  if (entry.kind === 'upsert') {
    const name = entry.contact.name || entry.contact.firstName || String(entry.contact.id);
    return { title: name, subtitle: 'upsert' };
  }
  if (entry.kind === 'update') {
    const name = entry.contact.name || entry.contact.firstName || entry.contactId;
    return { title: String(name), subtitle: 'update' };
  }
  return { title: entry.contactId, subtitle: 'delete' };
}
