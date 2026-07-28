import type { Contact } from "@mms/shared";
import {
  OUTBOX_KEY,
  getContactsOutbox,
  notifyContactsSyncOutboxChanged,
  writeJson,
  type ContactsOutboxEntry,
} from "@/lib/contacts/contactsSyncOutboxStorage";
import { recordContactsSyncConflict } from "@/lib/contacts/contactsSyncOutboxConflicts";

export type ContactsOutboxInput =
  | { kind: "upsert"; contact: Contact; id?: string }
  | { kind: "update"; contactId: string; contact: Contact; id?: string }
  | { kind: "delete"; contactId: string; deletionReason?: string; id?: string };

export function enqueueContactsOutbox(entry: ContactsOutboxInput): void {
  const queue = getContactsOutbox();
  const full = {
    ...entry,
    id: entry.id ?? crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  } as ContactsOutboxEntry;
  queue.push(full);
  writeJson(OUTBOX_KEY, queue);
  notifyContactsSyncOutboxChanged();
}

function removeOutboxEntry(id: string): void {
  writeJson(
    OUTBOX_KEY,
    getContactsOutbox().filter((outboxEntry) => outboxEntry.id !== id),
  );
  notifyContactsSyncOutboxChanged();
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
      if (entry.kind === "upsert") {
        await handlers.upsert(entry.contact);
      } else if (entry.kind === "update") {
        await handlers.update(entry.contactId, entry.contact);
      } else {
        await handlers.delete(entry.contactId, entry.deletionReason);
      }
      removeOutboxEntry(entry.id);
      synced += 1;
    } catch {
      removeOutboxEntry(entry.id);
      recordContactsSyncConflict(entry);
      failed += 1;
      conflicts += 1;
    }
  }

  if (synced > 0 || conflicts > 0) {
    notifyContactsSyncOutboxChanged();
  }

  return { synced, failed, conflicts };
}
