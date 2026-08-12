/** Helpers for session form custom (non-seed) fields. */
import { INITIAL_SESSIONS_FIELD_SEED } from './moduleFieldSetupAcademic.js';
import type { FieldDefinition } from './contactFieldSchemaTypes.js';
import type { TabConfig } from './schemas/dynamicFormSchemas.js';
import type { Session } from './sessionTypes.js';
import { createFormCustomFieldHelpers } from './createFormCustomFieldHelpers.js';
import { applyDfsCustomFieldDefaults } from './dynamicFormHelpers.js';

const helpers = createFormCustomFieldHelpers(INITIAL_SESSIONS_FIELD_SEED);

/** Keys owned by static session form chrome (INITIAL_SESSIONS_FIELD_SEED). */
export const listSessionSystemFormFieldKeys = helpers.listSystemFormFieldKeys;

/**
 * Enabled non-seed fields for the session form.
 * When `tabId` is set, only fields stored under that config tab are returned.
 * When omitted, returns enabled non-seed fields from every tab.
 */
export const listEnabledCustomSessionFormFields = helpers.listEnabledCustomFormFields;

/** True when `fieldId` is part of the static form seed for `tabId`. */
export const isSessionSystemFormField = helpers.isSystemFormField;

/**
 * Seeds DFS custom field defaults into session draft customData for new sessions.
 * Delegates to the shared {@link applyDfsCustomFieldDefaults} helper.
 */
export function applySessionDfsCustomFieldDefaults(
  draft: Partial<Session>,
  dfsTabs?: TabConfig[],
): Partial<Session> {
  return applyDfsCustomFieldDefaults(
    draft as { id?: unknown; customData?: Record<string, unknown> | null },
    dfsTabs,
  ) as Partial<Session>;
}