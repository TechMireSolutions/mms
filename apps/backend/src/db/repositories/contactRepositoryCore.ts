import { and, eq, inArray, isNotNull, isNull } from 'drizzle-orm';
import {
  hydrateContactRelationshipFields,
  type Contact,
  type PhoneNumber,
  type EmailAddress,
  type Address,
  type SocialLink,
  type ContactEducation,
  type ContactExperience,
  type ContactSkill,
  type RelationshipContact,
  type ContactActivity,
  type ContactAttachment,
} from '@mms/shared';
import {
  contacts,
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
import { withTenantTransaction } from '../withTenantTransaction.js';

type Transaction = Parameters<Parameters<typeof withTenantTransaction>[1]>[0];

type ContactRow = typeof contacts.$inferSelect;
type PhoneRow = typeof contactPhones.$inferSelect;
type EmailRow = typeof contactEmails.$inferSelect;
type AddressRow = typeof contactAddresses.$inferSelect;
type SocialRow = typeof contactSocials.$inferSelect;
type EducationRow = typeof contactEducations.$inferSelect;
type ExperienceRow = typeof contactExperiences.$inferSelect;
type SkillRow = typeof contactSkills.$inferSelect;
type RelationshipRow = typeof contactRelationships.$inferSelect;
type ActivityRow = typeof contactActivities.$inferSelect;
type AttachmentRow = typeof contactAttachments.$inferSelect;

export function contactRowToRecord(
  row: ContactRow,
  phones: PhoneRow[] = [],
  emails: EmailRow[] = [],
  addresses: AddressRow[] = [],
  socials: SocialRow[] = [],
  educations: EducationRow[] = [],
  experiences: ExperienceRow[] = [],
  skills: SkillRow[] = [],
  relationships: RelationshipRow[] = [],
  activities: ActivityRow[] = [],
  attachments: AttachmentRow[] = [],
): Contact {
  const mappedPhones: PhoneNumber[] = phones.map((p) => ({
    label: p.label || 'Main',
    number: p.number,
    countryCode: p.countryCode ?? undefined,
    isPrimary: p.isPrimary,
    whatsappStatus: (p.whatsappStatus as PhoneNumber['whatsappStatus']) ?? undefined,
  }));

  const mappedEmails: EmailAddress[] = emails.map((e) => ({
    label: e.label || 'Primary',
    address: e.address,
    isPrimary: e.isPrimary,
    isVerified: e.isVerified,
  }));

  const mappedAddresses: Address[] = addresses.map((a) => ({
    label: a.label ?? undefined,
    line1: a.line1 ?? undefined,
    city: a.city ?? undefined,
    state: a.state ?? undefined,
    country: a.country ?? undefined,
    isPrimary: a.isPrimary,
  }));

  const mappedSocials: SocialLink[] = socials.map((s) => ({
    platform: s.platform,
    url: s.url,
  }));

  const mappedEducations: ContactEducation[] = educations.map((edu) => ({
    id: edu.id,
    degree: edu.degree ?? undefined,
    institution: edu.institution,
    fieldOfStudy: edu.fieldOfStudy ?? undefined,
    year: edu.year ?? undefined,
    grade: edu.grade ?? undefined,
    label: edu.label ?? undefined,
    sortOrder: edu.sortOrder,
  }));

  const mappedExperiences: ContactExperience[] = experiences.map((exp) => ({
    id: exp.id,
    title: exp.title,
    organization: exp.organization,
    employmentType: exp.employmentType ?? undefined,
    location: exp.location ?? undefined,
    startDate: exp.startDate ?? undefined,
    endDate: exp.endDate ?? undefined,
    isCurrent: exp.isCurrent,
    description: exp.description ?? undefined,
    sortOrder: exp.sortOrder,
  }));

  const mappedSkills: ContactSkill[] = skills.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category ?? undefined,
    proficiency: s.proficiency ?? undefined,
    yearsOfExperience: s.yearsOfExperience ?? undefined,
    isCertified: s.isCertified,
    issuer: s.issuer ?? undefined,
    description: s.description ?? undefined,
    sortOrder: s.sortOrder,
  }));

  const mappedRelationships: RelationshipContact[] = relationships.map((r) => ({
    name: r.name ?? undefined,
    relationship: r.relationship ?? undefined,
    phone: r.phone ?? undefined,
    contactId: r.relatedContactId ?? undefined,
    inferred: r.inferred,
    inferredFromContactId: r.inferredFromContactId ?? undefined,
    inferenceDepth: r.inferenceDepth,
  }));

  const mappedActivities: ContactActivity[] = activities.map((act) => ({
    id: act.id,
    type: act.type as ContactActivity['type'],
    content: act.content,
    date: act.date,
    by: act.by ?? undefined,
  }));

  const mappedAttachments: ContactAttachment[] = attachments.map((att) => ({
    id: att.id,
    name: att.name,
    type: att.type,
    size: att.size,
    url: att.url,
    date: att.date,
  }));

  const contact: Contact = {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName ?? undefined,
    name: row.name,
    gender: (row.gender as Contact['gender']) ?? undefined,
    dob: row.dob ?? undefined,
    cnic: row.cnic ?? undefined,
    isSyed: row.isSyed,
    tag: row.tag ?? undefined,
    tags: row.tag ? row.tag.split(',').map((t) => t.trim()).filter(Boolean) : [],
    avatar: row.avatar ?? undefined,
    notes: row.notes ?? undefined,
    whatsappStatus: (row.whatsappStatus as Contact['whatsappStatus']) ?? 'unknown',
    lastCheckedAt: row.lastCheckedAt ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    line1: row.line1 ?? undefined,
    address: row.address ?? undefined,
    city: row.city ?? undefined,
    state: row.state ?? undefined,
    country: row.country ?? undefined,
    preferredLanguage: (row.preferredLanguage as Contact['preferredLanguage']) ?? undefined,
    preferredContactMethod: (row.preferredContactMethod as Contact['preferredContactMethod']) ?? undefined,
    doNotContact: row.doNotContact,
    aiSummary: row.aiSummary ?? undefined,
    phones: mappedPhones,
    emails: mappedEmails,
    addresses: mappedAddresses,
    socials: mappedSocials,
    education: mappedEducations,
    experience: mappedExperiences,
    skills: mappedSkills,
    relationshipContacts: mappedRelationships,
    activities: mappedActivities,
    attachments: mappedAttachments,
    deletedAt: row.deletedAt ? new Date(row.deletedAt).toISOString() : undefined,
    deletedBy: row.deletedBy ?? undefined,
    deletionReason: row.deletionReason ?? undefined,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
    createdBy: row.createdBy ?? undefined,
    updatedBy: row.updatedBy ?? undefined,
  };

  return hydrateContactRelationshipFields(contact);
}

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

  const [
    phonesRows,
    emailsRows,
    addressesRows,
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

  const phonesMap = new Map<string, PhoneRow[]>();
  for (const p of phonesRows) {
    const list = phonesMap.get(p.contactId) ?? [];
    list.push(p);
    phonesMap.set(p.contactId, list);
  }

  const emailsMap = new Map<string, EmailRow[]>();
  for (const e of emailsRows) {
    const list = emailsMap.get(e.contactId) ?? [];
    list.push(e);
    emailsMap.set(e.contactId, list);
  }

  const addressesMap = new Map<string, AddressRow[]>();
  for (const a of addressesRows) {
    const list = addressesMap.get(a.contactId) ?? [];
    list.push(a);
    addressesMap.set(a.contactId, list);
  }

  const socialsMap = new Map<string, SocialRow[]>();
  for (const s of socialsRows) {
    const list = socialsMap.get(s.contactId) ?? [];
    list.push(s);
    socialsMap.set(s.contactId, list);
  }

  const educationsMap = new Map<string, EducationRow[]>();
  for (const edu of educationsRows) {
    const list = educationsMap.get(edu.contactId) ?? [];
    list.push(edu);
    educationsMap.set(edu.contactId, list);
  }

  const experiencesMap = new Map<string, ExperienceRow[]>();
  for (const exp of experiencesRows) {
    const list = experiencesMap.get(exp.contactId) ?? [];
    list.push(exp);
    experiencesMap.set(exp.contactId, list);
  }

  const skillsMap = new Map<string, SkillRow[]>();
  for (const s of skillsRows) {
    const list = skillsMap.get(s.contactId) ?? [];
    list.push(s);
    skillsMap.set(s.contactId, list);
  }

  const relationshipsMap = new Map<string, RelationshipRow[]>();
  for (const r of relationshipsRows) {
    const list = relationshipsMap.get(r.contactId) ?? [];
    list.push(r);
    relationshipsMap.set(r.contactId, list);
  }

  const activitiesMap = new Map<string, ActivityRow[]>();
  for (const act of activitiesRows) {
    const list = activitiesMap.get(act.contactId) ?? [];
    list.push(act);
    activitiesMap.set(act.contactId, list);
  }

  const attachmentsMap = new Map<string, AttachmentRow[]>();
  for (const att of attachmentsRows) {
    const list = attachmentsMap.get(att.contactId) ?? [];
    list.push(att);
    attachmentsMap.set(att.contactId, list);
  }

  return contactRows.map((row) =>
    contactRowToRecord(
      row,
      phonesMap.get(row.id) ?? [],
      emailsMap.get(row.id) ?? [],
      addressesMap.get(row.id) ?? [],
      socialsMap.get(row.id) ?? [],
      educationsMap.get(row.id) ?? [],
      experiencesMap.get(row.id) ?? [],
      skillsMap.get(row.id) ?? [],
      relationshipsMap.get(row.id) ?? [],
      activitiesMap.get(row.id) ?? [],
      attachmentsMap.get(row.id) ?? [],
    ),
  );
}

