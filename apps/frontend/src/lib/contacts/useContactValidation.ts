import { useCallback, useMemo } from "react";
import {
  buildDynamicContactSchema,
  formatZodIssues,
  type FieldDefinition,
  type ValidationError,
} from "@mms/shared";
import { usePermissions } from "@/tenant/hooks/usePermissions";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";

/**
 * Overlay live EditableSelect collections onto field-config options so Zod
 * accepts values the form dropdown already shows (e.g. Husband/Wife).
 */
function withLiveSelectOptions(
  fields: Record<string, FieldDefinition[]>,
  overlays: Array<{ tabId: string; fieldKey: string; options: string[] }>,
): Record<string, FieldDefinition[]> {
  let next = fields;
  for (const { tabId, fieldKey, options } of overlays) {
    if (!options.length || !next[tabId]) continue;
    const tabFields = next[tabId];
    const index = tabFields.findIndex((field) => field.key === fieldKey);
    if (index < 0) continue;
    if (next === fields) {
      next = { ...fields };
    }
    const clonedTab = [...(next[tabId] ?? [])];
    clonedTab[index] = { ...clonedTab[index], options: [...options] };
    next[tabId] = clonedTab;
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
      withLiveSelectOptions(fields, [
        { tabId: "relationship", fieldKey: "relationship", options: relationships },
        { tabId: "phones", fieldKey: "label", options: phoneLabels },
        { tabId: "emails", fieldKey: "label", options: emailLabels },
        { tabId: "addresses", fieldKey: "label", options: addressLabels },
        { tabId: "socials", fieldKey: "platform", options: socialPlatforms },
        { tabId: "basic", fieldKey: "gender", options: genders },
      ]),
    [
      fields,
      relationships,
      phoneLabels,
      emailLabels,
      addressLabels,
      socialPlatforms,
      genders,
    ],
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
