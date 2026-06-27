import { and, eq, sql } from 'drizzle-orm';
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
  } catch (err) {
    console.error(`Failed to parse contact customData for id=${row.id}:`, err);
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

  await db.insert(contacts)
    .values(
      list.map((c) => {
        const { id: _, ...extra } = c;
        return {
          id: String(c.id),
          workspaceSubdomain: subdomain,
          customData: JSON.stringify(extra),
          updatedAt: new Date(),
        };
      })
    )
    .onConflictDoUpdate({
      target: contacts.id,
      set: {
        customData: sql`(COALESCE(NULLIF(${contacts.customData}, ''), '{}')::jsonb || EXCLUDED.custom_data::jsonb)::text`,
        updatedAt: new Date(),
      },
    });
}

export async function deleteContact(workspaceSubdomain: string, id: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await getDb()
    .delete(contacts)
    .where(and(eq(contacts.workspaceSubdomain, subdomain), eq(contacts.id, id)));
}
