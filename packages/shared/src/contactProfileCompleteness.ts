import type { Contact, FieldConfig } from './contactTypes.js';

const LIST_TAB_DATA_KEYS: Record<string, string> = {
  phones: 'phones',
  emails: 'emails',
  addresses: 'addresses',
  socials: 'socials',
  emergency: 'emergencyContacts',
};

const COMPLETENESS_SKIP_TYPES = new Set(['boolean', 'ai_summary']);

/** Returns true when a form field value is considered filled. */
export function hasFieldValue(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (typeof v === 'number') return !Number.isNaN(v);
  if (typeof v === 'boolean') return v;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if ('url' in o) return Boolean(o.url);
    return Object.keys(o).length > 0;
  }
  return false;
}

/** Config-driven profile completeness (0–100) for command-centre metrics. */
export function calculateProfileCompleteness(c: Partial<Contact>, fieldConfig: FieldConfig): number {
  const fields = fieldConfig.fields || {};
  const formTabs = (fieldConfig.formTabs || []).filter((t) => t.enabled || t.key === 'basic');
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
      (f) => f.enabled && !COMPLETENESS_SKIP_TYPES.has(f.type),
    );
    for (const f of tabFields) {
      total += 1;
      if (hasFieldValue(rec[f.key])) filled += 1;
    }
  }

  if (total === 0) return 0;
  return Math.round((filled / total) * 100);
}
