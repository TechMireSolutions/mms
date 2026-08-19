import {
  type Contact,
  type PhoneNumber as ContactPhone,
  type EmailAddress as ContactEmail,
  type Address as ContactAddress,
  type SocialLink as ContactSocial,
  type ContactEducation,
  type ContactExperience,
  type ContactSkill,
  type RelationshipContact,
} from "./contactTypes.js";

// ── Merging Logic ──────────────────────────────────────────────────────────

export const mergeContacts = (
  keep: Contact,
  other: Contact,
): Contact => {
  const merged: Contact = { ...keep };

  // Merge all basic properties dynamically
  Object.keys(other).forEach((key) => {
    if (
      key === "id" ||
      key === "name" ||
      key === "phones" ||
      key === "emails" ||
      key === "addresses" ||
      key === "socials" ||
      key === "education" ||
      key === "experience" ||
      key === "relationshipContacts" ||
      key === "notes" ||
      key === "createdAt" ||
      key === "updatedAt"
    ) {
      return;
    }
    if (merged[key] === undefined || merged[key] === null || merged[key] === "") {
      merged[key] = other[key];
    }
  });

  // Recalculate full name if firstName or lastName was merged/changed
  const first = (merged.firstName as string | undefined) || "";
  const last = (merged.lastName as string | undefined) || "";
  merged.name = [first, last].filter(Boolean).join(" ") || merged.name;



  // Merge phones list: match by normalized number
  const seenNumbers = new Set<string>();
  const mergedPhones: ContactPhone[] = [];

  const addPhone = (phone: ContactPhone | undefined): void => {
    if (!phone || !phone.number) return;
    const normalizedNumber = phone.number.replace(/[^\d]/g, "");
    if (!seenNumbers.has(normalizedNumber)) {
      seenNumbers.add(normalizedNumber);
      mergedPhones.push({ ...phone });
    }
  };

  (keep.phones || []).forEach(addPhone);
  (other.phones || []).forEach(addPhone);
  merged.phones = mergedPhones;

  // Merge emails list: match by normalized address
  const seenEmails = new Set<string>();
  const mergedEmails: ContactEmail[] = [];

  const addEmail = (email: ContactEmail | undefined): void => {
    if (!email || !email.address) return;
    const normalizedAddress = email.address.trim().toLowerCase();
    if (!seenEmails.has(normalizedAddress)) {
      seenEmails.add(normalizedAddress);
      mergedEmails.push({ ...email });
    }
  };

  (keep.emails || []).forEach(addEmail);
  (other.emails || []).forEach(addEmail);
  merged.emails = mergedEmails;

  // Merge addresses list: match by simple content key
  const seenAddresses = new Set<string>();
  const mergedAddresses: ContactAddress[] = [];

  const addAddress = (address: ContactAddress | undefined): void => {
    if (!address) return;
    const key = [address.line1, address.city, address.state, address.country]
      .filter(Boolean)
      .map((segment) => segment!.trim().toLowerCase())
      .join("|");
    if (!seenAddresses.has(key)) {
      seenAddresses.add(key);
      mergedAddresses.push({ ...address });
    }
  };

  (keep.addresses || []).forEach(addAddress);
  (other.addresses || []).forEach(addAddress);
  merged.addresses = mergedAddresses;

  // Merge socials list: match by normalized URL
  const seenSocials = new Set<string>();
  const mergedSocials: ContactSocial[] = [];

  const addSocial = (social: ContactSocial | undefined): void => {
    if (!social || !social.url) return;
    const normalizedUrl = social.url.trim().toLowerCase();
    if (!seenSocials.has(normalizedUrl)) {
      seenSocials.add(normalizedUrl);
      mergedSocials.push({ ...social });
    }
  };

  (keep.socials || []).forEach(addSocial);
  (other.socials || []).forEach(addSocial);
  merged.socials = mergedSocials;

  // Merge education list: match by degree & institution & year
  const seenEducation = new Set<string>();
  const mergedEducation: ContactEducation[] = [];

  const addEducation = (edu: ContactEducation | undefined): void => {
    if (!edu || !edu.institution) return;
    const key = [edu.degree, edu.institution, edu.fieldOfStudy, edu.year]
      .filter(Boolean)
      .map((seg) => seg!.trim().toLowerCase())
      .join("|");
    if (!seenEducation.has(key)) {
      seenEducation.add(key);
      mergedEducation.push({ ...edu });
    }
  };

  (keep.education || []).forEach(addEducation);
  (other.education || []).forEach(addEducation);
  merged.education = mergedEducation;

  // Merge experience list: match by title & organization & startDate
  const seenExperience = new Set<string>();
  const mergedExperience: ContactExperience[] = [];

  const addExperience = (exp: ContactExperience | undefined): void => {
    if (!exp || !exp.organization || !exp.title) return;
    const key = [exp.title, exp.organization, exp.startDate]
      .filter(Boolean)
      .map((seg) => seg!.trim().toLowerCase())
      .join("|");
    if (!seenExperience.has(key)) {
      seenExperience.add(key);
      mergedExperience.push({ ...exp });
    }
  };

  (keep.experience || []).forEach(addExperience);
  (other.experience || []).forEach(addExperience);
  merged.experience = mergedExperience;

  // Merge skills list: match by name & category
  const seenSkills = new Set<string>();
  const mergedSkills: ContactSkill[] = [];

  const addSkill = (skill: ContactSkill | undefined): void => {
    if (!skill || !skill.name) return;
    const key = [skill.name, skill.category]
      .filter(Boolean)
      .map((seg) => seg!.trim().toLowerCase())
      .join("|");
    if (!seenSkills.has(key)) {
      seenSkills.add(key);
      mergedSkills.push({ ...skill });
    }
  };

  (keep.skills || []).forEach(addSkill);
  (other.skills || []).forEach(addSkill);
  merged.skills = mergedSkills;

  // Merge relationship contacts: match by contact ID & relationship
  const seenRelationship = new Set<string>();
  const mergedRelationshipContacts: RelationshipContact[] = [];

  const addRelationshipContact = (link: RelationshipContact | undefined): void => {
    if (!link || !link.contactId) return;
    const key = `${link.contactId}-${link.relationship}`;
    if (!seenRelationship.has(key)) {
      seenRelationship.add(key);
      mergedRelationshipContacts.push({ ...link });
    }
  };

  (keep.relationshipContacts || []).forEach(addRelationshipContact);
  (other.relationshipContacts || []).forEach(addRelationshipContact);
  merged.relationshipContacts = mergedRelationshipContacts;

  return merged;
};
