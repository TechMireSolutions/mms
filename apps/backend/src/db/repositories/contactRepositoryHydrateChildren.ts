import { and, eq, inArray } from 'drizzle-orm';
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
type PhoneRow = typeof contactPhones.$inferSelect;
type EmailRow = typeof contactEmails.$inferSelect;
type AddressRow = typeof contactAddresses.$inferSelect;
type TagRow = typeof contactTags.$inferSelect;
type SocialRow = typeof contactSocials.$inferSelect;
type EducationRow = typeof contactEducations.$inferSelect;
type ExperienceRow = typeof contactExperiences.$inferSelect;
type SkillRow = typeof contactSkills.$inferSelect;
type RelationshipRow = typeof contactRelationships.$inferSelect;
type ActivityRow = typeof contactActivities.$inferSelect;
type AttachmentRow = typeof contactAttachments.$inferSelect;
type BankDetailRow = typeof contactBankDetails.$inferSelect;

export interface ContactChildMaps {
  phonesMap: Map<string, PhoneRow[]>;
  emailsMap: Map<string, EmailRow[]>;
  addressesMap: Map<string, AddressRow[]>;
  tagsMap: Map<string, TagRow[]>;
  socialsMap: Map<string, SocialRow[]>;
  educationsMap: Map<string, EducationRow[]>;
  experiencesMap: Map<string, ExperienceRow[]>;
  skillsMap: Map<string, SkillRow[]>;
  relationshipsMap: Map<string, RelationshipRow[]>;
  activitiesMap: Map<string, ActivityRow[]>;
  attachmentsMap: Map<string, AttachmentRow[]>;
  bankDetailsMap: Map<string, BankDetailRow[]>;
}

function groupByContactId<T extends { contactId: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const list = map.get(row.contactId) ?? [];
    list.push(row);
    map.set(row.contactId, list);
  }
  return map;
}

