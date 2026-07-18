import {
  DEFAULT_ENROLLMENTS_SETTINGS,
  DEFAULT_ENROLLMENTS_FIELD_DEFS,
  ENROLLMENTS_MODULE_CONTRACT,
} from "@mms/shared";
import { useModuleConfig } from "@/hooks/useModuleConfig";

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

