/** Contact display helpers — avatar, name, primary channels, email/name normalize. */
import {
  type Contact,
  type Address as ContactAddress,
} from "./contactTypes.js";
import { contactDisplayName } from "./contactLinkPolicy.js";
import { PuppeteerWhatsAppProvider } from "./whatsappProvider.js";
import { getPrimaryPhone } from "./phoneUtils.js";

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
 * Extract primary email from contact
 * @param contact - Contact object
 * @returns Primary email address or null.
 */
export function getPrimaryEmail(contact: Partial<Contact>): string | null {
  const emails = contact.emails || [];
  const emailObj = emails.find((e) => e.isPrimary && (e.address || "").trim().length > 0)
    || emails.find((e) => (e.address || "").trim().length > 0)
    || emails[0];
  if (emailObj && (emailObj.address || "").trim().length > 0) {
    return emailObj.address.trim();
  }
  const scalarEmail = (contact as Record<string, unknown>).email;
  return typeof scalarEmail === "string" && scalarEmail.trim().length > 0 ? scalarEmail.trim() : null;
}

/**
 * Extract primary address object from contact
 * @param contact - Contact object
 * @returns Primary address object or null.
 */
export function getPrimaryAddress(contact: Partial<Contact>): ContactAddress | null {
  const addresses = contact.addresses || [];
  const addr = addresses.find((a) => a.isPrimary) || addresses[0];
  return addr || null;
}

/**
 * Build display name with Syed/Syeda prefix if applicable
 * Does NOT modify the stored name, only formats for display
 * @param contact - Contact object
 * @returns Formatted display name
 */
export function getDisplayName(contact: Partial<Contact>): string {
  const baseName = contactDisplayName({
    id: contact.id ?? "",
    name: contact.name,
    firstName: contact.firstName,
    lastName: contact.lastName,
  });
  if (!baseName || !contact.isSyed) return baseName;

  const prefix = contact.gender === "male" ? "Syed " : contact.gender === "female" ? "Syeda " : "";
  return prefix ? `${prefix}${baseName}` : baseName;
}

/**
 * Check if contact has a WhatsApp-resolvable number (`PuppeteerWhatsAppProvider.getNumberId`).
 * @param contact - Contact object
 * @returns True when a WhatsApp number id can be resolved from the primary phone.
 */
export function hasWhatsApp(contact: Partial<Contact>): boolean {
  return !!PuppeteerWhatsAppProvider.getNumberId(getPrimaryPhone(contact));
}

// ── Normalization Helpers ───────────────────────────────────────────────────

export const normalizeEmail = (email: unknown): string => {
  if (!email) return "";
  return String(email).trim().toLowerCase();
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
