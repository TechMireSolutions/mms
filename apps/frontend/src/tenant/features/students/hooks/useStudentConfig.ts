import { useCallback, useMemo } from "react";
import {
  STUDENTS_MODULE_CONTRACT,
  normalizeStudentsSettings,
  type StudentsSettings,
} from "@mms/shared";
import { useLiveCollection } from "@/hooks/useLiveCollection";
import { useLiveObject } from "@/hooks/useLiveObject";
import { getObject, saveObject } from "@/lib/db";
import {
  STUDENT_CONFIG_COLLECTION_KEYS,
  STUDENT_CONFIG_OBJECT_KEYS,
  getDefaultStudentGuardianContactDefaults,
  getStudentConfigCollectionDefaults,
  type StudentGuardianContactDefaults,
} from "@/lib/studentConfig/studentConfigSeeds";

export function useStudentConfig() {
  const defaults = useMemo(() => getStudentConfigCollectionDefaults(), []);
  
  const settings = useLiveObject<StudentsSettings>(
    STUDENTS_MODULE_CONTRACT.settingsObjectKey,
    null as any,
    {
      loadFn: () =>
        normalizeStudentsSettings(
          getObject<Partial<StudentsSettings>>(
            STUDENTS_MODULE_CONTRACT.settingsObjectKey,
            null as any,
          ),
        ),
    },
  );
  
  const statuses = useLiveCollection<string>(
    STUDENT_CONFIG_COLLECTION_KEYS.statuses,
    defaults.statuses,
  );
  
  const genderFilters = useLiveCollection<string>(
    STUDENT_CONFIG_COLLECTION_KEYS.genderFilters,
    defaults.genderFilters,
  );
  
  const discountTypes = useLiveCollection<Array<{ id: string; label: string; pct: number }>[number]>(
    STUDENT_CONFIG_COLLECTION_KEYS.discountTypes,
    defaults.discountTypes,
  );
  
  const guardianContactDefaults = useLiveObject<StudentGuardianContactDefaults>(
    STUDENT_CONFIG_OBJECT_KEYS.guardianContactDefaults,
    getDefaultStudentGuardianContactDefaults(),
  );

  const updateSettings = useCallback((settingsDraft: StudentsSettings) => {
    saveObject(STUDENTS_MODULE_CONTRACT.settingsObjectKey, { ...settingsDraft, version: 2 });
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

