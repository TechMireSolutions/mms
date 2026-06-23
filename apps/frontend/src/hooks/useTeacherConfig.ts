import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_TEACHERS_SETTINGS,
  TEACHERS_MODULE_CONTRACT,
  type TeachersSettings,
} from "@mms/shared";
import { getCollection, getObject, saveObject } from "@/lib/db";
import {
  TEACHER_CONFIG_COLLECTION_KEYS,
  getTeacherConfigCollectionDefaults,
} from "@/lib/teacherConfig/teacherConfigSeeds";

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
  const [settings, setSettings] = useState<TeachersSettings>(() => loadTeacherSettings());
  const [statuses, setStatuses] = useState<string[]>(() =>
    getCollection(TEACHER_CONFIG_COLLECTION_KEYS.statuses, defaults.statuses),
  );
  const [specializations, setSpecializations] = useState<string[]>(() =>
    getCollection(TEACHER_CONFIG_COLLECTION_KEYS.specializations, defaults.specializations),
  );

  const reloadTeacherConfig = useCallback(() => {
    setSettings(loadTeacherSettings());
    setStatuses(getCollection(TEACHER_CONFIG_COLLECTION_KEYS.statuses, defaults.statuses));
    setSpecializations(getCollection(TEACHER_CONFIG_COLLECTION_KEYS.specializations, defaults.specializations));
  }, [defaults]);

  useEffect(() => {
    reloadTeacherConfig();
  }, [reloadTeacherConfig]);

  useEffect(() => {
    const handleLocalDatabaseUpdate = () => {
      queueMicrotask(reloadTeacherConfig);
    };
    window.addEventListener("local-database-update", handleLocalDatabaseUpdate);
    return () => window.removeEventListener("local-database-update", handleLocalDatabaseUpdate);
  }, [reloadTeacherConfig]);

  const updateSettings = useCallback((next: TeachersSettings) => {
    const merged = mergeTeacherSettings(next);
    saveObject(TEACHERS_MODULE_CONTRACT.settingsObjectKey, merged);
    setSettings(merged);
  }, []);

  return {
    settings,
    statuses,
    specializations,
    updateSettings,
  };
}
