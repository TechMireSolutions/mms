import type { Contact } from "@mms/shared";

export const OUTBOX_KEY = "mms_contacts_sync_outbox";
export const CONFLICTS_KEY = "mms_contacts_sync_conflicts";

export type ContactsOutboxEntry =
  | { id: string; kind: "upsert"; contact: Contact; createdAt: string }
  | { id: string; kind: "update"; contactId: string; contact: Contact; createdAt: string }
  | { id: string; kind: "delete"; contactId: string; deletionReason?: string; createdAt: string };

export type ContactsSyncConflict = ContactsOutboxEntry & { failedAt: string };

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function notifyContactsSyncOutboxChanged(): void {
  window.dispatchEvent(new CustomEvent("contacts-sync-outbox-changed"));
}

export function getContactsOutbox(): ContactsOutboxEntry[] {
  return readJson<ContactsOutboxEntry[]>(OUTBOX_KEY, []);
}

export function getContactsSyncConflicts(): ContactsSyncConflict[] {
  return readJson<ContactsSyncConflict[]>(CONFLICTS_KEY, []);
}
