import type { 
  Contact, 
  PhoneNumber as ContactPhone, 
  EmailAddress as ContactEmail, 
  Address as ContactAddress, 
  SocialLink as ContactSocial, 
  EmergencyContact 
} from "./contactTypes.js";

const LOWERCASE_WORDS = new Set([
  "a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "by", "in", "of", "up", "as", "so", "yet"
]);

/**
 * Converts a string to Title Case, keeping minor words lowercase unless they are the first word.
 * @param str - The string to convert.
 * @returns The title-cased string, or the original value if it is not a string.
 */
export function toTitleCase(str: unknown): unknown {
  if (typeof str !== "string") return str;
  return str
    .trim()
    .split(/\s+/)
    .map((word, i) => {
      if (i === 0 || !LOWERCASE_WORDS.has(word.toLowerCase())) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word.toLowerCase();
    })
    .join(" ");
}

/**
 * Formats specified text fields in a contact object to Title Case.
 * @param contact - The contact object.
 * @returns A new contact object with title-cased fields.
 */
export function applyTitleCaseToContact(contact: Record<string, unknown>): Record<string, unknown> {
  const result = { ...contact };

  const directFields = [
    "firstName",
    "lastName",
    "name",
    "occupation",
    "preferredName",
    "fatherName",
    "grandfatherName",
    "familyName",
    "nationality",
    "religion",
    "ethnicity",
    "languages",
    "employer",
    "industry",
    "designation",
    "relationship",
  ];

  directFields.forEach((field) => {
    const val = result[field];
    if (typeof val === "string") {
      result[field] = toTitleCase(val) as string;
    }
  });

  if (Array.isArray(result.phones)) {
    result.phones = result.phones.map((p: Record<string, unknown>) => ({
      ...p,
      label: typeof p.label === "string" ? (toTitleCase(p.label) as string) : p.label,
    }));
  }

  if (Array.isArray(result.emails)) {
    result.emails = result.emails.map((e: Record<string, unknown>) => ({
      ...e,
      label: typeof e.label === "string" ? (toTitleCase(e.label) as string) : e.label,
    }));
  }

  if (Array.isArray(result.addresses)) {
    result.addresses = result.addresses.map((a: Record<string, unknown>) => ({
      ...a,
      line1: typeof a.line1 === "string" ? (toTitleCase(a.line1) as string) : a.line1,
      city: typeof a.city === "string" ? (toTitleCase(a.city) as string) : a.city,
      state: typeof a.state === "string" ? (toTitleCase(a.state) as string) : a.state,
      country: typeof a.country === "string" ? (toTitleCase(a.country) as string) : a.country,
      label: typeof a.label === "string" ? (toTitleCase(a.label) as string) : a.label,
    }));
  }

  if (Array.isArray(result.socials)) {
    result.socials = result.socials.map((s: Record<string, unknown>) => ({
      ...s,
      platform: typeof s.platform === "string" ? (toTitleCase(s.platform) as string) : s.platform,
    }));
  }

  if (Array.isArray(result.emergencyContacts)) {
    result.emergencyContacts = result.emergencyContacts.map((ec: Record<string, unknown>) => ({
      ...ec,
      name: typeof ec.name === "string" ? (toTitleCase(ec.name) as string) : ec.name,
      relationship: typeof ec.relationship === "string" ? (toTitleCase(ec.relationship) as string) : ec.relationship,
    }));
  }

  if (Array.isArray(result.relationships)) {
    result.relationships = result.relationships.map((r: Record<string, unknown>) => ({
      ...r,
      type: typeof r.type === "string" ? (toTitleCase(r.type) as string) : r.type,
    }));
  }

  const excludedKeys = new Set([
    "id",
    "avatar",
    "createdAt",
    "updatedAt",
    "dob",
    "rating",
    "aiSummary",
    "email",
    "phone",
    "phones",
    "emails",
    "addresses",
    "socials",
    "emergencyContacts",
    "relationships",
    "activities",
    "attachments",
  ]);

  Object.keys(result).forEach((key) => {
    if (!excludedKeys.has(key)) {
      const val = result[key];
      if (typeof val === "string") {
        if (
          !val.includes("@") &&
          !val.startsWith("http://") &&
          !val.startsWith("https://") &&
          !/^\d{4}-\d{2}-\d{2}$/.test(val) &&
          !val.startsWith("data:")
        ) {
          result[key] = toTitleCase(val) as string;
        }
      }
    }
  });

  return result;
}

// ── Icons & symbols for UI ─────────────────────────────────────────────────────

export const AVATAR_COLORS: readonly string[] = [
  "bg-emerald-100 text-emerald-700",
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

// ── Utility functions ──────────────────────────────────────────────────────

/**
 * Get avatar color by contact ID
 * @param id - Contact ID
 * @returns CSS color class
 */
export function getAvatarColor(id: number | string): string {
  const numericId = typeof id === "number"
    ? id
    : String(id).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[numericId % AVATAR_COLORS.length];
}

/**
 * Get initials from name
 * @param name - Contact name
 * @param length - Number of initials (default: 2)
 * @returns Initials string
 */
export function getInitials(name: string | null | undefined, length = 2): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, length)
    .toUpperCase() || "?";
}

