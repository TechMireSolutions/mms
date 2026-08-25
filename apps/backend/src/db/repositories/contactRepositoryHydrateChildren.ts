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
} from '../schema.js';
import { withTenant } from '../tenant-context.js';

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
  ] = await Promise.all([
    tx
      .select()
      .from(contactPhones)
      .where(
        and(
          eq(contactPhones.workspaceSubdomain, subdomain),
          inArray(contactPhones.contactId, contactIds),
        ),
      )
      .orderBy(contactPhones.sortOrder),
    tx
      .select()
      .from(contactEmails)
      .where(
        and(
          eq(contactEmails.workspaceSubdomain, subdomain),
          inArray(contactEmails.contactId, contactIds),
        ),
      )
      .orderBy(contactEmails.sortOrder),
    tx
      .select()
      .from(contactAddresses)
      .where(
        and(
          eq(contactAddresses.workspaceSubdomain, subdomain),
          inArray(contactAddresses.contactId, contactIds),
        ),
      )
      .orderBy(contactAddresses.sortOrder),
    tx
      .select()
      .from(contactTags)
      .where(
        and(
          eq(contactTags.workspaceSubdomain, subdomain),
          inArray(contactTags.contactId, contactIds),
        ),
      )
      .orderBy(contactTags.createdAt),
    tx
      .select()
      .from(contactSocials)
      .where(
        and(
          eq(contactSocials.workspaceSubdomain, subdomain),
          inArray(contactSocials.contactId, contactIds),
        ),
      )
      .orderBy(contactSocials.sortOrder),
    tx
      .select()
      .from(contactEducations)
      .where(
        and(
          eq(contactEducations.workspaceSubdomain, subdomain),
          inArray(contactEducations.contactId, contactIds),
        ),
      )
      .orderBy(contactEducations.sortOrder),
    tx
      .select()
      .from(contactExperiences)
      .where(
        and(
          eq(contactExperiences.workspaceSubdomain, subdomain),
          inArray(contactExperiences.contactId, contactIds),
        ),
      )
      .orderBy(contactExperiences.sortOrder),
    tx
      .select()
      .from(contactSkills)
      .where(
        and(
          eq(contactSkills.workspaceSubdomain, subdomain),
          inArray(contactSkills.contactId, contactIds),
        ),
      )
      .orderBy(contactSkills.sortOrder),
    tx
      .select()
      .from(contactRelationships)
      .where(
        and(
          eq(contactRelationships.workspaceSubdomain, subdomain),
          inArray(contactRelationships.contactId, contactIds),
        ),
      )
      .orderBy(contactRelationships.sortOrder),
    tx
      .select()
      .from(contactActivities)
      .where(
        and(
          eq(contactActivities.workspaceSubdomain, subdomain),
          inArray(contactActivities.contactId, contactIds),
        ),
      )
      .orderBy(contactActivities.sortOrder),
    tx
      .select()
      .from(contactAttachments)
      .where(
        and(
          eq(contactAttachments.workspaceSubdomain, subdomain),
          inArray(contactAttachments.contactId, contactIds),
        ),
      )
      .orderBy(contactAttachments.sortOrder),
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
  };
}
