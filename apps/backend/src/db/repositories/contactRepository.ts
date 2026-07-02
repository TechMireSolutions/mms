import { and, eq, inArray, sql } from 'drizzle-orm';
import type { Contact } from '@mms/shared';
import { getDb } from '../dbClient.js';
import { contacts } from '../schema.js';

function rowToContact(row: typeof contacts.$inferSelect): Contact {
  try {
    const extra = JSON.parse(row.customData) as Omit<Contact, 'id'>;
    return {
      ...extra,
      id: row.id,
    } as Contact;
  } catch (error) {
    console.error(`Failed to parse contact customData for id=${row.id}:`, error);
    return { id: row.id } as Contact;
  }
}

export async function listContactsByWorkspace(workspaceSubdomain: string): Promise<Contact[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb()
    .select()
    .from(contacts)
    .where(eq(contacts.workspaceSubdomain, subdomain));
  return rows.map(rowToContact);
}

export async function findContactById(workspaceSubdomain: string, id: string): Promise<Contact | null> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb()
    .select()
    .from(contacts)
    .where(and(eq(contacts.workspaceSubdomain, subdomain), eq(contacts.id, id)));
  const row = rows[0];
  return row ? rowToContact(row) : null;
}

export async function findContactsByIds(workspaceSubdomain: string, ids: string[]): Promise<Contact[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  if (ids.length === 0) return [];
  const rows = await getDb()
    .select()
    .from(contacts)
    .where(and(eq(contacts.workspaceSubdomain, subdomain), inArray(contacts.id, ids)));
  return rows.map(rowToContact);
}

export async function saveContact(workspaceSubdomain: string, contact: Contact): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const id = String(contact.id);
  const { id: _, ...extra } = contact;
  const customDataJson = JSON.stringify(extra);
  const db = getDb();

  const existing = await db
    .select({ id: contacts.id })
    .from(contacts)
    .where(and(eq(contacts.workspaceSubdomain, subdomain), eq(contacts.id, id)));

  if (existing.length > 0) {
    await db
      .update(contacts)
      .set({
        customData: sql`(COALESCE(NULLIF(${contacts.customData}, ''), '{}')::jsonb || ${customDataJson}::jsonb)::text`,
        updatedAt: new Date(),
      })
      .where(and(eq(contacts.workspaceSubdomain, subdomain), eq(contacts.id, id)));
  } else {
    await db.insert(contacts).values({
      id,
      workspaceSubdomain: subdomain,
      customData: customDataJson,
      updatedAt: new Date(),
    });
  }
}

export async function bulkSaveContacts(workspaceSubdomain: string, list: Contact[]): Promise<void> {
  if (list.length === 0) return;
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();

  const values = list.map((contact) => {
    const id = String(contact.id);
    const { id: _, ...extra } = contact;
    return {
      id,
      workspaceSubdomain: subdomain,
      customData: JSON.stringify(extra),
      updatedAt: new Date(),
    };
  });

  await db
    .insert(contacts)
    .values(values)
    .onConflictDoUpdate({
      target: contacts.id,
      set: {
        customData: sql`(COALESCE(NULLIF(${contacts.customData}, ''), '{}')::jsonb || excluded.custom_data::jsonb)::text`,
        updatedAt: sql`excluded.updated_at`,
      },
    });
}

export async function deleteContact(workspaceSubdomain: string, id: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await getDb()
    .delete(contacts)
    .where(and(eq(contacts.workspaceSubdomain, subdomain), eq(contacts.id, id)));
}

export async function replaceContactsForWorkspace(
  workspaceSubdomain: string,
  list: Contact[],
): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();

  await db.delete(contacts).where(eq(contacts.workspaceSubdomain, subdomain));

  if (list.length === 0) return;

  const values = list.map((contact) => {
    const id = String(contact.id);
    const { id: _, ...extra } = contact;
    return {
      id,
      workspaceSubdomain: subdomain,
      customData: JSON.stringify(extra),
      updatedAt: new Date(),
    };
  });

  await db.insert(contacts).values(values);
}

export async function deleteContactsByWorkspace(workspaceSubdomain: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await getDb()
    .delete(contacts)
    .where(eq(contacts.workspaceSubdomain, subdomain));
}

