import {
  DEFAULT_HASANAT_SETTINGS,
  HASANAT_MODULE_CONTRACT,
  DEFAULT_HASANAT_FIELD_DEFS,
  mergeTabbedFields,
  type HasanatSettings,
} from "@mms/shared";
import { getObject } from "@/lib/db";
import { useModuleConfig } from "@/hooks/useModuleConfig";

export function loadHasanatSettings(): HasanatSettings {
  const settings = getObject<Partial<HasanatSettings>>(
    HASANAT_MODULE_CONTRACT.settingsObjectKey,
    DEFAULT_HASANAT_SETTINGS
  );
  return {
    ...DEFAULT_HASANAT_SETTINGS,
    ...(settings ?? {}),
    formTabs: settings?.formTabs ?? DEFAULT_HASANAT_SETTINGS.formTabs ?? [],
    enabledTabs: settings?.enabledTabs ?? DEFAULT_HASANAT_SETTINGS.enabledTabs ?? [],
    requiredTabs: settings?.requiredTabs ?? DEFAULT_HASANAT_SETTINGS.requiredTabs ?? [],
    fields: mergeTabbedFields(
      DEFAULT_HASANAT_SETTINGS.fields || {},
      settings?.fields
    ),
    customFields: settings?.customFields ?? DEFAULT_HASANAT_SETTINGS.customFields ?? [],
    fieldOrder: settings?.fieldOrder ?? DEFAULT_HASANAT_SETTINGS.fieldOrder ?? [],
  };
}

export function useHasanatConfig() {
  const {
    settings,
    orderedFields,
    fields,
    customFields,
    updateSettings,
  } = useModuleConfig({
    settingsObjectKey: HASANAT_MODULE_CONTRACT.settingsObjectKey,
    defaultSettings: DEFAULT_HASANAT_SETTINGS,
    defaultFieldDefs: DEFAULT_HASANAT_FIELD_DEFS,
  });

  return {
    settings,
    orderedFields,
    fields,
    customFields,
    updateSettings,
  };
}

