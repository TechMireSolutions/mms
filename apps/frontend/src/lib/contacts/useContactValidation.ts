import { useCallback } from "react";
import { buildDynamicContactSchema, formatZodIssues, type ValidationError } from "@mms/shared";
import { usePermissions } from "@/tenant/hooks/usePermissions";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";

export function useContactValidation(): (contactDraft: unknown) => ValidationError[] {
  const { fieldConfig, enabledTabIds, requiredTabIds, fields } = useContactConfig();
  const settings = useGlobalSettings();
  const { role } = usePermissions();
  const viewerRole = role ?? "";

  return useCallback(
    (contactDraft: unknown): ValidationError[] => {
      const schema = buildDynamicContactSchema(
        fieldConfig,
        enabledTabIds,
        requiredTabIds,
        fields,
        settings.language,
        viewerRole,
      );
      const result = schema.safeParse(contactDraft);
      if (result.success) {
        return [];
      }
      return formatZodIssues(result.error, contactDraft, fields);
    },
    [fieldConfig, enabledTabIds, requiredTabIds, fields, settings.language, viewerRole],
  );
}
