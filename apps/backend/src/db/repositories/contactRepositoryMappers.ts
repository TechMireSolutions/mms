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
  const mappedPhones: PhoneNumber[] = phones.map((p) => {
    const phone: PhoneNumber = {
      label: p.label || 'Main',
      number: p.number,
      isPrimary: p.isPrimary,
    };
    if (p.countryCode) phone.countryCode = p.countryCode;
    if (p.whatsappStatus) phone.whatsappStatus = p.whatsappStatus as PhoneNumber['whatsappStatus'];
    return phone;
  });

  const mappedEmails: EmailAddress[] = emails.map((e) => ({
    label: e.label || 'Primary',
    address: e.address,
    isPrimary: e.isPrimary,
    isVerified: e.isVerified,
  }));

  const mappedAddresses: Address[] = addresses.map((a) => {
    const addr: Address = {
      isPrimary: a.isPrimary,
    };
    if (a.label) addr.label = a.label;
    if (a.line1) addr.line1 = a.line1;
    if (a.city) addr.city = a.city;
    if (a.state) addr.state = a.state;
    if (a.country) addr.country = a.country;
    return addr;
  });

  const mappedSocials: SocialLink[] = socials.map((s) => ({
    platform: s.platform,
    url: s.url,
  }));

  const mappedEducations: ContactEducation[] = educations.map((edu) => {
    const item: ContactEducation = {
      id: edu.id,
      institution: edu.institution,
      sortOrder: edu.sortOrder,
    };
    if (edu.degree) item.degree = edu.degree;
    if (edu.fieldOfStudy) item.fieldOfStudy = edu.fieldOfStudy;
    if (edu.year) item.year = edu.year;
    if (edu.grade) item.grade = edu.grade;
    if (edu.label) item.label = edu.label;
    return item;
  });

  const mappedExperiences: ContactExperience[] = experiences.map((exp) => {
    const item: ContactExperience = {
      id: exp.id,
      title: exp.title,
      organization: exp.organization,
      isCurrent: exp.isCurrent,
      sortOrder: exp.sortOrder,
    };
    if (exp.employmentType) item.employmentType = exp.employmentType;
    if (exp.location) item.location = exp.location;
    if (exp.startDate) item.startDate = exp.startDate;
    if (exp.endDate) item.endDate = exp.endDate;
    if (exp.description) item.description = exp.description;
    return item;
  });

  const mappedSkills: ContactSkill[] = skills.map((s) => {
    const item: ContactSkill = {
      id: s.id,
      name: s.name,
      isCertified: s.isCertified,
      sortOrder: s.sortOrder,
    };
    if (s.category) item.category = s.category;
    if (s.proficiency) item.proficiency = s.proficiency;
    if (s.yearsOfExperience) item.yearsOfExperience = s.yearsOfExperience;
    if (s.issuer) item.issuer = s.issuer;
    if (s.description) item.description = s.description;
    return item;
  });

  const mappedRelationships: RelationshipContact[] = relationships.map((r) => {
    const item: RelationshipContact = {
      inferred: r.inferred,
      inferenceDepth: r.inferenceDepth,
    };
    if (r.name) item.name = r.name;
    if (r.relationship) item.relationship = r.relationship;
    if (r.phone) item.phone = r.phone;
    if (r.relatedContactId) item.contactId = r.relatedContactId;
    if (r.inferredFromContactId) item.inferredFromContactId = r.inferredFromContactId;
    return item;
  });

  const mappedActivities: ContactActivity[] = activities.map((act) => {
    const item: ContactActivity = {
      id: act.id,
      type: act.type as ContactActivity['type'],
      content: act.content,
      date: act.date,
    };
    if (act.by) item.by = act.by;
    return item;
  });

  const mappedAttachments: ContactAttachment[] = attachments.map((att) => ({
    id: att.id,
    name: att.name,
    type: att.type,
    size: att.size,
    url: att.url,
    date: att.date,
  }));

  const mappedBankDetails: ContactBankDetail[] = bankDetails.map((b) => {
    const item: ContactBankDetail = {
      id: b.id,
      bankName: b.bankName,
      accountTitle: b.accountTitle,
      accountNumber: b.accountNumber,
      isPrimary: b.isPrimary,
      sortOrder: b.sortOrder,
    };
    if (b.iban) item.iban = b.iban;
    if (b.swiftCode) item.swiftCode = b.swiftCode;
    if (b.branchName) item.branchName = b.branchName;
    if (b.branchCode) item.branchCode = b.branchCode;
    if (b.routingNumber) item.routingNumber = b.routingNumber;
    if (b.currency) item.currency = b.currency;
    if (b.label) item.label = b.label;
    return item;
  });

  const contact: Contact = {
    id: row.id,
    firstName: row.firstName,
    name: row.name,
    isSyed: row.isSyed,
    tags: tagsRows.map((t) => t.name),
    tag: tagsRows.map((t) => t.name).join(', '),
    whatsappStatus: (row.whatsappStatus as Contact['whatsappStatus']) ?? 'unknown',
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
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
  };

  if (row.lastName) contact.lastName = row.lastName;
  if (row.gender) contact.gender = row.gender as Contact['gender'];
  if (row.dob) contact.dob = row.dob;
  if (row.cnic) contact.cnic = row.cnic;
  if (row.avatar) contact.avatar = row.avatar;
  if (row.notes) contact.notes = row.notes;
  if (row.lastCheckedAt) contact.lastCheckedAt = row.lastCheckedAt;
  if (row.aiSummary) contact.aiSummary = row.aiSummary;
  if (row.deletedAt) contact.deletedAt = new Date(row.deletedAt).toISOString();
  if (row.deletedBy) contact.deletedBy = row.deletedBy;
  if (row.deletionReason) contact.deletionReason = row.deletionReason;
  if (row.createdBy) contact.createdBy = row.createdBy;
  if (row.updatedBy) contact.updatedBy = row.updatedBy;

  return hydrateContactRelationshipFields(contact);
}
