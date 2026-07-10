import {
  DEFAULT_EXAMINATIONS_SETTINGS,
  EXAMINATIONS_MODULE_CONTRACT,
  DEFAULT_EXAMINATIONS_FIELD_DEFS,
  mergeTabbedFields,
  type ExaminationsSettings,
} from "@mms/shared";
import { getObject } from "@/lib/db";
import { useModuleConfig } from "@/hooks/useModuleConfig";

export function loadExaminationsSettings(): ExaminationsSettings {
  const settings = getObject<Partial<ExaminationsSettings>>(
    EXAMINATIONS_MODULE_CONTRACT.settingsObjectKey,
    DEFAULT_EXAMINATIONS_SETTINGS
  );
  return {
    ...DEFAULT_EXAMINATIONS_SETTINGS,
    ...(settings ?? {}),
    formTabs: settings?.formTabs ?? DEFAULT_EXAMINATIONS_SETTINGS.formTabs ?? [],
    enabledTabs: settings?.enabledTabs ?? DEFAULT_EXAMINATIONS_SETTINGS.enabledTabs ?? [],
    requiredTabs: settings?.requiredTabs ?? DEFAULT_EXAMINATIONS_SETTINGS.requiredTabs ?? [],
    fields: mergeTabbedFields(
      DEFAULT_EXAMINATIONS_SETTINGS.fields || {},
      settings?.fields
    ),
    customFields: settings?.customFields ?? DEFAULT_EXAMINATIONS_SETTINGS.customFields ?? [],
    fieldOrder: settings?.fieldOrder ?? DEFAULT_EXAMINATIONS_SETTINGS.fieldOrder ?? [],
  };
}

export function useExaminationConfig() {
  const {
    settings,
    orderedFields,
    fields,
    customFields,
    updateSettings,
  } = useModuleConfig({
    settingsObjectKey: EXAMINATIONS_MODULE_CONTRACT.settingsObjectKey,
    defaultSettings: DEFAULT_EXAMINATIONS_SETTINGS,
    defaultFieldDefs: DEFAULT_EXAMINATIONS_FIELD_DEFS,
  });

  return {
    settings,
    orderedFields,
    fields,
    customFields,
    updateSettings,
  };
}

