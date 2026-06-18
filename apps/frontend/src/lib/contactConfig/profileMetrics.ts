import type { Contact, FieldConfig } from "@mms/shared";

export function calculateProfileHealth(c: Partial<Contact>): number {
  let score = 0;

  // Name: use firstName or fall back to the composite name field (+15)
  const hasName = c.firstName?.trim() || c.name?.trim();
  if (hasName) score += 15;

  // Last name: bonus for having a surname (+5)
  if (c.lastName?.trim()) score += 5;

  // Gender (+5)
  if (c.gender) score += 5;

  // Date of birth (+5)
  if (c.dob) score += 5;

  // Avatar / profile photo (+10)
  if (c.avatar) score += 10;

  // Primary phone (+10)
  const hasPhone = (c.phones || []).length > 0 || !!(c.phone as string | undefined)?.trim();
  if (hasPhone) score += 10;

  // Primary email (+10)
  const hasEmail = (c.emails || []).length > 0 || !!(c.email as string | undefined)?.trim();
  if (hasEmail) score += 10;

  // Address (+5)
  if ((c.addresses || []).length > 0) score += 5;

  // Lifecycle stage set (any non-empty value) (+5)
  if (c.lifecycleStage && c.lifecycleStage !== "Lead") score += 5;

  // Social link (+5)
  if ((c.socials || []).length > 0) score += 5;

  // CRM relationship (+10)
  if ((c.relationships || []).length > 0) score += 10;

  // Rating explicitly set and > 0 (+5)
  if (c.rating && c.rating > 0) score += 5;

  // Notes (+5)
  if (c.notes?.trim()) score += 5;

  // Attachments (+5)
  if ((c.attachments || []).length > 0) score += 5;

  return Math.min(score, 100);
}

// List/collection form tabs → the Contact array property they populate.
const LIST_TAB_DATA_KEYS: Record<string, string> = {
  phones: "phones",
  emails: "emails",
  addresses: "addresses",
  socials: "socials",
  emergency: "emergencyContacts",
};

// Field types that have no meaningful "empty" state, so they don't count toward
// completeness (a `false` boolean is still a valid answer; AI summaries are read-only).
const COMPLETENESS_SKIP_TYPES = new Set(["boolean", "ai_summary"]);

import { hasFieldValue } from "@/lib/formCompleteness";

/**
 * Calculates form completeness (0-100) driven entirely by the active field
 * configuration — only **enabled** fields inside **enabled** form tabs count.
 *
 * Scalar tabs (e.g. Identity/basic, custom tabs) contribute one unit per enabled
 * field; collection tabs (phones, emails, addresses, socials, emergency) count as
 * a single unit that is "filled" once they hold at least one entry. An empty new
 * contact therefore reports 0%, and the denominator tracks the configured fields
 * rather than a hardcoded list.
 *
 * @param {Partial<Contact>} c - The contact draft.
 * @param {FieldConfig} fieldConfig - The active contact field configuration.
 * @returns {number} Completion percentage (0-100).
 */
export function calculateProfileCompleteness(c: Partial<Contact>, fieldConfig: FieldConfig): number {
  const fields = fieldConfig.fields || {};
  const formTabs = (fieldConfig.formTabs || []).filter((t) => t.enabled || t.key === "basic");
  const rec = c as Record<string, unknown>;

  let total = 0;
  let filled = 0;

  for (const tab of formTabs) {
    const listKey = LIST_TAB_DATA_KEYS[tab.key];
    if (listKey) {
      total += 1;
      const arr = rec[listKey];
      if (Array.isArray(arr) && arr.length > 0) filled += 1;
      continue;
    }
    const tabFields = (fields[tab.key] || []).filter(
      (f) => f.enabled && !COMPLETENESS_SKIP_TYPES.has(f.type)
    );
    for (const f of tabFields) {
      total += 1;
      if (hasFieldValue(rec[f.key])) filled += 1;
    }
  }

  if (total === 0) return 0;
  return Math.round((filled / total) * 100);
}
