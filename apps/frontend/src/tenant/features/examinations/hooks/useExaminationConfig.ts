import {
  DEFAULT_EXAMINATIONS_SETTINGS,
  EXAMINATIONS_MODULE_CONTRACT,
  DEFAULT_EXAMINATIONS_FIELD_DEFS,
} from "@mms/shared";
import { useModuleConfig } from "@/hooks/useModuleConfig";

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

