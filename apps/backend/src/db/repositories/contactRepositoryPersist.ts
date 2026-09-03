import { and, eq, inArray, sql } from 'drizzle-orm';
import {
  hydrateContactRelationshipFields,
  type Contact,
} from '@mms/shared';
import {
  contacts,
  contactPhones,
  contactTags,
  contactEmails,
  contactAddresses,
  contactSocials,
  contactEducations,
  contactExperiences,
  contactSkills,
  contactRelationships,
  contactActivities,
  contactAttachments,
  contactBankDetails,
  students,
  teachers,
  tenantUsers,
} from '../schema.js';
import { withTenant } from '../tenant-context.js';
import {
  countContactsByWorkspace,
  findContactById,
  findContactsByIds,
  listContactsByWorkspace,
} from './contactRepositoryHydrate.js';
import { syncContactChildrenTx, bulkInsertContactChildrenTx } from './contactRepositoryPersistChildren.js';

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
    const hydratedRecords = records.map(hydrateContactRelationshipFields);
    const contactIds = hydratedRecords.map((c) => String(c.id));

    await tx
      .insert(contacts)
      .values(
        hydratedRecords.map((contact) => {
          const fullName = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unnamed';
          return {
            id: String(contact.id),
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
            aiSummary: contact.aiSummary ?? null,
            deletedAt: contact.deletedAt ? new Date(contact.deletedAt) : null,
            deletedBy: contact.deletedBy ?? null,
            deletionReason: contact.deletionReason ?? null,
            createdAt: contact.createdAt ? new Date(contact.createdAt) : new Date(),
            updatedAt: new Date(),
            createdBy: contact.createdBy ?? null,
            updatedBy: contact.updatedBy ?? null,
          };
        }),
      )
      .onConflictDoUpdate({
        target: [contacts.workspaceSubdomain, contacts.id],
        set: {
          firstName: sql`excluded.first_name`,
          lastName: sql`excluded.last_name`,
          name: sql`excluded.name`,
          gender: sql`excluded.gender`,
          dob: sql`excluded.dob`,
          cnic: sql`excluded.cnic`,
          isSyed: sql`excluded.is_syed`,
          avatar: sql`excluded.avatar`,
          notes: sql`excluded.notes`,
          whatsappStatus: sql`excluded.whatsapp_status`,
          lastCheckedAt: sql`excluded.last_checked_at`,
          aiSummary: sql`excluded.ai_summary`,
          deletedAt: sql`excluded.deleted_at`,
          deletedBy: sql`excluded.deleted_by`,
          deletionReason: sql`excluded.deletion_reason`,
          updatedAt: new Date(),
          updatedBy: sql`excluded.updated_by`,
        },
      });

    await Promise.all([
      tx.delete(contactPhones).where(and(eq(contactPhones.workspaceSubdomain, subdomain), inArray(contactPhones.contactId, contactIds))),
      tx.delete(contactTags).where(and(eq(contactTags.workspaceSubdomain, subdomain), inArray(contactTags.contactId, contactIds))),
      tx.delete(contactEmails).where(and(eq(contactEmails.workspaceSubdomain, subdomain), inArray(contactEmails.contactId, contactIds))),
      tx.delete(contactAddresses).where(and(eq(contactAddresses.workspaceSubdomain, subdomain), inArray(contactAddresses.contactId, contactIds))),
      tx.delete(contactSocials).where(and(eq(contactSocials.workspaceSubdomain, subdomain), inArray(contactSocials.contactId, contactIds))),
      tx.delete(contactEducations).where(and(eq(contactEducations.workspaceSubdomain, subdomain), inArray(contactEducations.contactId, contactIds))),
      tx.delete(contactExperiences).where(and(eq(contactExperiences.workspaceSubdomain, subdomain), inArray(contactExperiences.contactId, contactIds))),
      tx.delete(contactSkills).where(and(eq(contactSkills.workspaceSubdomain, subdomain), inArray(contactSkills.contactId, contactIds))),
      tx.delete(contactRelationships).where(and(eq(contactRelationships.workspaceSubdomain, subdomain), inArray(contactRelationships.contactId, contactIds))),
      tx.delete(contactActivities).where(and(eq(contactActivities.workspaceSubdomain, subdomain), inArray(contactActivities.contactId, contactIds))),
      tx.delete(contactAttachments).where(and(eq(contactAttachments.workspaceSubdomain, subdomain), inArray(contactAttachments.contactId, contactIds))),
      tx.delete(contactBankDetails).where(and(eq(contactBankDetails.workspaceSubdomain, subdomain), inArray(contactBankDetails.contactId, contactIds))),
    ]);

    await bulkInsertContactChildrenTx(tx, subdomain, hydratedRecords);
  });
}

export async function replaceContactsForWorkspace(tenant: string, records: Contact[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .update(students)
      .set({ contactId: null, fatherContactId: null, motherContactId: null, guardianContactId: null })
      .where(eq(students.workspaceSubdomain, subdomain));
    await tx.update(teachers).set({ contactId: null }).where(eq(teachers.workspaceSubdomain, subdomain));
    await tx.update(tenantUsers).set({ contactId: null }).where(eq(tenantUsers.workspaceSubdomain, subdomain));
    await tx.delete(contacts).where(eq(contacts.workspaceSubdomain, subdomain));
    if (records.length === 0) return;

    const hydratedRecords = records.map(hydrateContactRelationshipFields);
    await tx.insert(contacts).values(
      hydratedRecords.map((contact) => {
        const fullName = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unnamed';
        return {
          id: String(contact.id),
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
          aiSummary: contact.aiSummary ?? null,
          deletedAt: contact.deletedAt ? new Date(contact.deletedAt) : null,
          deletedBy: contact.deletedBy ?? null,
          deletionReason: contact.deletionReason ?? null,
          createdAt: contact.createdAt ? new Date(contact.createdAt) : new Date(),
          updatedAt: new Date(),
          createdBy: contact.createdBy ?? null,
          updatedBy: contact.updatedBy ?? null,
        };
      }),
    );

    await bulkInsertContactChildrenTx(tx, subdomain, hydratedRecords);
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
