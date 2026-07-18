import { useMemo } from "react";
import {
  DEFAULT_TEACHERS_SETTINGS,
  DEFAULT_TEACHER_FIELD_DEFS,
  TEACHERS_MODULE_CONTRACT,
} from "@mms/shared";
import {
  TEACHER_CONFIG_COLLECTION_KEYS,
  getTeacherConfigCollectionDefaults,
} from "@/lib/teacherConfig/teacherConfigSeeds";
import { useLiveCollection } from "@/hooks/useLiveCollection";
import { useModuleConfig } from "@/hooks/useModuleConfig";

export function useTeacherConfig() {
  const defaults = useMemo(() => getTeacherConfigCollectionDefaults(), []);

  const defaultFieldDefs = useMemo(() => {
    return DEFAULT_TEACHER_FIELD_DEFS.map((field) => ({
      ...field,
      label: field.label || field.labelKey || field.id,
    }));
  }, []);
  
  const {
    settings,
    orderedFields,
    fields,
    customFields,
    updateSettings,
    isFieldEnabled,
    isFieldRequired,
  } = useModuleConfig({
    settingsObjectKey: TEACHERS_MODULE_CONTRACT.settingsObjectKey,
    defaultSettings: DEFAULT_TEACHERS_SETTINGS,
    defaultFieldDefs,
  });
  
  const statuses = useLiveCollection<string>(
    TEACHER_CONFIG_COLLECTION_KEYS.statuses,
    defaults.statuses,
  );
  
  const specializations = useLiveCollection<string>(
    TEACHER_CONFIG_COLLECTION_KEYS.specializations,
    defaults.specializations,
  );

  return {
    settings,
    statuses,
    specializations,
    fields,
    customFields,
    orderedFields,
    updateSettings,
    isFieldEnabled,
    isFieldRequired,
  };
}

