import type {
  Contact,
  PhoneNumber as ContactPhone,
  EmailAddress as ContactEmail,
  Address as ContactAddress,
  SocialLink as ContactSocial,
  EmergencyContact
} from "./contactTypes.js";
import { CONTACTS_MODULE_CONTRACT } from "./contactsModuleContract.js";



const LOWERCASE_WORDS = new Set([
  "a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "by", "in", "of", "up", "as", "so", "yet"
]);

/**
 * Converts a string to Title Case, keeping minor words lowercase unless they are the first word.
 * @param value - The string to convert.
 * @returns The title-cased string, or the original value if it is not a string.
 */
export function toTitleCase(value: string): string;
export function toTitleCase(value: unknown): unknown;
export function toTitleCase(value: unknown): unknown {
  if (typeof value !== "string") return value;
  if (!value) return "";
  return value
    .trim()
    .split(/\s+/)
    .map((word, index) => {
      if (index === 0 || !LOWERCASE_WORDS.has(word.toLowerCase())) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word.toLowerCase();
    })
    .join(" ");
}


const SYSTEM_EXCLUDED_KEYS = new Set([
  "id",
  "key",
  "uuid",
  "code",
  "token",
  "password",
  "hash",
  "salt",
  "email",
  "phone",
  "avatar",
  "url",
  "status",
  "role",
  "type",
  "category",
  "dob",
  "date",
  "createdat",
  "updatedat",
  "deletedat",
  "rating",
  "aisummary",
  "attachment",
  "attachments",
  "file",
  "path",
  "subdomain",
  "domain",
  "host",
  "hostname",
  "ip",
  "logo",
  "logourl",
  "color",
  "theme",
  "icon",
  "uri",
  "username",
  "scope",
  "permissions",
  "gender",
  "currency",
  "enabledmodules",
  "columnpreferences",
  "preferences",
  "profilejson",
  "customdata",
  "data",
  "avatarcolors",
  "cornerstyle",
  "primarycolor",
  "accentcolor",
  "sidebartheme",
  "clientsecret",
  "refreshtoken",
  "accesstoken",
  "authchallenge",
  "authartifacts",
  "language",
  "locale",
  "timezone",
  "ipaddress",
  "useragent",
  "sessionid",
  "sessiontoken",
  "signature",
  "checksum",
]);

function isKeyIgnored(k?: string): boolean {
  if (!k) return false;
  const lk = k.toLowerCase();
  return (
    SYSTEM_EXCLUDED_KEYS.has(lk) ||
    lk.endsWith("id") ||
    lk.startsWith("_") ||
    lk.includes("hash") ||
    lk.includes("password") ||
    lk.includes("salt") ||
    lk.includes("key")
  );
}

/**
 * Recursively applies Title Case to eligible string fields in any object/array.
 */