export interface ListByWorkspaceOptions {
  includeDeleted?: boolean;
  deleted?: 'active' | 'deleted' | 'all';
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
  return withTenantTransaction(subdomain, async (tx) => {
    const conditions = [eq(contacts.workspaceSubdomain, subdomain)];
    const deletedCond = resolveDeletedFilter(options);
    if (deletedCond) conditions.push(deletedCond);

    const rows = await tx
      .select()
      .from(contacts)
      .where(and(...conditions))
      .orderBy(contacts.name);
    return hydrateContactsList(tx, subdomain, rows);
  });
}

export async function countContactsByWorkspace(
  tenant: string,
  options?: ListByWorkspaceOptions,
): Promise<number> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const conditions = [eq(contacts.workspaceSubdomain, subdomain)];
    const deletedCond = resolveDeletedFilter(options);
    if (deletedCond) conditions.push(deletedCond);

    const rows = await tx
      .select({ count: contacts.id })
      .from(contacts)
      .where(and(...conditions));
    return rows.length;
  });
}

export async function findContactById(tenant: string, id: string): Promise<Contact | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(contacts)
      .where(and(eq(contacts.workspaceSubdomain, subdomain), eq(contacts.id, id)));
    const row = rows[0];
    if (!row) return null;
    const [result] = await hydrateContactsList(tx, subdomain, [row]);
    return result ?? null;
  });
}

