import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_STUDENTS_SETTINGS,
  STUDENTS_MODULE_CONTRACT,
  type StudentsSettings,
} from "@mms/shared";
import { getCollection, getObject, saveObject } from "@/lib/db";
import {
  STUDENT_CONFIG_COLLECTION_KEYS,
  STUDENT_CONFIG_OBJECT_KEYS,
  getDefaultStudentGuardianContactDefaults,
  getStudentConfigCollectionDefaults,
  type StudentGuardianContactDefaults,
} from "@/lib/studentConfig/studentConfigSeeds";

function mergeStudentSettings(settings: Partial<StudentsSettings> | null | undefined): StudentsSettings {
  return {
    ...DEFAULT_STUDENTS_SETTINGS,
    ...(settings ?? {}),
    fields: {
      ...(DEFAULT_STUDENTS_SETTINGS.fields ?? {}),
      ...(settings?.fields ?? {}),
    },
    customFields: settings?.customFields ?? DEFAULT_STUDENTS_SETTINGS.customFields ?? [],
    fieldOrder: settings?.fieldOrder ?? DEFAULT_STUDENTS_SETTINGS.fieldOrder ?? [],
  };
}

export function loadStudentSettings(): StudentsSettings {
  return mergeStudentSettings(
    getObject<Partial<StudentsSettings>>(STUDENTS_MODULE_CONTRACT.settingsObjectKey, DEFAULT_STUDENTS_SETTINGS),
  );
}

export function useStudentConfig() {
  const defaults = useMemo(() => getStudentConfigCollectionDefaults(), []);
  const [settings, setSettings] = useState<StudentsSettings>(() => loadStudentSettings());
  const [statuses, setStatuses] = useState<string[]>(() =>
    getCollection(STUDENT_CONFIG_COLLECTION_KEYS.statuses, defaults.statuses),
  );
  const [genderFilters, setGenderFilters] = useState<string[]>(() =>
    getCollection(STUDENT_CONFIG_COLLECTION_KEYS.genderFilters, defaults.genderFilters),
  );
  const [discountTypes, setDiscountTypes] = useState<Array<{ id: string; label: string; pct: number }>>(() =>
    getCollection(STUDENT_CONFIG_COLLECTION_KEYS.discountTypes, defaults.discountTypes),
  );
  const [guardianContactDefaults, setGuardianContactDefaults] = useState<StudentGuardianContactDefaults>(() =>
    getObject(STUDENT_CONFIG_OBJECT_KEYS.guardianContactDefaults, getDefaultStudentGuardianContactDefaults()),
  );

  const reloadStudentConfig = useCallback(() => {
    setSettings(loadStudentSettings());
    setStatuses(getCollection(STUDENT_CONFIG_COLLECTION_KEYS.statuses, defaults.statuses));
    setGenderFilters(getCollection(STUDENT_CONFIG_COLLECTION_KEYS.genderFilters, defaults.genderFilters));
    setDiscountTypes(getCollection(STUDENT_CONFIG_COLLECTION_KEYS.discountTypes, defaults.discountTypes));
    setGuardianContactDefaults(
      getObject(STUDENT_CONFIG_OBJECT_KEYS.guardianContactDefaults, getDefaultStudentGuardianContactDefaults()),
    );
  }, [defaults]);

  useEffect(() => {
    reloadStudentConfig();
  }, [reloadStudentConfig]);

  useEffect(() => {
    const handleLocalDatabaseUpdate = () => {
      queueMicrotask(reloadStudentConfig);
    };
    window.addEventListener("local-database-update", handleLocalDatabaseUpdate);
    return () => window.removeEventListener("local-database-update", handleLocalDatabaseUpdate);
  }, [reloadStudentConfig]);

  const updateSettings = useCallback((next: StudentsSettings) => {
    const merged = mergeStudentSettings(next);
    saveObject(STUDENTS_MODULE_CONTRACT.settingsObjectKey, merged);
    setSettings(merged);
  }, []);

  return {
    settings,
    statuses,
    genderFilters,
    discountTypes,
    guardianContactDefaults,
    updateSettings,
  };
}
