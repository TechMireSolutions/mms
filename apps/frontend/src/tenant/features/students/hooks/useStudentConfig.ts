import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type StudentsSettings,
} from "@mms/shared";
import { getCollection, getObject } from "@/lib/db";
import {
  STUDENT_CONFIG_COLLECTION_KEYS,
  STUDENT_CONFIG_OBJECT_KEYS,
  getDefaultStudentGuardianContactDefaults,
  getStudentConfigCollectionDefaults,
  type StudentGuardianContactDefaults,
} from "@/lib/studentConfig/studentConfigSeeds";
import {
  loadStudentSettings,
  saveStudentSettings,
} from "@/lib/studentConfig/studentFieldsStore";

export { loadStudentSettings };

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

  const updateSettings = useCallback((settingsDraft: StudentsSettings) => {
    saveStudentSettings(settingsDraft);
    setSettings(settingsDraft);
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
