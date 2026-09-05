import { and, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm';
import {
  hydrateContactRelationshipFields,
  type Contact,
} from '@mms/shared';
import { contacts } from '../schema.js';
import { withTenant } from '../tenant-context.js';
import { loadContactChildMaps, loadContactSummaryChildMaps } from './contactRepositoryHydrateChildren.js';
import { contactRowToRecord } from './contactRepositoryMappers.js';

type Transaction = Parameters<Parameters<typeof withTenant>[1]>[0];
type ContactRow = typeof contacts.$inferSelect;

export function hydrateContact(contact: Contact): Contact {
  return hydrateContactRelationshipFields(contact);
}

export async function hydrateContactsList(
  tx: Transaction,
  subdomain: string,
  contactRows: ContactRow[],
): Promise<Contact[]> {
  if (contactRows.length === 0) return [];
  const contactIds = contactRows.map((c) => c.id);
  const childMaps = await loadContactChildMaps(tx, subdomain, contactIds);

  return contactRows.map((row) =>
    contactRowToRecord(
      row,
      childMaps.phonesMap.get(row.id) ?? [],
      childMaps.emailsMap.get(row.id) ?? [],
      childMaps.addressesMap.get(row.id) ?? [],
      childMaps.tagsMap.get(row.id) ?? [],
      childMaps.socialsMap.get(row.id) ?? [],
      childMaps.educationsMap.get(row.id) ?? [],
      childMaps.experiencesMap.get(row.id) ?? [],
      childMaps.skillsMap.get(row.id) ?? [],
      childMaps.relationshipsMap.get(row.id) ?? [],
      childMaps.activitiesMap.get(row.id) ?? [],
      childMaps.attachmentsMap.get(row.id) ?? [],
      childMaps.bankDetailsMap.get(row.id) ?? [],
    ),
  );
}

export async function hydrateContactsSummaryList(
  tx: Transaction,
  subdomain: string,
  contactRows: ContactRow[],
): Promise<Contact[]> {
  if (contactRows.length === 0) return [];
  const contactIds = contactRows.map((c) => c.id);
  const childMaps = await loadContactSummaryChildMaps(tx, subdomain, contactIds);

  return contactRows.map((row) =>
    contactRowToRecord(
      row,
      childMaps.phonesMap.get(row.id) ?? [],
      childMaps.emailsMap.get(row.id) ?? [],
      childMaps.addressesMap.get(row.id) ?? [],
      childMaps.tagsMap.get(row.id) ?? [],
      childMaps.socialsMap.get(row.id) ?? [],
      [],
      [],
      [],
      childMaps.relationshipsMap.get(row.id) ?? [],
      [],
      [],
      [],
    ),
  );
}

export interface ListByWorkspaceOptions {
  includeDeleted?: boolean;
  deleted?: 'active' | 'deleted' | 'all';
  limit?: number;
  offset?: number;
}

function resolveDeletedFilter(options?: ListByWorkspaceOptions) {
  if (options?.deleted === 'deleted') {
    return isNotNull(contacts.deletedAt);
  }
  if (options?.deleted === 'all' || options?.includeDeleted) {
    return null;
  }
  return isNull(contacts.deletedAt);
}

export async function listContactsByWorkspace(
  tenant: string,
  options?: ListByWorkspaceOptions,
): Promise<Contact[]> {
  const subdomain = tenant.trim().toLowerCase();
  const limit = Math.min(Math.max(options?.limit ?? 500, 1), 5000);
  const offset = Math.max(options?.offset ?? 0, 0);
  return withTenant(subdomain, async (tx) => {
    const conditions = [eq(contacts.workspaceSubdomain, subdomain)];
    const deletedCond = resolveDeletedFilter(options);
    if (deletedCond) conditions.push(deletedCond);

    const rows = await tx
      .select({
        id: contacts.id,
        workspaceSubdomain: contacts.workspaceSubdomain,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        name: contacts.name,
        gender: contacts.gender,
        dob: contacts.dob,
        cnic: contacts.cnic,
        isSyed: contacts.isSyed,
        avatar: contacts.avatar,
        notes: contacts.notes,
        whatsappStatus: contacts.whatsappStatus,
        lastCheckedAt: contacts.lastCheckedAt,
        aiSummary: contacts.aiSummary,
        deletedAt: contacts.deletedAt,
        deletedBy: contacts.deletedBy,
        deletionReason: contacts.deletionReason,
        createdAt: contacts.createdAt,
        updatedAt: contacts.updatedAt,
        createdBy: contacts.createdBy,
        updatedBy: contacts.updatedBy,
      })
      .from(contacts)
      .where(and(...conditions))
      .orderBy(contacts.name)
      .limit(limit)
      .offset(offset);
    return hydrateContactsList(tx, subdomain, rows);
  });
}

export async function countContactsByWorkspace(
  tenant: string,
  options?: ListByWorkspaceOptions,
): Promise<number> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const conditions = [eq(contacts.workspaceSubdomain, subdomain)];
    const deletedCond = resolveDeletedFilter(options);
    if (deletedCond) conditions.push(deletedCond);

    const rows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(contacts)
      .where(and(...conditions));
    return Number(rows[0]?.count ?? 0);
  });
}

export async function findContactById(tenant: string, id: string): Promise<Contact | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: contacts.id,
        workspaceSubdomain: contacts.workspaceSubdomain,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        name: contacts.name,
        gender: contacts.gender,
        dob: contacts.dob,
        cnic: contacts.cnic,
        isSyed: contacts.isSyed,
        avatar: contacts.avatar,
        notes: contacts.notes,
        whatsappStatus: contacts.whatsappStatus,
        lastCheckedAt: contacts.lastCheckedAt,
        aiSummary: contacts.aiSummary,
        deletedAt: contacts.deletedAt,
        deletedBy: contacts.deletedBy,
        deletionReason: contacts.deletionReason,
        createdAt: contacts.createdAt,
        updatedAt: contacts.updatedAt,
        createdBy: contacts.createdBy,
        updatedBy: contacts.updatedBy,
      })
      .from(contacts)
      .where(and(eq(contacts.workspaceSubdomain, subdomain), eq(contacts.id, id)))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    const [result] = await hydrateContactsList(tx, subdomain, [row]);
    return result ?? null;
  });
}

export async function findContactsByIds(tenant: string, ids: string[]): Promise<Contact[]> {
  if (ids.length === 0) return [];
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: contacts.id,
        workspaceSubdomain: contacts.workspaceSubdomain,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        name: contacts.name,
        gender: contacts.gender,
        dob: contacts.dob,
        cnic: contacts.cnic,
        isSyed: contacts.isSyed,
        avatar: contacts.avatar,
        notes: contacts.notes,
        whatsappStatus: contacts.whatsappStatus,
        lastCheckedAt: contacts.lastCheckedAt,
        aiSummary: contacts.aiSummary,
        deletedAt: contacts.deletedAt,
        deletedBy: contacts.deletedBy,
        deletionReason: contacts.deletionReason,
        createdAt: contacts.createdAt,
        updatedAt: contacts.updatedAt,
        createdBy: contacts.createdBy,
        updatedBy: contacts.updatedBy,
      })
      .from(contacts)
      .where(and(eq(contacts.workspaceSubdomain, subdomain), inArray(contacts.id, ids)));
    return hydrateContactsList(tx, subdomain, rows);
  });
}