export async function findContactsByIds(tenant: string, ids: string[]): Promise<Contact[]> {
  if (ids.length === 0) return [];
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(contacts)
      .where(and(eq(contacts.workspaceSubdomain, subdomain), inArray(contacts.id, ids)));
    return hydrateContactsList(tx, subdomain, rows);
  });
}

export async function persistContactTx(
  tx: Transaction,
  subdomain: string,
  rawContact: Contact,
): Promise<void> {
  const contact = hydrateContactRelationshipFields(rawContact);
  const contactId = String(contact.id);
  const fullName = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unnamed';

  // Primary scalar fallbacks
  const primaryPhone = contact.phone || contact.phones?.find((p) => p.isPrimary)?.number || contact.phones?.[0]?.number || null;
  const primaryEmail = contact.email || contact.emails?.find((e) => e.isPrimary)?.address || contact.emails?.[0]?.address || null;
  const primaryAddress = contact.address || contact.addresses?.find((a) => a.isPrimary)?.line1 || contact.addresses?.[0]?.line1 || null;
  const city = contact.city || contact.addresses?.find((a) => a.isPrimary)?.city || contact.addresses?.[0]?.city || null;
  const state = contact.state || contact.addresses?.find((a) => a.isPrimary)?.state || contact.addresses?.[0]?.state || null;
  const country = contact.country || contact.addresses?.find((a) => a.isPrimary)?.country || contact.addresses?.[0]?.country || null;
  const tagValue = Array.isArray(contact.tags) && contact.tags.length > 0
    ? contact.tags.map((t) => String(t).trim()).filter(Boolean).join(', ')
    : typeof contact.tag === 'string' && contact.tag.trim()
      ? contact.tag.trim()
      : null;

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
      tag: tagValue,
      avatar: contact.avatar ?? null,
      notes: contact.notes ?? null,
      whatsappStatus: contact.whatsappStatus ?? 'unknown',
      lastCheckedAt: contact.lastCheckedAt ?? null,
      phone: primaryPhone,
      email: primaryEmail,
      line1: contact.line1 ?? primaryAddress,
      address: contact.address ?? primaryAddress,
      city,
      state,
      country,
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
        tag: tagValue,
        avatar: contact.avatar ?? null,
        notes: contact.notes ?? null,
        whatsappStatus: contact.whatsappStatus ?? 'unknown',
        lastCheckedAt: contact.lastCheckedAt ?? null,
        phone: primaryPhone,
        email: primaryEmail,
        line1: contact.line1 ?? primaryAddress,
        address: contact.address ?? primaryAddress,
        city,
        state,
        country,
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

  // Re-sync child collections
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
}

export async function saveContact(tenant: string, contact: Contact): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    await persistContactTx(tx, subdomain, contact);
  });
}

export async function bulkSaveContacts(tenant: string, records: Contact[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    for (const record of records) {
      await persistContactTx(tx, subdomain, record);
    }
  });
}

export async function replaceContactsForWorkspace(tenant: string, records: Contact[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
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