/**
 * Extract country code and local number parts from a raw phone number.
 * @param rawNumber - Raw phone number string
 * @param defaultCode - Fallback country code if none detected
 * @returns Object with countryCode and local number parts.
 */
export function parsePhoneNumber(rawNumber: unknown, defaultCode = "+92"): { countryCode: string; number: string } {
  if (!rawNumber) return { countryCode: defaultCode, number: "" };
  const clean = String(rawNumber).trim();
  const match = clean.match(/^(\+\d{1,4})(?:\s+(.*)|(.*))$/);
  if (match) {
    const code = match[1];
    const rest = (match[2] || match[3] || "").trim();
    return { countryCode: code, number: rest };
  }
  return { countryCode: defaultCode, number: clean };
}

/**
 * Normalizes a phone number to E.164 format.
 * E.g., countryCode "+92", number "300-1234567" -> "+923001234567".
 * If countryCode is missing, it tries to parse it or prepends default code.
 */
export function normalizeToE164(countryCode: string, number: string): string {
  const cleanCode = countryCode.replace(/[^\d]/g, "");
  let cleanNumber = number.replace(/[^\d]/g, "");
  
  if (cleanCode && cleanNumber.startsWith("0")) {
    cleanNumber = cleanNumber.replace(/^0+/, "");
  }
  
  if (cleanCode && cleanNumber.startsWith(cleanCode)) {
    return `+${cleanNumber}`;
  }
  
  return `+${cleanCode}${cleanNumber}`;
}

/**
 * Extract primary phone from contact
 * @param contact - Contact object
 * @returns The formatted primary phone number or null.
 */
export function getPrimaryPhone(contact: Partial<Contact>): string | null {
  const p = (contact.phones || [])[0] || (contact.phone ? { number: contact.phone as string } : null);
  if (!p) return null;
  const code = p.countryCode ? p.countryCode.trim() : "";
  const num = p.number ? p.number.trim() : "";
  if (!code) return num || null;
  if (num.startsWith("+") || num.startsWith(code)) return num;
  return `${code} ${num}`.trim() || null;
}

/**
 * Extract primary email from contact
 * @param contact - Contact object
 * @returns Primary email address or null.
 */
export function getPrimaryEmail(contact: Partial<Contact>): string | null {
  return (contact.emails || [])[0]?.address || (contact.email as string) || null;
}

/**
 * Build display name with Syed/Syeda prefix if applicable
 * Does NOT modify the stored name, only formats for display
 * @param contact - Contact object
 * @returns Formatted display name
 */
export function getDisplayName(contact: Partial<Contact>): string {
  const baseName = contact.name || contact.firstName || "";
  if (!baseName || !contact.isSyed) return baseName;
  
  const prefix = contact.gender === "male" ? "Syed " : contact.gender === "female" ? "Syeda " : "";
  return prefix ? `${prefix}${baseName}` : baseName;
}

/**
 * Check if contact has WhatsApp enabled
 * @param contact - Contact object
 * @returns True if WhatsApp enabled, false otherwise.
 */
export function hasWhatsApp(contact: Partial<Contact>): boolean {
  return contact.whatsappStatus === "REGISTERED";
}

/**
 * Get color classes for a tag
 * @param tag - Tag name
 * @param mode - UI mode (e.g. 'kanban')
 * @returns Object with header and badge classes
 */
export function getTagColor(tag: string, mode?: "kanban" | "badge"): { header: string; badge: string } {
  const hash = tag.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorSchemes = [
    { header: "border-emerald-200 bg-emerald-50/50 text-emerald-800", badge: "bg-emerald-100 text-emerald-800" },
    { header: "border-blue-200 bg-blue-50/50 text-blue-800", badge: "bg-blue-100 text-blue-800" },
    { header: "border-violet-200 bg-violet-50/50 text-violet-800", badge: "bg-violet-100 text-violet-800" },
    { header: "border-amber-200 bg-amber-50/50 text-amber-800", badge: "bg-amber-100 text-amber-800" },
    { header: "border-rose-200 bg-rose-50/50 text-rose-800", badge: "bg-rose-100 text-rose-800" },
    { header: "border-cyan-200 bg-cyan-50/50 text-cyan-800", badge: "bg-cyan-100 text-cyan-800" },
  ];
  return colorSchemes[hash % colorSchemes.length];
}

// ── Normalization Helpers ───────────────────────────────────────────────────

export const normalizeEmail = (email: unknown): string => {
  if (!email) return "";
  return String(email).trim().toLowerCase();
};

