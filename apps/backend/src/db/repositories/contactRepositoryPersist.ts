import { eq } from 'drizzle-orm';
import {
  hydrateContactRelationshipFields,
  type Contact,
} from '@mms/shared';
import { contacts } from '../schema.js';
import { withTenant } from '../tenant-context.js';
import {
  countContactsByWorkspace,
  findContactById,
  findContactsByIds,
  listContactsByWorkspace,
} from './contactRepositoryHydrate.js';
import { syncContactChildrenTx } from './contactRepositoryPersistChildren.js';

type Transaction = Parameters<Parameters<typeof withTenant>[1]>[0];

export async function persistContactTx(
  tx: Transaction,
  subdomain: string,
  rawContact: Contact,
): Promise<void> {
  const contact = hydrateContactRelationshipFields(rawContact);
  const contactId = String(contact.id);
  const fullName = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unnamed';

  await tx
    .insert(contacts)
    .values({
      id: contactId,
      workspaceSubdomain: subdomain,
      firstName: contact.firstName || fullName,
      lastName: contact.lastName ?? null,
      name: fullName,
      gender: contact.gender ?? null,
      dob: contact.dob ?? null,
      cnic: contact.cnic ?? null,
      isSyed: contact.isSyed ?? false,
      avatar: contact.avatar ?? null,
      notes: contact.notes ?? null,
      whatsappStatus: contact.whatsappStatus ?? 'unknown',
      lastCheckedAt: contact.lastCheckedAt ?? null,
      preferredLanguage: contact.preferredLanguage ?? null,
      preferredContactMethod: contact.preferredContactMethod ?? null,
      doNotContact: contact.doNotContact ?? false,
      aiSummary: contact.aiSummary ?? null,
      deletedAt: contact.deletedAt ? new Date(contact.deletedAt) : null,
      deletedBy: contact.deletedBy ?? null,
      deletionReason: contact.deletionReason ?? null,
      createdAt: contact.createdAt ? new Date(contact.createdAt) : new Date(),
      updatedAt: new Date(),
      createdBy: contact.createdBy ?? null,
      updatedBy: contact.updatedBy ?? null,
    })
    .onConflictDoUpdate({
      target: [contacts.workspaceSubdomain, contacts.id],
      set: {
        firstName: contact.firstName || fullName,
        lastName: contact.lastName ?? null,
        name: fullName,
        gender: contact.gender ?? null,
        dob: contact.dob ?? null,
        cnic: contact.cnic ?? null,
        isSyed: contact.isSyed ?? false,
        avatar: contact.avatar ?? null,
        notes: contact.notes ?? null,
        whatsappStatus: contact.whatsappStatus ?? 'unknown',
        lastCheckedAt: contact.lastCheckedAt ?? null,
        preferredLanguage: contact.preferredLanguage ?? null,
        preferredContactMethod: contact.preferredContactMethod ?? null,
        doNotContact: contact.doNotContact ?? false,
        aiSummary: contact.aiSummary ?? null,
        deletedAt: contact.deletedAt ? new Date(contact.deletedAt) : null,
        deletedBy: contact.deletedBy ?? null,
        deletionReason: contact.deletionReason ?? null,
        updatedAt: new Date(),
        updatedBy: contact.updatedBy ?? null,
      },
    });

  await syncContactChildrenTx(tx, subdomain, contactId, contact);
}

export async function saveContact(tenant: string, contact: Contact): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await persistContactTx(tx, subdomain, contact);
  });
}

export async function bulkSaveContacts(tenant: string, records: Contact[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    for (const record of records) {
      await persistContactTx(tx, subdomain, record);
    }
  });
}

export async function replaceContactsForWorkspace(tenant: string, records: Contact[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(contacts).where(eq(contacts.workspaceSubdomain, subdomain));
    for (const record of records) {
      await persistContactTx(tx, subdomain, record);
    }
  });
}

export const contactRepo = {
  listByWorkspace: listContactsByWorkspace,
  countByWorkspace: countContactsByWorkspace,
  findById: findContactById,
  findByIds: findContactsByIds,
  save: saveContact,
  bulkSave: bulkSaveContacts,
  replaceForWorkspace: replaceContactsForWorkspace,
};