export async function loadContactChildMaps(
  tx: Transaction,
  subdomain: string,
  contactIds: string[],
): Promise<ContactChildMaps> {
  const [
    phonesRows,
    emailsRows,
    addressesRows,
    tagsRows,
    socialsRows,
    educationsRows,
    experiencesRows,
    skillsRows,
    relationshipsRows,
    activitiesRows,
    attachmentsRows,
    bankDetailsRows,
  ] = await Promise.all([
    tx
      .select({
        id: contactPhones.id,
        contactId: contactPhones.contactId,
        workspaceSubdomain: contactPhones.workspaceSubdomain,
        number: contactPhones.number,
        label: contactPhones.label,
        countryCode: contactPhones.countryCode,
        isPrimary: contactPhones.isPrimary,
        whatsappStatus: contactPhones.whatsappStatus,
        sortOrder: contactPhones.sortOrder,
        createdAt: contactPhones.createdAt,
      })
      .from(contactPhones)
      .where(
        and(
          eq(contactPhones.workspaceSubdomain, subdomain),
          inArray(contactPhones.contactId, contactIds),
        ),
      )
      .orderBy(contactPhones.sortOrder),
    tx
      .select({
        id: contactEmails.id,
        contactId: contactEmails.contactId,
        workspaceSubdomain: contactEmails.workspaceSubdomain,
        address: contactEmails.address,
        label: contactEmails.label,
        isPrimary: contactEmails.isPrimary,
        isVerified: contactEmails.isVerified,
        sortOrder: contactEmails.sortOrder,
        createdAt: contactEmails.createdAt,
      })
      .from(contactEmails)
      .where(
        and(
          eq(contactEmails.workspaceSubdomain, subdomain),
          inArray(contactEmails.contactId, contactIds),
        ),
      )
      .orderBy(contactEmails.sortOrder),
    tx
      .select({
        id: contactAddresses.id,
        contactId: contactAddresses.contactId,
        workspaceSubdomain: contactAddresses.workspaceSubdomain,
        label: contactAddresses.label,
        line1: contactAddresses.line1,
        city: contactAddresses.city,
        state: contactAddresses.state,
        country: contactAddresses.country,
        isPrimary: contactAddresses.isPrimary,
        sortOrder: contactAddresses.sortOrder,
        createdAt: contactAddresses.createdAt,
      })
      .from(contactAddresses)
      .where(
        and(
          eq(contactAddresses.workspaceSubdomain, subdomain),
          inArray(contactAddresses.contactId, contactIds),
        ),
      )
      .orderBy(contactAddresses.sortOrder),
    tx
      .select({
        id: contactTags.id,
        contactId: contactTags.contactId,
        workspaceSubdomain: contactTags.workspaceSubdomain,
        name: contactTags.name,
        createdAt: contactTags.createdAt,
      })
      .from(contactTags)
      .where(
        and(
          eq(contactTags.workspaceSubdomain, subdomain),
          inArray(contactTags.contactId, contactIds),
        ),
      )
      .orderBy(contactTags.createdAt),
    tx
      .select({
        id: contactSocials.id,
        contactId: contactSocials.contactId,
        workspaceSubdomain: contactSocials.workspaceSubdomain,
        platform: contactSocials.platform,
        url: contactSocials.url,
        sortOrder: contactSocials.sortOrder,
        createdAt: contactSocials.createdAt,
      })
      .from(contactSocials)
      .where(
        and(
          eq(contactSocials.workspaceSubdomain, subdomain),
          inArray(contactSocials.contactId, contactIds),
        ),
      )
      .orderBy(contactSocials.sortOrder),
    tx
      .select({
        id: contactEducations.id,
        contactId: contactEducations.contactId,
        workspaceSubdomain: contactEducations.workspaceSubdomain,
        degree: contactEducations.degree,
        institution: contactEducations.institution,
        fieldOfStudy: contactEducations.fieldOfStudy,
        year: contactEducations.year,
        grade: contactEducations.grade,
        label: contactEducations.label,
        sortOrder: contactEducations.sortOrder,
        createdAt: contactEducations.createdAt,
      })
      .from(contactEducations)
      .where(
        and(
          eq(contactEducations.workspaceSubdomain, subdomain),
          inArray(contactEducations.contactId, contactIds),
        ),
      )
      .orderBy(contactEducations.sortOrder),
    tx
      .select({
        id: contactExperiences.id,
        contactId: contactExperiences.contactId,
        workspaceSubdomain: contactExperiences.workspaceSubdomain,
        title: contactExperiences.title,
        organization: contactExperiences.organization,
        employmentType: contactExperiences.employmentType,
        location: contactExperiences.location,
        startDate: contactExperiences.startDate,
        endDate: contactExperiences.endDate,
        isCurrent: contactExperiences.isCurrent,
        description: contactExperiences.description,
        sortOrder: contactExperiences.sortOrder,
        createdAt: contactExperiences.createdAt,
      })
      .from(contactExperiences)
      .where(
        and(
          eq(contactExperiences.workspaceSubdomain, subdomain),
          inArray(contactExperiences.contactId, contactIds),
        ),
      )
      .orderBy(contactExperiences.sortOrder),
    tx
      .select({
        id: contactSkills.id,
        contactId: contactSkills.contactId,
        workspaceSubdomain: contactSkills.workspaceSubdomain,
        name: contactSkills.name,
        category: contactSkills.category,
        proficiency: contactSkills.proficiency,
        yearsOfExperience: contactSkills.yearsOfExperience,
        isCertified: contactSkills.isCertified,
        issuer: contactSkills.issuer,
        description: contactSkills.description,
        sortOrder: contactSkills.sortOrder,
        createdAt: contactSkills.createdAt,
      })
      .from(contactSkills)
      .where(
        and(
          eq(contactSkills.workspaceSubdomain, subdomain),
          inArray(contactSkills.contactId, contactIds),
        ),
      )
      .orderBy(contactSkills.sortOrder),
    tx
      .select({
        id: contactRelationships.id,
        contactId: contactRelationships.contactId,
        workspaceSubdomain: contactRelationships.workspaceSubdomain,
        relatedContactId: contactRelationships.relatedContactId,
        name: contactRelationships.name,
        relationship: contactRelationships.relationship,
        phone: contactRelationships.phone,
        inferred: contactRelationships.inferred,
        inferredFromContactId: contactRelationships.inferredFromContactId,
        inferenceDepth: contactRelationships.inferenceDepth,
        sortOrder: contactRelationships.sortOrder,
        createdAt: contactRelationships.createdAt,
      })
      .from(contactRelationships)
      .where(
        and(
          eq(contactRelationships.workspaceSubdomain, subdomain),
          inArray(contactRelationships.contactId, contactIds),
        ),
      )
      .orderBy(contactRelationships.sortOrder),
    tx
      .select({
        id: contactActivities.id,
        contactId: contactActivities.contactId,
        workspaceSubdomain: contactActivities.workspaceSubdomain,
        type: contactActivities.type,
        content: contactActivities.content,
        date: contactActivities.date,
        by: contactActivities.by,
        sortOrder: contactActivities.sortOrder,
        createdAt: contactActivities.createdAt,
      })
      .from(contactActivities)
      .where(
        and(
          eq(contactActivities.workspaceSubdomain, subdomain),
          inArray(contactActivities.contactId, contactIds),
        ),
      )
      .orderBy(contactActivities.sortOrder),
    tx
      .select({
        id: contactAttachments.id,
        contactId: contactAttachments.contactId,
        workspaceSubdomain: contactAttachments.workspaceSubdomain,
        name: contactAttachments.name,
        type: contactAttachments.type,
        size: contactAttachments.size,
        url: contactAttachments.url,
        date: contactAttachments.date,
        sortOrder: contactAttachments.sortOrder,
        createdAt: contactAttachments.createdAt,
      })
      .from(contactAttachments)
      .where(
        and(
          eq(contactAttachments.workspaceSubdomain, subdomain),
          inArray(contactAttachments.contactId, contactIds),
        ),
      )
      .orderBy(contactAttachments.sortOrder),
    tx
      .select({
        id: contactBankDetails.id,
        contactId: contactBankDetails.contactId,
        workspaceSubdomain: contactBankDetails.workspaceSubdomain,
        bankName: contactBankDetails.bankName,
        accountTitle: contactBankDetails.accountTitle,
        accountNumber: contactBankDetails.accountNumber,
        iban: contactBankDetails.iban,
        swiftCode: contactBankDetails.swiftCode,
        branchName: contactBankDetails.branchName,
        branchCode: contactBankDetails.branchCode,
        routingNumber: contactBankDetails.routingNumber,
        currency: contactBankDetails.currency,
        isPrimary: contactBankDetails.isPrimary,
        label: contactBankDetails.label,
        sortOrder: contactBankDetails.sortOrder,
        createdAt: contactBankDetails.createdAt,
      })
      .from(contactBankDetails)
      .where(
        and(
          eq(contactBankDetails.workspaceSubdomain, subdomain),
          inArray(contactBankDetails.contactId, contactIds),
        ),
      )
      .orderBy(contactBankDetails.sortOrder),
  ]);

  return {
    phonesMap: groupByContactId(phonesRows),
    emailsMap: groupByContactId(emailsRows),
    addressesMap: groupByContactId(addressesRows),
    tagsMap: groupByContactId(tagsRows),
    socialsMap: groupByContactId(socialsRows),
    educationsMap: groupByContactId(educationsRows),
    experiencesMap: groupByContactId(experiencesRows),
    skillsMap: groupByContactId(skillsRows),
    relationshipsMap: groupByContactId(relationshipsRows),
    activitiesMap: groupByContactId(activitiesRows),
    attachmentsMap: groupByContactId(attachmentsRows),
    bankDetailsMap: groupByContactId(bankDetailsRows),
  };
}

