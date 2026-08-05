import { useCallback, useMemo } from "react";
import {
  buildDynamicContactSchema,
  formatZodIssues,
  CONTACT_LOOKUP_FIELD_TARGETS,
  type ContactLookupStringKind,
  type FieldDefinition,
  type ValidationError,
} from "@mms/shared";
import { usePermissions } from "@/tenant/hooks/usePermissions";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";

/**
 * Overlay live lookup option lists onto field-config options so Zod accepts
 * values the form dropdown already shows (e.g. a freshly added relationship type).
 */
function withLiveSelectOptions(
  fields: Record<string, FieldDefinition[]>,
  liveOptions: Record<ContactLookupStringKind, string[]>,
): Record<string, FieldDefinition[]> {
  let next = fields;
  for (const [kind, target] of Object.entries(CONTACT_LOOKUP_FIELD_TARGETS)) {
    const options = liveOptions[kind as ContactLookupStringKind];
    const tabFields = next[target.tabId];
    if (!options.length || !tabFields) continue;
    const index = tabFields.findIndex((field) => field.key === target.fieldId);
    if (index < 0) continue;
    if (next === fields) next = { ...fields };
    const overlaidTab = tabFields.map((field, fieldIndex) =>
      fieldIndex === index ? { ...field, options: [...options] } : field,
    );
    next[target.tabId] = overlaidTab;
  }
  return next;
}

export function useContactValidation(): (contactDraft: unknown) => ValidationError[] {
  const {
    fieldConfig,
    enabledTabIds,
    requiredTabIds,
    fields,
    relationships,
    phoneLabels,
    emailLabels,
    addressLabels,
    socialPlatforms,
    genders,
  } = useContactConfig();
  const settings = useGlobalSettings();
  const { role } = usePermissions();
  const viewerRole = role ?? "";

  const fieldsForValidation = useMemo(
    () =>
      withLiveSelectOptions(fields, {
        genders,
        socialPlatforms,
        relationships,
        phoneLabels,
        emailLabels,
        addressLabels,
      }),
    [fields, genders, socialPlatforms, relationships, phoneLabels, emailLabels, addressLabels],
  );

  return useCallback(
    (contactDraft: unknown): ValidationError[] => {
      const schema = buildDynamicContactSchema(
        fieldConfig,
        enabledTabIds,
        requiredTabIds,
        fieldsForValidation,
        settings.language,
        viewerRole,
      );
      const result = schema.safeParse(contactDraft);
      if (result.success) {
        return [];
      }
      return formatZodIssues(result.error, contactDraft, fieldsForValidation, settings.language);
    },
    [fieldConfig, enabledTabIds, requiredTabIds, fieldsForValidation, settings.language, viewerRole],
  );
}
