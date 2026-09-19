import { sql } from 'drizzle-orm';
import type {
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
import { type TenantTransaction } from '../tenant-context.js';

type Transaction = TenantTransaction;
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

export async function loadContactChildMaps(
  tx: Transaction,
  subdomain: string,
  contactIds: string[],
): Promise<ContactChildMaps> {
  if (contactIds.length === 0) {
    return {
      phonesMap: new Map(),
      emailsMap: new Map(),
      addressesMap: new Map(),
      tagsMap: new Map(),
      socialsMap: new Map(),
      educationsMap: new Map(),
      experiencesMap: new Map(),
      skillsMap: new Map(),
      relationshipsMap: new Map(),
      activitiesMap: new Map(),
      attachmentsMap: new Map(),
      bankDetailsMap: new Map(),
    };
  }

  const BATCH_SIZE = 250;
  if (contactIds.length > BATCH_SIZE) {
    const combined: ContactChildMaps = {
      phonesMap: new Map(),
      emailsMap: new Map(),
      addressesMap: new Map(),
      tagsMap: new Map(),
      socialsMap: new Map(),
      educationsMap: new Map(),
      experiencesMap: new Map(),
      skillsMap: new Map(),
      relationshipsMap: new Map(),
      activitiesMap: new Map(),
      attachmentsMap: new Map(),
      bankDetailsMap: new Map(),
    };
    for (let i = 0; i < contactIds.length; i += BATCH_SIZE) {
      const slice = contactIds.slice(i, i + BATCH_SIZE);
      const partial = await loadContactChildMaps(tx, subdomain, slice);
      for (const [k, v] of partial.phonesMap) combined.phonesMap.set(k, v);
      for (const [k, v] of partial.emailsMap) combined.emailsMap.set(k, v);
      for (const [k, v] of partial.addressesMap) combined.addressesMap.set(k, v);
      for (const [k, v] of partial.tagsMap) combined.tagsMap.set(k, v);
      for (const [k, v] of partial.socialsMap) combined.socialsMap.set(k, v);
      for (const [k, v] of partial.educationsMap) combined.educationsMap.set(k, v);
      for (const [k, v] of partial.experiencesMap) combined.experiencesMap.set(k, v);
      for (const [k, v] of partial.skillsMap) combined.skillsMap.set(k, v);
      for (const [k, v] of partial.relationshipsMap) combined.relationshipsMap.set(k, v);
      for (const [k, v] of partial.activitiesMap) combined.activitiesMap.set(k, v);
      for (const [k, v] of partial.attachmentsMap) combined.attachmentsMap.set(k, v);
      for (const [k, v] of partial.bankDetailsMap) combined.bankDetailsMap.set(k, v);
    }
    return combined;
  }

  return loadContactChildMapsAggregated(tx, subdomain, contactIds);
}

/**
 * Lean child maps for contact directory listings (table/card views).
 * Queries only phones, emails, addresses, tags, socials, and relationships (6 queries instead of 12).
 */
export async function loadContactSummaryChildMaps(
  tx: Transaction,
  subdomain: string,
  contactIds: string[],
): Promise<ContactChildMaps> {
  if (contactIds.length === 0) {
    return {
      phonesMap: new Map(),
      emailsMap: new Map(),
      addressesMap: new Map(),
      tagsMap: new Map(),
      socialsMap: new Map(),
      educationsMap: new Map(),
      experiencesMap: new Map(),
      skillsMap: new Map(),
      relationshipsMap: new Map(),
      activitiesMap: new Map(),
      attachmentsMap: new Map(),
      bankDetailsMap: new Map(),
    };
  }

  const BATCH_SIZE = 250;
  if (contactIds.length > BATCH_SIZE) {
    const combined: ContactChildMaps = {
      phonesMap: new Map(),
      emailsMap: new Map(),
      addressesMap: new Map(),
      tagsMap: new Map(),
      socialsMap: new Map(),
      educationsMap: new Map(),
      experiencesMap: new Map(),
      skillsMap: new Map(),
      relationshipsMap: new Map(),
      activitiesMap: new Map(),
      attachmentsMap: new Map(),
      bankDetailsMap: new Map(),
    };
    for (let i = 0; i < contactIds.length; i += BATCH_SIZE) {
      const slice = contactIds.slice(i, i + BATCH_SIZE);
      const partial = await loadContactSummaryChildMaps(tx, subdomain, slice);
      for (const [k, v] of partial.phonesMap) combined.phonesMap.set(k, v);
      for (const [k, v] of partial.emailsMap) combined.emailsMap.set(k, v);
      for (const [k, v] of partial.addressesMap) combined.addressesMap.set(k, v);
      for (const [k, v] of partial.tagsMap) combined.tagsMap.set(k, v);
      for (const [k, v] of partial.socialsMap) combined.socialsMap.set(k, v);
      for (const [k, v] of partial.relationshipsMap) combined.relationshipsMap.set(k, v);
    }
    return combined;
  }

  return loadContactSummaryChildMapsAggregated(tx, subdomain, contactIds);
}

/**
 * Consolidated $O(1)$ SQL query aggregating all 12 contact child collections via json_agg.
 * Eliminates round-trips and connection concurrency load on hot read paths.
 */
export async function loadContactChildMapsAggregated(
  tx: Transaction,
  subdomain: string,
  contactIds: string[],
): Promise<ContactChildMaps> {
  if (contactIds.length === 0) {
    return {
      phonesMap: new Map(),
      emailsMap: new Map(),
      addressesMap: new Map(),
      tagsMap: new Map(),
      socialsMap: new Map(),
      educationsMap: new Map(),
      experiencesMap: new Map(),
      skillsMap: new Map(),
      relationshipsMap: new Map(),
      activitiesMap: new Map(),
      attachmentsMap: new Map(),
      bankDetailsMap: new Map(),
    };
  }

  const result: ContactChildMaps = {
    phonesMap: new Map(),
    emailsMap: new Map(),
    addressesMap: new Map(),
    tagsMap: new Map(),
    socialsMap: new Map(),
    educationsMap: new Map(),
    experiencesMap: new Map(),
    skillsMap: new Map(),
    relationshipsMap: new Map(),
    activitiesMap: new Map(),
    attachmentsMap: new Map(),
    bankDetailsMap: new Map(),
  };

  const queryResult = await (tx as any).execute(sql`
    SELECT
      c.id AS "contactId",
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', p.id,
          'contactId', p.contact_id,
          'workspaceSubdomain', p.workspace_subdomain,
          'number', p.number,
          'label', p.label,
          'countryCode', p.country_code,
          'isPrimary', p.is_primary,
          'whatsappStatus', p.whatsapp_status,
          'sortOrder', p.sort_order,
          'createdAt', p.created_at
        ) ORDER BY p.sort_order)
        FROM contact_phones p
        WHERE p.contact_id = c.id AND p.workspace_subdomain = ${subdomain}
      ), '[]'::json) AS phones,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', e.id,
          'contactId', e.contact_id,
          'workspaceSubdomain', e.workspace_subdomain,
          'address', e.address,
          'label', e.label,
          'isPrimary', e.is_primary,
          'isVerified', e.is_verified,
          'sortOrder', e.sort_order,
          'createdAt', e.created_at
        ) ORDER BY e.sort_order)
        FROM contact_emails e
        WHERE e.contact_id = c.id AND e.workspace_subdomain = ${subdomain}
      ), '[]'::json) AS emails,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', a.id,
          'contactId', a.contact_id,
          'workspaceSubdomain', a.workspace_subdomain,
          'label', a.label,
          'line1', a.line1,
          'city', a.city,
          'state', a.state,
          'country', a.country,
          'isPrimary', a.is_primary,
          'sortOrder', a.sort_order,
          'createdAt', a.created_at
        ) ORDER BY a.sort_order)
        FROM contact_addresses a
        WHERE a.contact_id = c.id AND a.workspace_subdomain = ${subdomain}
      ), '[]'::json) AS addresses,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', t.id,
          'contactId', t.contact_id,
          'workspaceSubdomain', t.workspace_subdomain,
          'name', t.name,
          'createdAt', t.created_at
        ) ORDER BY t.created_at)
        FROM contact_tags t
        WHERE t.contact_id = c.id AND t.workspace_subdomain = ${subdomain}
      ), '[]'::json) AS tags,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', s.id,
          'contactId', s.contact_id,
          'workspaceSubdomain', s.workspace_subdomain,
          'platform', s.platform,
          'url', s.url,
          'sortOrder', s.sort_order,
          'createdAt', s.created_at
        ) ORDER BY s.sort_order)
        FROM contact_socials s
        WHERE s.contact_id = c.id AND s.workspace_subdomain = ${subdomain}
      ), '[]'::json) AS socials,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', ed.id,
          'contactId', ed.contact_id,
          'workspaceSubdomain', ed.workspace_subdomain,
          'institution', ed.institution,
          'degree', ed.degree,
          'fieldOfStudy', ed.field_of_study,
          'year', ed.year,
          'grade', ed.grade,
          'label', ed.label,
          'sortOrder', ed.sort_order,
          'createdAt', ed.created_at
        ) ORDER BY ed.sort_order)
        FROM contact_educations ed
        WHERE ed.contact_id = c.id AND ed.workspace_subdomain = ${subdomain}
      ), '[]'::json) AS educations,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', ex.id,
          'contactId', ex.contact_id,
          'workspaceSubdomain', ex.workspace_subdomain,
          'title', ex.title,
          'organization', ex.organization,
          'employmentType', ex.employment_type,
          'location', ex.location,
          'startDate', ex.start_date,
          'endDate', ex.end_date,
          'isCurrent', ex.is_current,
          'description', ex.description,
          'sortOrder', ex.sort_order,
          'createdAt', ex.created_at
        ) ORDER BY ex.sort_order)
        FROM contact_experiences ex
        WHERE ex.contact_id = c.id AND ex.workspace_subdomain = ${subdomain}
      ), '[]'::json) AS experiences,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', sk.id,
          'contactId', sk.contact_id,
          'workspaceSubdomain', sk.workspace_subdomain,
          'name', sk.name,
          'category', sk.category,
          'proficiency', sk.proficiency,
          'yearsOfExperience', sk.years_of_experience,
          'isCertified', sk.is_certified,
          'issuer', sk.issuer,
          'description', sk.description,
          'sortOrder', sk.sort_order,
          'createdAt', sk.created_at
        ) ORDER BY sk.sort_order)
        FROM contact_skills sk
        WHERE sk.contact_id = c.id AND sk.workspace_subdomain = ${subdomain}
      ), '[]'::json) AS skills,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', r.id,
          'contactId', r.contact_id,
          'workspaceSubdomain', r.workspace_subdomain,
          'relatedContactId', r.related_contact_id,
          'name', r.name,
          'relationship', r.relationship,
          'phone', r.phone,
          'inferred', r.inferred,
          'inferredFromContactId', r.inferred_from_contact_id,
          'inferenceDepth', r.inference_depth,
          'sortOrder', r.sort_order,
          'createdAt', r.created_at
        ) ORDER BY r.sort_order)
        FROM contact_relationships r
        WHERE r.contact_id = c.id AND r.workspace_subdomain = ${subdomain}
      ), '[]'::json) AS relationships,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', act.id,
          'contactId', act.contact_id,
          'workspaceSubdomain', act.workspace_subdomain,
          'type', act.type,
          'content', act.content,
          'date', act.date,
          'by', act.by,
          'sortOrder', act.sort_order,
          'createdAt', act.created_at
        ) ORDER BY act.sort_order)
        FROM contact_activities act
        WHERE act.contact_id = c.id AND act.workspace_subdomain = ${subdomain}
      ), '[]'::json) AS activities,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', att.id,
          'contactId', att.contact_id,
          'workspaceSubdomain', att.workspace_subdomain,
          'name', att.name,
          'type', att.type,
          'size', att.size,
          'url', att.url,
          'date', att.date,
          'sortOrder', att.sort_order,
          'createdAt', att.created_at
        ) ORDER BY att.sort_order)
        FROM contact_attachments att
        WHERE att.contact_id = c.id AND att.workspace_subdomain = ${subdomain}
      ), '[]'::json) AS attachments,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', b.id,
          'contactId', b.contact_id,
          'workspaceSubdomain', b.workspace_subdomain,
          'bankName', b.bank_name,
          'accountTitle', b.account_title,
          'accountNumber', b.account_number,
          'sortOrder', b.sort_order,
          'createdAt', b.created_at
        ) ORDER BY b.sort_order)
        FROM contact_bank_details b
        WHERE b.contact_id = c.id AND b.workspace_subdomain = ${subdomain}
      ), '[]'::json) AS "bankDetails"
    FROM (VALUES ${sql.join(contactIds.map((id) => sql`(${id}::text)`), sql`, `)}) AS c(id)
  `);

  const rows = Array.isArray(queryResult) ? queryResult : ((queryResult as any)?.rows ?? []);
  for (const row of rows) {
    const contactId = String(row.contactId);
    if (row.phones && Array.isArray(row.phones)) result.phonesMap.set(contactId, row.phones);
    if (row.emails && Array.isArray(row.emails)) result.emailsMap.set(contactId, row.emails);
    if (row.addresses && Array.isArray(row.addresses)) result.addressesMap.set(contactId, row.addresses);
    if (row.tags && Array.isArray(row.tags)) result.tagsMap.set(contactId, row.tags);
    if (row.socials && Array.isArray(row.socials)) result.socialsMap.set(contactId, row.socials);
    if (row.educations && Array.isArray(row.educations)) result.educationsMap.set(contactId, row.educations);
    if (row.experiences && Array.isArray(row.experiences)) result.experiencesMap.set(contactId, row.experiences);
    if (row.skills && Array.isArray(row.skills)) result.skillsMap.set(contactId, row.skills);
    if (row.relationships && Array.isArray(row.relationships)) result.relationshipsMap.set(contactId, row.relationships);
    if (row.activities && Array.isArray(row.activities)) result.activitiesMap.set(contactId, row.activities);
    if (row.attachments && Array.isArray(row.attachments)) result.attachmentsMap.set(contactId, row.attachments);
    if (row.bankDetails && Array.isArray(row.bankDetails)) result.bankDetailsMap.set(contactId, row.bankDetails);
  }

  return result;
}

/**
 * Consolidated $O(1)$ SQL query aggregating summary child collections via json_agg.
 */
export async function loadContactSummaryChildMapsAggregated(
  tx: Transaction,
  subdomain: string,
  contactIds: string[],
): Promise<ContactChildMaps> {
  if (contactIds.length === 0) {
    return {
      phonesMap: new Map(),
      emailsMap: new Map(),
      addressesMap: new Map(),
      tagsMap: new Map(),
      socialsMap: new Map(),
      educationsMap: new Map(),
      experiencesMap: new Map(),
      skillsMap: new Map(),
      relationshipsMap: new Map(),
      activitiesMap: new Map(),
      attachmentsMap: new Map(),
      bankDetailsMap: new Map(),
    };
  }

  const emptyMap = new Map();
  const result: ContactChildMaps = {
    phonesMap: new Map(),
    emailsMap: new Map(),
    addressesMap: new Map(),
    tagsMap: new Map(),
    socialsMap: new Map(),
    educationsMap: emptyMap,
    experiencesMap: emptyMap,
    skillsMap: emptyMap,
    relationshipsMap: new Map(),
    activitiesMap: emptyMap,
    attachmentsMap: emptyMap,
    bankDetailsMap: emptyMap,
  };

  const queryResult = await (tx as any).execute(sql`
    SELECT
      c.id AS "contactId",
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', p.id,
          'contactId', p.contact_id,
          'workspaceSubdomain', p.workspace_subdomain,
          'number', p.number,
          'label', p.label,
          'countryCode', p.country_code,
          'isPrimary', p.is_primary,
          'whatsappStatus', p.whatsapp_status,
          'sortOrder', p.sort_order
        ) ORDER BY p.sort_order)
        FROM contact_phones p
        WHERE p.contact_id = c.id AND p.workspace_subdomain = ${subdomain}
      ), '[]'::json) AS phones,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', e.id,
          'contactId', e.contact_id,
          'workspaceSubdomain', e.workspace_subdomain,
          'address', e.address,
          'label', e.label,
          'isPrimary', e.is_primary,
          'isVerified', e.is_verified,
          'sortOrder', e.sort_order
        ) ORDER BY e.sort_order)
        FROM contact_emails e
        WHERE e.contact_id = c.id AND e.workspace_subdomain = ${subdomain}
      ), '[]'::json) AS emails,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', a.id,
          'contactId', a.contact_id,
          'workspaceSubdomain', a.workspace_subdomain,
          'label', a.label,
          'line1', a.line1,
          'city', a.city,
          'state', a.state,
          'country', a.country,
          'isPrimary', a.is_primary,
          'sortOrder', a.sort_order
        ) ORDER BY a.sort_order)
        FROM contact_addresses a
        WHERE a.contact_id = c.id AND a.workspace_subdomain = ${subdomain}
      ), '[]'::json) AS addresses,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', t.id,
          'contactId', t.contact_id,
          'workspaceSubdomain', t.workspace_subdomain,
          'name', t.name
        ) ORDER BY t.created_at)
        FROM contact_tags t
        WHERE t.contact_id = c.id AND t.workspace_subdomain = ${subdomain}
      ), '[]'::json) AS tags,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', s.id,
          'contactId', s.contact_id,
          'workspaceSubdomain', s.workspace_subdomain,
          'platform', s.platform,
          'url', s.url,
          'sortOrder', s.sort_order
        ) ORDER BY s.sort_order)
        FROM contact_socials s
        WHERE s.contact_id = c.id AND s.workspace_subdomain = ${subdomain}
      ), '[]'::json) AS socials,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', r.id,
          'contactId', r.contact_id,
          'workspaceSubdomain', r.workspace_subdomain,
          'relatedContactId', r.related_contact_id,
          'name', r.name,
          'relationship', r.relationship,
          'phone', r.phone,
          'inferred', r.inferred,
          'inferredFromContactId', r.inferred_from_contact_id,
          'inferenceDepth', r.inference_depth,
          'sortOrder', r.sort_order,
          'createdAt', r.created_at
        ) ORDER BY r.sort_order)
        FROM contact_relationships r
        WHERE r.contact_id = c.id AND r.workspace_subdomain = ${subdomain}
      ), '[]'::json) AS relationships
    FROM (VALUES ${sql.join(contactIds.map((id) => sql`(${id}::text)`), sql`, `)}) AS c(id)
  `);

  const rows = Array.isArray(queryResult) ? queryResult : ((queryResult as any)?.rows ?? []);
  for (const row of rows) {
    const contactId = String(row.contactId);
    if (row.phones && Array.isArray(row.phones)) result.phonesMap.set(contactId, row.phones);
    if (row.emails && Array.isArray(row.emails)) result.emailsMap.set(contactId, row.emails);
    if (row.addresses && Array.isArray(row.addresses)) result.addressesMap.set(contactId, row.addresses);
    if (row.tags && Array.isArray(row.tags)) result.tagsMap.set(contactId, row.tags);
    if (row.socials && Array.isArray(row.socials)) result.socialsMap.set(contactId, row.socials);
    if (row.relationships && Array.isArray(row.relationships)) result.relationshipsMap.set(contactId, row.relationships);
  }

  return result;
}

