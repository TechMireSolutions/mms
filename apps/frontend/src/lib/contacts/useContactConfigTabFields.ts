import { useCallback, useMemo } from "react";
import {
  type FieldConfig,
  type FieldDefinition,
  INITIAL_FIELD_SEED,
  resolveContactEnabledTabIds,
} from "@mms/shared";

/** Tab/field enablement helpers derived from Contact field config. */
export function useContactConfigTabFields({
  fieldConfig,
  userRole,
}: {
  fieldConfig: FieldConfig;
  userRole: string;
}) {
  const enabledTabIds = useMemo(
    () => resolveContactEnabledTabIds(fieldConfig, userRole),
    [fieldConfig, userRole],
  );

  const requiredTabIds = useMemo(() => {
    return new Set(fieldConfig.requiredTabs || []);
  }, [fieldConfig]);

  const fields = useMemo(() => {
    return fieldConfig.fields || {};
  }, [fieldConfig]);

  const isTabFieldEnabled = useCallback(
    (tabId: string, fieldId: string) => {
      const tabFieldsList = fields[tabId];
      if (!tabFieldsList || tabFieldsList.length === 0) {
        const seedField = (INITIAL_FIELD_SEED[tabId] || []).find(
          (f: FieldDefinition) => f.key === fieldId,
        );
        return seedField?.enabled ?? false;
      }
      const field = tabFieldsList.find((fieldDefinition) => fieldDefinition.key === fieldId);
      return field?.enabled ?? false;
    },
    [fields],
  );

  const isTabFieldRequired = useCallback(
    (tabId: string, fieldId: string) => {
      const field = (fields[tabId] || []).find((fieldDefinition) => fieldDefinition.key === fieldId);
      return field?.required ?? false;
    },
    [fields],
  );

  return {
    enabledTabIds,
    requiredTabIds,
    fields,
    isTabFieldEnabled,
    isTabFieldRequired,
  };
}
