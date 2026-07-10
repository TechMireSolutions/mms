import {
  DEFAULT_ENROLLMENTS_SETTINGS,
  DEFAULT_ENROLLMENTS_FIELD_DEFS,
  ENROLLMENTS_MODULE_CONTRACT,
  mergeTabbedFields,
  type EnrollmentsSettings,
} from "@mms/shared";
import { getObject } from "@/lib/db";
import { useModuleConfig } from "@/hooks/useModuleConfig";

export function loadEnrollmentsSettings(): EnrollmentsSettings {
  const settings = getObject<Partial<EnrollmentsSettings>>(
    ENROLLMENTS_MODULE_CONTRACT.settingsObjectKey,
    DEFAULT_ENROLLMENTS_SETTINGS
  );
  return {
    ...DEFAULT_ENROLLMENTS_SETTINGS,
    ...(settings ?? {}),
    formTabs: settings?.formTabs ?? DEFAULT_ENROLLMENTS_SETTINGS.formTabs ?? [],
    enabledTabs: settings?.enabledTabs ?? DEFAULT_ENROLLMENTS_SETTINGS.enabledTabs ?? [],
    requiredTabs: settings?.requiredTabs ?? DEFAULT_ENROLLMENTS_SETTINGS.requiredTabs ?? [],
    fields: mergeTabbedFields(
      DEFAULT_ENROLLMENTS_SETTINGS.fields || {},
      settings?.fields
    ),
    customFields: settings?.customFields ?? DEFAULT_ENROLLMENTS_SETTINGS.customFields ?? [],
    fieldOrder: settings?.fieldOrder ?? DEFAULT_ENROLLMENTS_SETTINGS.fieldOrder ?? [],
  };
}

export function useEnrollmentConfig() {
  const {
    settings,
    orderedFields,
    fields,
    customFields,
    updateSettings,
  } = useModuleConfig({
    settingsObjectKey: ENROLLMENTS_MODULE_CONTRACT.settingsObjectKey,
    defaultSettings: DEFAULT_ENROLLMENTS_SETTINGS,
    defaultFieldDefs: DEFAULT_ENROLLMENTS_FIELD_DEFS,
  });

  return {
    settings,
    orderedFields,
    fields,
    customFields,
    updateSettings,
  };
}

