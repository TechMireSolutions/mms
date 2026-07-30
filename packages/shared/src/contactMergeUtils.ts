/** Contact merge helpers for duplicate resolution. */
import {
  type Contact,
  type PhoneNumber as ContactPhone,
  type EmailAddress as ContactEmail,
  type Address as ContactAddress,
  type SocialLink as ContactSocial,
  type EmergencyContact,
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
      key === "emergencyContacts" ||
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

  // Merge emergency contacts: match by contact ID & relationship
  const seenEmergency = new Set<string>();
  const mergedEmergency: EmergencyContact[] = [];

  const addEmergency = (emergencyContact: EmergencyContact | undefined): void => {
    if (!emergencyContact || !emergencyContact.contactId) return;
    const key = `${emergencyContact.contactId}-${emergencyContact.relationship}`;
    if (!seenEmergency.has(key)) {
      seenEmergency.add(key);
      mergedEmergency.push({ ...emergencyContact });
    }
  };

  (keep.emergencyContacts || []).forEach(addEmergency);
  (other.emergencyContacts || []).forEach(addEmergency);
  merged.emergencyContacts = mergedEmergency;

  return merged;
};
