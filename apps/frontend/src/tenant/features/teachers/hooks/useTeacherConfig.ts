import { useCallback, useMemo } from "react";
import {
  DEFAULT_TEACHERS_SETTINGS,
  TEACHERS_MODULE_CONTRACT,
  type TeachersSettings,
} from "@mms/shared";
import { getObject, saveObject } from "@/lib/db";
import {
  TEACHER_CONFIG_COLLECTION_KEYS,
  getTeacherConfigCollectionDefaults,
} from "@/lib/teacherConfig/teacherConfigSeeds";
import { useLiveCollection } from "@/hooks/useLiveCollection";
import { useLiveObject } from "@/hooks/useLiveObject";

function mergeTeacherSettings(settings: Partial<TeachersSettings> | null | undefined): TeachersSettings {
  return {
    ...DEFAULT_TEACHERS_SETTINGS,
    ...(settings ?? {}),
    fields: {
      ...(DEFAULT_TEACHERS_SETTINGS.fields ?? {}),
      ...(settings?.fields ?? {}),
    },
    customFields: settings?.customFields ?? DEFAULT_TEACHERS_SETTINGS.customFields ?? [],
    fieldOrder: settings?.fieldOrder ?? DEFAULT_TEACHERS_SETTINGS.fieldOrder ?? [],
  };
}

export function loadTeacherSettings(): TeachersSettings {
  return mergeTeacherSettings(
    getObject<Partial<TeachersSettings>>(TEACHERS_MODULE_CONTRACT.settingsObjectKey, DEFAULT_TEACHERS_SETTINGS),
  );
}

export function useTeacherConfig() {
  const defaults = useMemo(() => getTeacherConfigCollectionDefaults(), []);
  
  const settings = useLiveObject<TeachersSettings>(
    "teacherSettings",
    null as any,
    { loadFn: () => loadTeacherSettings() },
  );
  
  const statuses = useLiveCollection<string>(
    TEACHER_CONFIG_COLLECTION_KEYS.statuses,
    defaults.statuses,
  );
  
  const specializations = useLiveCollection<string>(
    TEACHER_CONFIG_COLLECTION_KEYS.specializations,
    defaults.specializations,
  );

  const updateSettings = useCallback((settingsDraft: TeachersSettings) => {
    const merged = mergeTeacherSettings(settingsDraft);
    saveObject(TEACHERS_MODULE_CONTRACT.settingsObjectKey, merged);
  }, []);

  return {
    settings,
    statuses,
    specializations,
    updateSettings,
  };
}