export const normalizePhoneForComparison = (num: unknown): string => {
  if (!num) return "";
  const digits = String(num).replace(/[^\d]/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

export const getPhoneNumbers = (c: Contact): string[] => {
  const nums: string[] = [];
  if (c.phone) {
    nums.push(normalizePhoneForComparison(c.phone));
  }
  if (c.phones) {
    c.phones.forEach((p) => {
      if (p.number) {
        nums.push(normalizePhoneForComparison(p.number));
      }
    });
  }
  return Array.from(new Set(nums.filter(Boolean)));
};

export const getEmails = (c: Contact): string[] => {
  const emails: string[] = [];
  if (c.email) {
    emails.push(normalizeEmail(c.email));
  }
  if (c.emails) {
    c.emails.forEach((e) => {
      if (e.address) {
        emails.push(normalizeEmail(e.address));
      }
    });
  }
  return Array.from(new Set(emails.filter(Boolean)));
};

export const cleanName = (name: unknown, prefixesToIgnore?: string[]): string => {
  if (!name) return "";
  let clean = String(name).trim().toLowerCase();
  
  if (prefixesToIgnore && prefixesToIgnore.length > 0) {
    const prefixRegex = new RegExp(`^(${prefixesToIgnore.join('|')})\\s+`, 'i');
    clean = clean.replace(prefixRegex, "");
  }
  
  return clean.replace(/\s+/g, "");
};

// ── Merging Logic ──────────────────────────────────────────────────────────

export const mergeContacts = (keep: Contact, other: Contact, uiStrings: Record<string, string>): Contact => {
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

  // Concatenate notes
  if (keep.notes && other.notes && keep.notes !== other.notes) {
    merged.notes = `${keep.notes}\n${uiStrings.mergedNotePrefix || "--- Merged from Duplicate ---"}\n${other.notes}`;
  } else if (other.notes) {
    merged.notes = other.notes;
  }

  // Merge phones list: match by normalized number
  const seenNumbers = new Set<string>();
  const mergedPhones: ContactPhone[] = [];

  const addPhone = (p: ContactPhone | undefined): void => {
    if (!p || !p.number) return;
    const norm = p.number.replace(/[^\d]/g, "");
    if (!seenNumbers.has(norm)) {
      seenNumbers.add(norm);
      mergedPhones.push({ ...p });
    }
  };

  (keep.phones || []).forEach(addPhone);
  (other.phones || []).forEach(addPhone);
  merged.phones = mergedPhones;

  // Merge emails list: match by normalized address
  const seenEmails = new Set<string>();
  const mergedEmails: ContactEmail[] = [];

  const addEmail = (e: ContactEmail | undefined): void => {
    if (!e || !e.address) return;
    const norm = e.address.trim().toLowerCase();
    if (!seenEmails.has(norm)) {
      seenEmails.add(norm);
      mergedEmails.push({ ...e });
    }
  };

  (keep.emails || []).forEach(addEmail);
  (other.emails || []).forEach(addEmail);
  merged.emails = mergedEmails;

  // Merge addresses list: match by simple content key
  const seenAddresses = new Set<string>();
  const mergedAddresses: ContactAddress[] = [];

  const addAddress = (a: ContactAddress | undefined): void => {
    if (!a) return;
    const key = [a.line1, a.city, a.state, a.country]
      .filter(Boolean)
      .map((s) => s!.trim().toLowerCase())
      .join("|");
    if (!seenAddresses.has(key)) {
      seenAddresses.add(key);
      mergedAddresses.push({ ...a });
    }
  };

  (keep.addresses || []).forEach(addAddress);
  (other.addresses || []).forEach(addAddress);
  merged.addresses = mergedAddresses;

  // Merge socials list: match by normalized URL
  const seenSocials = new Set<string>();
  const mergedSocials: ContactSocial[] = [];

  const addSocial = (s: ContactSocial | undefined): void => {
    if (!s || !s.url) return;
    const norm = s.url.trim().toLowerCase();
    if (!seenSocials.has(norm)) {
      seenSocials.add(norm);
      mergedSocials.push({ ...s });
    }
  };

  (keep.socials || []).forEach(addSocial);
  (other.socials || []).forEach(addSocial);
  merged.socials = mergedSocials;

  // Merge emergency contacts: match by contact ID & relationship
  const seenEmergency = new Set<string>();
  const mergedEmergency: EmergencyContact[] = [];

  const addEmergency = (ec: EmergencyContact | undefined): void => {
    if (!ec || !ec.contactId) return;
    const key = `${ec.contactId}-${ec.relationship}`;
    if (!seenEmergency.has(key)) {
      seenEmergency.add(key);
      mergedEmergency.push({ ...ec });
    }
  };

  (keep.emergencyContacts || []).forEach(addEmergency);
  (other.emergencyContacts || []).forEach(addEmergency);
  merged.emergencyContacts = mergedEmergency;

  return merged;
};

/**
 * Calculate age based on a date of birth string.
 * @param dob - Date of birth string
 * @returns Age in years, or null if invalid/missing
 */
export function calcAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}
