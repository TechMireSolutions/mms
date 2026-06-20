import type { Contact, FieldConfig } from "@mms/shared";

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
