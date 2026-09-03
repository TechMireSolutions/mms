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
  type ContactBankDetail,
  type RelationshipContact,
  type ContactActivity,
  type ContactAttachment,
} from '@mms/shared';
import {
  type contacts,
  type contactTags,
  type contactPhones,
  type contactEmails,
  type contactAddresses,
  type contactSocials,
  type contactEducations,
  type contactExperiences,
  type contactSkills,
  type contactRelationships,
  type contactActivities,
  type contactAttachments,
  type contactBankDetails,
} from '../schema.js';

type ContactRow = typeof contacts.$inferSelect;
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

export function contactRowToRecord(
  row: ContactRow,
  phones: PhoneRow[] = [],
  emails: EmailRow[] = [],
  addresses: AddressRow[] = [],
  tagsRows: TagRow[] = [],
  socials: SocialRow[] = [],
  educations: EducationRow[] = [],
  experiences: ExperienceRow[] = [],
  skills: SkillRow[] = [],
  relationships: RelationshipRow[] = [],
  activities: ActivityRow[] = [],
  attachments: AttachmentRow[] = [],
  bankDetails: BankDetailRow[] = [],
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

  const mappedBankDetails: ContactBankDetail[] = bankDetails.map((b) => ({
    id: b.id,
    bankName: b.bankName,
    accountTitle: b.accountTitle,
    accountNumber: b.accountNumber,
    iban: b.iban ?? undefined,
    swiftCode: b.swiftCode ?? undefined,
    branchName: b.branchName ?? undefined,
    branchCode: b.branchCode ?? undefined,
    routingNumber: b.routingNumber ?? undefined,
    currency: b.currency ?? undefined,
    isPrimary: b.isPrimary,
    label: b.label ?? undefined,
    sortOrder: b.sortOrder,
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
    tags: tagsRows.map((t) => t.name),
    tag: tagsRows.map((t) => t.name).join(', '),
    avatar: row.avatar ?? undefined,
    notes: row.notes ?? undefined,
    whatsappStatus: (row.whatsappStatus as Contact['whatsappStatus']) ?? 'unknown',
    lastCheckedAt: row.lastCheckedAt ?? undefined,
    aiSummary: row.aiSummary ?? undefined,
    phones: mappedPhones,
    emails: mappedEmails,
    addresses: mappedAddresses,
    socials: mappedSocials,
    education: mappedEducations,
    experience: mappedExperiences,
    skills: mappedSkills,
    bankDetails: mappedBankDetails,
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
