import { and, eq } from 'drizzle-orm';
import { getContactTags, type Contact } from '@mms/shared';
import {
  contactTags,
  contactPhones,
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
} from '../schema.js';
import { type withTenant } from '../tenant-context.js';

type Transaction = Parameters<Parameters<typeof withTenant>[1]>[0];

export async function syncContactChildrenTx(
  tx: Transaction,
  subdomain: string,
  contactId: string,
  contact: Contact,
): Promise<void> {
  await tx
    .delete(contactPhones)
    .where(and(eq(contactPhones.workspaceSubdomain, subdomain), eq(contactPhones.contactId, contactId)));
  if (contact.phones && contact.phones.length > 0) {
    await tx.insert(contactPhones).values(
      contact.phones.map((p, idx) => ({
        id: `phone-${idx + 1}`,
        workspaceSubdomain: subdomain,
        contactId,
        number: p.number,
        label: p.label || 'Main',
        countryCode: p.countryCode ?? null,
        isPrimary: p.isPrimary ?? idx === 0,
        whatsappStatus: p.whatsappStatus ?? null,
        sortOrder: idx,
      })),
    );
  }

  await tx
    .delete(contactTags)
    .where(and(eq(contactTags.workspaceSubdomain, subdomain), eq(contactTags.contactId, contactId)));
  const tagsToSave = getContactTags(contact);
  if (tagsToSave.length > 0) {
    const validTags = Array.from(new Set(tagsToSave.map((t) => String(t).trim()).filter(Boolean)));
    if (validTags.length > 0) {
      await tx.insert(contactTags).values(
        validTags.map((t, idx) => ({
          id: `tag-${idx + 1}`,
          workspaceSubdomain: subdomain,
          contactId,
          name: t,
        })),
      );
    }
  }

  await tx
    .delete(contactEmails)
    .where(and(eq(contactEmails.workspaceSubdomain, subdomain), eq(contactEmails.contactId, contactId)));
  if (contact.emails && contact.emails.length > 0) {
    await tx.insert(contactEmails).values(
      contact.emails.map((e, idx) => ({
        id: `email-${idx + 1}`,
        workspaceSubdomain: subdomain,
        contactId,
        address: e.address,
        label: e.label || 'Primary',
        isPrimary: e.isPrimary ?? idx === 0,
        isVerified: e.isVerified ?? false,
        sortOrder: idx,
      })),
    );
  }

  await tx
    .delete(contactAddresses)
    .where(and(eq(contactAddresses.workspaceSubdomain, subdomain), eq(contactAddresses.contactId, contactId)));
  if (contact.addresses && contact.addresses.length > 0) {
    await tx.insert(contactAddresses).values(
      contact.addresses.map((a, idx) => ({
        id: `addr-${idx + 1}`,
        workspaceSubdomain: subdomain,
        contactId,
        label: a.label ?? null,
        line1: a.line1 ?? null,
        city: a.city ?? null,
        state: a.state ?? null,
        country: a.country ?? null,
        isPrimary: a.isPrimary ?? idx === 0,
        sortOrder: idx,
      })),
    );
  }

  await tx
    .delete(contactSocials)
    .where(and(eq(contactSocials.workspaceSubdomain, subdomain), eq(contactSocials.contactId, contactId)));
  if (contact.socials && contact.socials.length > 0) {
    await tx.insert(contactSocials).values(
      contact.socials.map((s, idx) => ({
        id: `soc-${idx + 1}`,
        workspaceSubdomain: subdomain,
        contactId,
        platform: s.platform,
        url: s.url,
        sortOrder: idx,
      })),
    );
  }

  await tx
    .delete(contactEducations)
    .where(and(eq(contactEducations.workspaceSubdomain, subdomain), eq(contactEducations.contactId, contactId)));
  if (contact.education && contact.education.length > 0) {
    await tx.insert(contactEducations).values(
      contact.education.map((e, idx) => ({
        id: e.id || `edu-${idx + 1}`,
        workspaceSubdomain: subdomain,
        contactId,
        degree: e.degree ?? null,
        institution: e.institution,
        fieldOfStudy: e.fieldOfStudy ?? null,
        year: e.year ?? null,
        grade: e.grade ?? null,
        label: e.label ?? null,
        sortOrder: e.sortOrder ?? idx,
      })),
    );
  }

  await tx
    .delete(contactExperiences)
    .where(and(eq(contactExperiences.workspaceSubdomain, subdomain), eq(contactExperiences.contactId, contactId)));
  if (contact.experience && contact.experience.length > 0) {
    await tx.insert(contactExperiences).values(
      contact.experience.map((exp, idx) => ({
        id: exp.id || `exp-${idx + 1}`,
        workspaceSubdomain: subdomain,
        contactId,
        title: exp.title,
        organization: exp.organization,
        employmentType: exp.employmentType ?? null,
        location: exp.location ?? null,
        startDate: exp.startDate ?? null,
        endDate: exp.endDate ?? null,
        isCurrent: exp.isCurrent ?? false,
        description: exp.description ?? null,
        sortOrder: exp.sortOrder ?? idx,
      })),
    );
  }

  await tx
    .delete(contactSkills)
    .where(and(eq(contactSkills.workspaceSubdomain, subdomain), eq(contactSkills.contactId, contactId)));
  if (contact.skills && contact.skills.length > 0) {
    await tx.insert(contactSkills).values(
      contact.skills.map((s, idx) => ({
        id: s.id || `skl-${idx + 1}`,
        workspaceSubdomain: subdomain,
        contactId,
        name: s.name,
        category: s.category ?? null,
        proficiency: s.proficiency ?? null,
        yearsOfExperience: s.yearsOfExperience ?? null,
        isCertified: s.isCertified ?? false,
        issuer: s.issuer ?? null,
        description: s.description ?? null,
        sortOrder: s.sortOrder ?? idx,
      })),
    );
  }

  await tx
    .delete(contactRelationships)
    .where(and(eq(contactRelationships.workspaceSubdomain, subdomain), eq(contactRelationships.contactId, contactId)));
  const relationships = contact.relationshipContacts ?? [];
  if (relationships.length > 0) {
    await tx.insert(contactRelationships).values(
      relationships.map((r, idx) => ({
        id: `rel-${idx + 1}`,
        workspaceSubdomain: subdomain,
        contactId,
        relatedContactId: r.contactId ? String(r.contactId) : null,
        name: r.name ?? null,
        relationship: r.relationship ?? null,
        phone: r.phone ?? null,
        inferred: r.inferred ?? false,
        inferredFromContactId: r.inferredFromContactId ? String(r.inferredFromContactId) : null,
        inferenceDepth: r.inferenceDepth ?? 0,
        sortOrder: idx,
      })),
    );
  }

  await tx
    .delete(contactActivities)
    .where(and(eq(contactActivities.workspaceSubdomain, subdomain), eq(contactActivities.contactId, contactId)));
  if (contact.activities && contact.activities.length > 0) {
    await tx.insert(contactActivities).values(
      contact.activities.map((act, idx) => ({
        id: act.id || `act-${idx + 1}`,
        workspaceSubdomain: subdomain,
        contactId,
        type: act.type,
        content: act.content,
        date: act.date,
        by: act.by ?? null,
        sortOrder: idx,
      })),
    );
  }

  await tx
    .delete(contactAttachments)
    .where(and(eq(contactAttachments.workspaceSubdomain, subdomain), eq(contactAttachments.contactId, contactId)));
  if (contact.attachments && contact.attachments.length > 0) {
    await tx.insert(contactAttachments).values(
      contact.attachments.map((att, idx) => ({
        id: att.id || `att-${idx + 1}`,
        workspaceSubdomain: subdomain,
        contactId,
        name: att.name,
        type: att.type,
        size: att.size ?? 0,
        url: att.url,
        date: att.date,
        sortOrder: idx,
      })),
    );
  }

  await tx
    .delete(contactBankDetails)
    .where(and(eq(contactBankDetails.workspaceSubdomain, subdomain), eq(contactBankDetails.contactId, contactId)));
  if (contact.bankDetails && contact.bankDetails.length > 0) {
    await tx.insert(contactBankDetails).values(
      contact.bankDetails.map((b, idx) => ({
        id: b.id || `bnk-${idx + 1}`,
        workspaceSubdomain: subdomain,
        contactId,
        bankName: b.bankName,
        accountTitle: b.accountTitle,
        accountNumber: b.accountNumber,
        iban: b.iban ?? null,
        swiftCode: b.swiftCode ?? null,
        branchName: b.branchName ?? null,
        branchCode: b.branchCode ?? null,
        routingNumber: b.routingNumber ?? null,
        currency: b.currency ?? 'PKR',
        isPrimary: b.isPrimary ?? false,
        label: b.label ?? null,
        sortOrder: b.sortOrder ?? idx,
      })),
    );
  }
}
