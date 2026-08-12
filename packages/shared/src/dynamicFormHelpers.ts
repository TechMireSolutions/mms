/**
 * Shared DFS (Dynamic Form System) helpers — used by every module form (Contacts, Students, Teachers, …).
 *
 * These helpers consolidate the per-module DFS default-seeding and DFS validation
 * loops so each module does not re-implement the same `buildDynamicValidationSchema`
 * wiring. Module-specific scalar legacy helpers (`applyContactScalarCustomFieldDefaults`,
 * `applyStudentScalarCustomFieldDefaults`) stay in their own files — only the DFS
 * (customData) paths are shared here.
 */
import { buildDynamicValidationSchema } from './utils/dynamicSchemaBuilder.js';
import type { ValidationError } from './contactValidationErrors.js';
import type { TabConfig } from './schemas/dynamicFormSchemas.js';
import type { CustomFieldConfig } from './schemas/dynamicFormSchemas.js';

/**
 * Seeds DFS `customData` defaults for enabled fields on **new** entities only.
 * Never overwrites keys already present on the draft (including `initialDraft`).
 * Returns the draft unchanged when `dfsTabs` is empty or the entity already has an id.
 *
 * This replaces the per-module `applyDfsCustomFieldDefaults` / `applyStudentDfsCustomFieldDefaults`
 * duplications — both had identical logic.
 */
export function applyDfsCustomFieldDefaults<T extends { id?: unknown; customData?: Record<string, unknown> | null }>(
  draft: T,
  dfsTabs?: TabConfig[],
): T {
  if (!dfsTabs || dfsTabs.length === 0) return draft;
  // New entities only — skip when an id already exists.
  if (draft.id != null && String(draft.id).length > 0) return draft;

  const currentCustomData = (draft.customData as Record<string, unknown> | undefined) ?? {};
  let updated = false;
  const nextCustomData = { ...currentCustomData };

  for (const tab of dfsTabs) {
    if (!tab.enabled) continue;
    for (const field of tab.fields || []) {
      if (!field.enabled) continue;
      if (field.defaultValue != null && field.defaultValue !== '') {
        if (!Object.prototype.hasOwnProperty.call(nextCustomData, field.key)) {
          nextCustomData[field.key] = field.defaultValue;
          updated = true;
        }
      }
    }
  }

  return updated ? { ...draft, customData: nextCustomData } : draft;
}

/**
 * Collects all enabled DFS fields across every enabled tab.
 * Returns a flat list + a map from field key → parent tab key (for error attribution).
 */
export function collectActiveDfsFields(
  dfsTabs: TabConfig[] | undefined,
): { fields: CustomFieldConfig[]; tabByFieldKey: Map<string, string> } {
  if (!dfsTabs || dfsTabs.length === 0) return { fields: [], tabByFieldKey: new Map() };

  const fields: CustomFieldConfig[] = [];
  const tabByFieldKey = new Map<string, string>();

  for (const tab of dfsTabs) {
    if (!tab.enabled) continue;
    for (const field of tab.fields || []) {
      if (!field.enabled) continue;
      fields.push(field);
      // Prefer the tab key; fall back to the tab id when key is empty.
      tabByFieldKey.set(field.key, tab.key || tab.id);
    }
  }

  return { fields, tabByFieldKey };
}

/**
 * Validates DFS `customData` against the dynamic Zod schema built from the
 * enabled DFS fields. Returns an array of `ValidationError` (empty on success).
 *
 * The `values` object is `{ ...customData, ...entityDraft }` so DFS fields that
 * were written to the top-level draft (legacy scalar path) are also covered.
 *
 * Error attribution: each issue is mapped to its parent DFS tab key (resolved
 * via `collectActiveDfsFields`), and the message is prefixed with the field label
 * when the field is found (matching the Contacts UX convention).
 *
 * This replaces the inline DFS validation loops in `useContactFormSave` and
 * `studentFormValidation` — both implemented the same logic with minor drift.
 */
export function validateDfsCustomFields(
  dfsTabs: TabConfig[] | undefined,
  customData: Record<string, unknown> | undefined,
  entityDraft: Record<string, unknown>,
): ValidationError[] {
  if (!dfsTabs || dfsTabs.length === 0) return [];

  const { fields, tabByFieldKey } = collectActiveDfsFields(dfsTabs);
  if (fields.length === 0) return [];

  const schema = buildDynamicValidationSchema(fields);
  const mergedValues = { ...(customData ?? {}), ...entityDraft };
  const result = schema.safeParse(mergedValues);

  if (result.success) return [];

  const errors: ValidationError[] = [];
  for (const issue of result.error.issues) {
    const fieldKey = String(issue.path[0] ?? '');
    const targetField = fields.find((f) => f.key === fieldKey);
    const tabId = tabByFieldKey.get(fieldKey) ?? targetField?.tabId ?? 'basic';
    errors.push({
      fieldId: fieldKey,
      tabId,
      message: targetField ? `${targetField.label}: ${issue.message}` : issue.message,
    });
  }
  return errors;
}

/**
 * Merges enabled DFS tabs into a list of resolved tab descriptors, skipping any
 * whose `key` is already present (dedup by key).
 *
 * Each DFS tab is mapped to `{ key, icon, label, badge? }` using the provided
 * `dfsTabAdapter`. This consolidates the identical "append enabled dfsTabs"
 * block that was duplicated across Contacts/Students/Teachers form + detail
 * views (5 copies).
 *
 * @param existingTabs - already-resolved system tabs (mutated in place — caller passes a fresh array)
 * @param dfsTabs - DFS tab configs from `useModuleTabs`
 * @param dfsTabAdapter - maps a `TabConfig` to a tab descriptor of type `T`
 * @returns the merged array (same reference as `existingTabs` for convenience)
 */
export function mergeDfsTabs<T extends { key: string }>(
  existingTabs: T[],
  dfsTabs: TabConfig[] | undefined,
  dfsTabAdapter: (dfsTab: TabConfig) => T,
): T[] {
  if (!dfsTabs || dfsTabs.length === 0) return existingTabs;

  for (const dfsTab of dfsTabs) {
    if (!dfsTab.enabled) continue;
    if (existingTabs.some((r) => r.key === dfsTab.key)) continue;
    existingTabs.push(dfsTabAdapter(dfsTab));
  }

  return existingTabs;
}

/**
 * Finds a DFS tab by matching key or id against the active tab identifier.
 * Handles the three-way match used by form tab dispatchers:
 *   1. `tab.key === normalizedTab` (normalized legacy id)
 *   2. `tab.key === tab` (raw active tab id)
 *   3. `tab.id === tab` (DFS-generated id)
 *
 * This consolidates the inline `dfsTabs?.find(...)` duplicated in
 * `ContactFormTabContent` and `StudentFormTabContent`.
 */
export function findDfsTab(
  dfsTabs: TabConfig[] | undefined,
  tab: string,
  normalizedTab?: string,
): TabConfig | undefined {
  const normalized = normalizedTab ?? tab;
  return dfsTabs?.find(
    (t) => t.key === normalized || t.key === tab || t.id === tab,
  );
}