/**
 * Lean child maps for contact directory listings (table/card views).
 * Queries only phones, emails, addresses, and tags (4 queries instead of 12).
 */
export async function loadContactSummaryChildMaps(
  tx: Transaction,
  subdomain: string,
  contactIds: string[],
): Promise<ContactChildMaps> {
  const [phonesRows, emailsRows, addressesRows, tagsRows, socialsRows, relationshipsRows] = await Promise.all([
    tx
      .select({
        id: contactPhones.id,
        contactId: contactPhones.contactId,
        label: contactPhones.label,
        number: contactPhones.number,
        countryCode: contactPhones.countryCode,
        isPrimary: contactPhones.isPrimary,
        whatsappStatus: contactPhones.whatsappStatus,
        sortOrder: contactPhones.sortOrder,
      })
      .from(contactPhones)
      .where(
        and(
          eq(contactPhones.workspaceSubdomain, subdomain),
          inArray(contactPhones.contactId, contactIds),
        ),
      )
      .orderBy(contactPhones.sortOrder),
    tx
      .select({
        id: contactEmails.id,
        contactId: contactEmails.contactId,
        address: contactEmails.address,
        label: contactEmails.label,
        isPrimary: contactEmails.isPrimary,
        isVerified: contactEmails.isVerified,
        sortOrder: contactEmails.sortOrder,
      })
      .from(contactEmails)
      .where(
        and(
          eq(contactEmails.workspaceSubdomain, subdomain),
          inArray(contactEmails.contactId, contactIds),
        ),
      )
      .orderBy(contactEmails.sortOrder),
    tx
      .select({
        id: contactAddresses.id,
        contactId: contactAddresses.contactId,
        label: contactAddresses.label,
        line1: contactAddresses.line1,
        city: contactAddresses.city,
        state: contactAddresses.state,
        country: contactAddresses.country,
        isPrimary: contactAddresses.isPrimary,
        sortOrder: contactAddresses.sortOrder,
      })
      .from(contactAddresses)
      .where(
        and(
          eq(contactAddresses.workspaceSubdomain, subdomain),
          inArray(contactAddresses.contactId, contactIds),
        ),
      )
      .orderBy(contactAddresses.sortOrder),
    tx
      .select({
        id: contactTags.id,
        contactId: contactTags.contactId,
        name: contactTags.name,
      })
      .from(contactTags)
      .where(
        and(
          eq(contactTags.workspaceSubdomain, subdomain),
          inArray(contactTags.contactId, contactIds),
        ),
      )
      .orderBy(contactTags.createdAt),
    tx
      .select({
        id: contactSocials.id,
        contactId: contactSocials.contactId,
        platform: contactSocials.platform,
        url: contactSocials.url,
        sortOrder: contactSocials.sortOrder,
      })
      .from(contactSocials)
      .where(
        and(
          eq(contactSocials.workspaceSubdomain, subdomain),
          inArray(contactSocials.contactId, contactIds),
        ),
      )
      .orderBy(contactSocials.sortOrder),
    tx
      .select({
        id: contactRelationships.id,
        contactId: contactRelationships.contactId,
        workspaceSubdomain: contactRelationships.workspaceSubdomain,
        relatedContactId: contactRelationships.relatedContactId,
        name: contactRelationships.name,
        relationship: contactRelationships.relationship,
        phone: contactRelationships.phone,
        inferred: contactRelationships.inferred,
        inferredFromContactId: contactRelationships.inferredFromContactId,
        inferenceDepth: contactRelationships.inferenceDepth,
        sortOrder: contactRelationships.sortOrder,
        createdAt: contactRelationships.createdAt,
      })
      .from(contactRelationships)
      .where(
        and(
          eq(contactRelationships.workspaceSubdomain, subdomain),
          inArray(contactRelationships.contactId, contactIds),
        ),
      )
      .orderBy(contactRelationships.sortOrder),
  ]);

  const emptyMap = new Map();
  return {
    phonesMap: groupByContactId(phonesRows as unknown as PhoneRow[]),
    emailsMap: groupByContactId(emailsRows as unknown as EmailRow[]),
    addressesMap: groupByContactId(addressesRows as unknown as AddressRow[]),
    tagsMap: groupByContactId(tagsRows as unknown as TagRow[]),
    socialsMap: groupByContactId(socialsRows as unknown as SocialRow[]),
    educationsMap: emptyMap,
    experiencesMap: emptyMap,
    skillsMap: emptyMap,
    relationshipsMap: groupByContactId(relationshipsRows as unknown as RelationshipRow[]),
    activitiesMap: emptyMap,
    attachmentsMap: emptyMap,
    bankDetailsMap: emptyMap,
  };
}