export function applyTitleCaseRecursive(data: unknown, key?: string): unknown {
  if (typeof data === "string") {
    if (isKeyIgnored(key)) {
      return data;
    }
    const trimmed = data.trim();
    if (
      trimmed === "" ||
      trimmed.includes("@") ||
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("data:") ||
      /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ||
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trimmed) ||
      (/^[a-fA-F0-9]+$/.test(trimmed) && trimmed.length > 20) ||
      (/^[\d\s+\-()]+$/.test(trimmed) && trimmed.replace(/[\s+\-()]/g, "").length >= 7)
    ) {
      return data;
    }
    return toTitleCase(data) as string;
  }

  if (Array.isArray(data)) {
    return data.map((item) => applyTitleCaseRecursive(item, key));
  }

  if (data !== null && typeof data === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      result[k] = applyTitleCaseRecursive(v, k);
    }
    return result;
  }

  return data;
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
    const value = result[field];
    if (typeof value === "string") {
      result[field] = toTitleCase(value) as string;
    }
  });

  if (Array.isArray(result.phones)) {
    result.phones = result.phones.map((phone: Record<string, unknown>) => ({
      ...phone,
      label: typeof phone.label === "string" ? (toTitleCase(phone.label) as string) : phone.label,
    }));
  }

  if (Array.isArray(result.emails)) {
    result.emails = result.emails.map((email: Record<string, unknown>) => ({
      ...email,
      label: typeof email.label === "string" ? (toTitleCase(email.label) as string) : email.label,
    }));
  }

  if (Array.isArray(result.addresses)) {
    result.addresses = result.addresses.map((address: Record<string, unknown>) => ({
      ...address,
      line1: typeof address.line1 === "string" ? (toTitleCase(address.line1) as string) : address.line1,
      city: typeof address.city === "string" ? (toTitleCase(address.city) as string) : address.city,
      state: typeof address.state === "string" ? (toTitleCase(address.state) as string) : address.state,
      country: typeof address.country === "string" ? (toTitleCase(address.country) as string) : address.country,
      label: typeof address.label === "string" ? (toTitleCase(address.label) as string) : address.label,
    }));
  }

  if (Array.isArray(result.socials)) {
    result.socials = result.socials.map((social: Record<string, unknown>) => ({
      ...social,
      platform: typeof social.platform === "string" ? (toTitleCase(social.platform) as string) : social.platform,
    }));
  }

  if (Array.isArray(result.emergencyContacts)) {
    result.emergencyContacts = result.emergencyContacts.map((emergencyContact: Record<string, unknown>) => ({
      ...emergencyContact,
      name: typeof emergencyContact.name === "string" ? (toTitleCase(emergencyContact.name) as string) : emergencyContact.name,
      relationship: typeof emergencyContact.relationship === "string" ? (toTitleCase(emergencyContact.relationship) as string) : emergencyContact.relationship,
    }));
  }

  if (Array.isArray(result.relationships)) {
    result.relationships = result.relationships.map((relationship: Record<string, unknown>) => ({
      ...relationship,
      relationship: typeof relationship.relationship === "string" ? (toTitleCase(relationship.relationship) as string) : relationship.relationship,
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
      const value = result[key];
      if (typeof value === "string") {
        if (
          !value.includes("@") &&
          !value.startsWith("http://") &&
          !value.startsWith("https://") &&
          !/^\d{4}-\d{2}-\d{2}$/.test(value) &&
          !value.startsWith("data:")
        ) {
          result[key] = toTitleCase(value) as string;
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
    .map((namePart) => namePart[0])
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
export function parsePhoneNumber(
  rawNumber: unknown,
  defaultCode = "+92",
  knownCodes: string[] = []
): { countryCode: string; number: string } {
  if (!rawNumber) return { countryCode: defaultCode, number: "" };
  let clean = String(rawNumber).trim();
  if (clean.startsWith("00")) {
    clean = "+" + clean.slice(2);
  }

  // Normalize known codes and default codes to form a unique sorted list (longest first)
  const codes = [defaultCode, ...knownCodes, "+92", "+1", "+44"]
    .map((c) => c.trim())
    .filter((c) => c.startsWith("+"));
  const uniqueCodes = Array.from(new Set(codes)).sort((a, b) => b.length - a.length);

  for (const code of uniqueCodes) {
    const escaped = code.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`^(${escaped})(?:\\s+(.*)|(.*))$`);
    const match = clean.match(regex);
    if (match) {
      const rest = (match[2] || match[3] || "").trim();
      return { countryCode: code, number: rest };
    }
  }

  // Fallback to standard 1-4 digit parsing
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
  const phone = (contact.phones || [])[0];
  if (phone && (phone.number || "").trim().length > 0) {
    const code = phone.countryCode ? phone.countryCode.trim() : "";
    const phoneNumber = phone.number ? phone.number.trim() : "";
    if (!code) return phoneNumber || null;
    if (phoneNumber.startsWith("+") || phoneNumber.startsWith(code)) return phoneNumber;
    return `${code} ${phoneNumber}`.trim() || null;
  }
  const scalarPhone = (contact as Record<string, unknown>).phone;
  return typeof scalarPhone === "string" && scalarPhone.trim().length > 0 ? scalarPhone.trim() : null;
}

/**
 * Extract primary email from contact
 * @param contact - Contact object
 * @returns Primary email address or null.
 */
export function getPrimaryEmail(contact: Partial<Contact>): string | null {
  const emailObj = (contact.emails || [])[0];
  if (emailObj && (emailObj.address || "").trim().length > 0) {
    return emailObj.address.trim();
  }
  const scalarEmail = (contact as Record<string, unknown>).email;
  return typeof scalarEmail === "string" && scalarEmail.trim().length > 0 ? scalarEmail.trim() : null;
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
  return !!getPrimaryPhone(contact);
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

export const normalizePhoneForComparison = (phoneNumber: unknown): string => {
  if (!phoneNumber) return "";
  const digits = String(phoneNumber).replace(/[^\d]/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

export const getPhoneNumbers = (contact: Contact): string[] => {
  const phoneNumbers: string[] = [];
  if (contact.phones) {
    contact.phones.forEach((phone) => {
      if (phone.number) {
        phoneNumbers.push(normalizePhoneForComparison(phone.number));
      }
    });
  }
  return Array.from(new Set(phoneNumbers.filter(Boolean)));
};

export const getEmails = (contact: Contact): string[] => {
  const emails: string[] = [];
  if (contact.emails) {
    contact.emails.forEach((email) => {
      if (email.address) {
        emails.push(normalizeEmail(email.address));
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

/**
 * Calculate detailed solar age (Years, Months, Days) based on a date of birth.
 * @param dob - Date of birth string
 * @returns Detailed solar age string, e.g. \"24y 5m 12d\"
 */
export function calculateDetailedSolarAge(dob: string): string {
  try {
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return "";
    const now = new Date();

    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    return `${years}y ${months}m ${days}d`;
  } catch {
    return "";
  }
}

/**
 * Convert Gregorian date of birth to a Hijri (lunar) date string.
 * @param dob - Gregorian date of birth string
 * @param locale - Active language locale
 * @returns Localized Hijri date string
 */
export function getLunarDateString(dob: string, locale = "en"): string {
  try {
    const date = new Date(dob);
    if (isNaN(date.getTime())) return "";
    const formatter = new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    return formatter.format(date);
  } catch {
    return "";
  }
}

function getHijriParts(date: Date): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura", {
    day: "numeric",
    month: "numeric",
    year: "numeric"
  });
  const parts = formatter.formatToParts(date);
  const day = parseInt(parts.find(p => p.type === "day")?.value || "1", 10);
  const month = parseInt(parts.find(p => p.type === "month")?.value || "1", 10);
  const year = parseInt(parts.find(p => p.type === "year")?.value || "1", 10);
  return { year, month, day };
}

/**
 * Calculate detailed Hijri (lunar) age (Years, Months, Days) based on a date of birth.
 * @param dob - Date of birth string
 * @returns Detailed lunar age string, e.g. \"25y 2m 8d\"
 */
export function calculateDetailedLunarAge(dob: string): string {
  try {
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return "";
    const now = new Date();

    const birthParts = getHijriParts(birthDate);
    const nowParts = getHijriParts(now);

    let years = nowParts.year - birthParts.year;
    let months = nowParts.month - birthParts.month;
    let days = nowParts.day - birthParts.day;

    if (days < 0) {
      months--;
      days += 30; // standard lunar month approximation
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    return `${years}y ${months}m ${days}d`;
  } catch {
    return "";
  }
}

export const DEFAULT_CURRENCIES = [
  { id: "cur1", code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  { id: "cur2", code: "USD", name: "US Dollar", symbol: "$" },
  { id: "cur3", code: "GBP", name: "British Pound", symbol: "£" }
];

/**
 * Retrieves the stored finance currency from localStorage if available (client-safe).
 */
export function getStoredFinanceCurrency(): string {
  if (typeof window !== "undefined") {
    try {
      let saved = localStorage.getItem("mms_finance_settings");
      if (!saved) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.endsWith(":finance_settings")) {
            saved = localStorage.getItem(key);
            break;
          }
        }
      }
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings?.currency) {
          return settings.currency;
        }
      }
    } catch {
      // Ignored
    }
  }
  return "PKR";
}

/**
 * Formats a numeric amount as currency (defaults to settings-aware currency or PKR).
 * @param amount - The numeric or string amount to format.
 * @param currency - The currency symbol/code (defaults to settings-aware currency).
 * @param options - Custom format options (e.g. useSymbol, excludeCurrency, decimal places).
 * @returns The formatted currency string, or "—" if invalid.
 */
export function formatMoney(
  amount: number | string | null | undefined,
  currency?: string,
  options?: {
    useSymbol?: boolean;
    excludeCurrency?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  if (amount === null || amount === undefined) return "—";
  const numeric = typeof amount === "number" ? amount : parseFloat(String(amount));
  if (isNaN(numeric)) return "—";

  const resolvedCurrency = currency || getStoredFinanceCurrency();

  const minDigits = options?.minimumFractionDigits ?? 0;
  const maxDigits = options?.maximumFractionDigits ?? 2;

  const formattedNum = numeric.toLocaleString(undefined, {
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
  });

  if (options?.excludeCurrency) {
    return formattedNum;
  }

  let prefix = resolvedCurrency;
  if (options?.useSymbol) {
    const found = DEFAULT_CURRENCIES.find((c) => c.code === resolvedCurrency || c.symbol === resolvedCurrency);
    if (found) {
      prefix = found.symbol;
    }
  }

  return `${prefix} ${formattedNum}`;
}

/**
 * Formats a numeric value or count string safely using locale settings.
 * @param value - The numeric or string value to format.
 * @param options - Custom Intl.NumberFormatOptions options.
 * @returns The formatted string, or "0" if null/undefined/NaN.
 */
export function formatNumber(
  value: number | string | readonly (string | number)[] | null | undefined,
  options?: Intl.NumberFormatOptions
): string {
  if (value === null || value === undefined) return "0";
  if (Array.isArray(value)) {
    return value.map((v) => formatNumber(v, options)).join(", ");
  }
  const numeric = typeof value === "number" ? value : parseFloat(String(value));
  if (isNaN(numeric)) return "0";
  return numeric.toLocaleString(undefined, options);
}



/**
 * Validates the submitted blueprint ID against the current settings/config version (Rule 16.3 / CS-6).
 * Throws an error if they mismatch.
 */
export function verifyBlueprintVersion(submittedBlueprintId: unknown, currentVersion: string | number): void {
  if (submittedBlueprintId !== undefined && submittedBlueprintId !== null) {
    if (String(submittedBlueprintId) !== String(currentVersion)) {
      throw new Error(`Blueprint version mismatch. Expected version ${currentVersion}, got ${submittedBlueprintId}. Please reload the form.`);
    }
  }
}

/**
 * Evaluates whether a given item record matches a widget filter condition.
 * Handles 'equals', 'contains', 'gt', and 'lt' operations case-insensitively.
 */
export function matchesWidgetFilter(
  item: Record<string, unknown> | null | undefined,
  filterField?: string,
  filterOperator?: string,
  filterValue?: string,
): boolean {
  if (!item || !filterField) return true;
  const fieldValue = item[filterField];
  if (fieldValue === undefined || fieldValue === null) return false;

  const normalizedFieldValue = String(fieldValue).toLowerCase();
  const normalizedTargetValue = String(filterValue ?? '').toLowerCase();

  switch (filterOperator) {
    case 'equals':
      return normalizedFieldValue === normalizedTargetValue;
    case 'contains':
      return normalizedFieldValue.includes(normalizedTargetValue);
    case 'gt':
      return Number(fieldValue) > Number(filterValue);
    case 'lt':
      return Number(fieldValue) < Number(filterValue);
    default:
      return true;
  }
}

/** Returns today's date as a YYYY-MM-DD ISO date string (UTC). */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Resolves points for a Hasanat denomination.
 * @param denomId - The ID of the denomination (e.g. "den1").
 * @param denomName - Optional name of the denomination (e.g. "Silver").
 * @param denominations - Optional array of active denominations to search within.
 * @returns The points value, falling back to name/ID heuristics if not found.
 */
export function getDenominationPoints(
  denomId: string | null | undefined,
  denomName?: string | null,
  denominations?: Array<{ id: string; points: number }> | null
): number {
  if (!denomId) return 0;
  
  if (denominations) {
    const found = denominations.find((d) => d.id === denomId);
    if (found) return found.points;
  }

  // Fallback to ID-based heuristics
  if (denomId === "den1") return 50;
  if (denomId === "den2") return 150;
  if (denomId === "den3") return 500;
  if (denomId === "den4") return 1000;
  if (denomId === "den5") return 2500;

  // Fallback to name-based heuristics
  if (denomName) {
    const lowerName = denomName.toLowerCase();
    if (lowerName.includes("silver")) return 150;
    if (lowerName.includes("gold")) return 500;
    if (lowerName.includes("platinum")) return 1000;
    if (lowerName.includes("diamond")) return 2500;
    if (lowerName.includes("bronze") || lowerName.includes("standard")) return 50;
  }

  return 50; // Default fallback
}

/**
 * Formats a local Date object into a YYYY-MM-DD ISO format string.
 * @param date - The Date object to format.
 * @returns The formatted ISO date string.
 */
export function formatDateToIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a raw Pakistani CNIC string into the standard format: XXXXX-XXXXXXX-X.
 * @param value - The raw CNIC value.
 * @returns The formatted CNIC.
 */
export function formatCnic(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return `${digits.slice(0, 5)} ${digits.slice(5, 12)} ${digits.slice(12)}`;
}


