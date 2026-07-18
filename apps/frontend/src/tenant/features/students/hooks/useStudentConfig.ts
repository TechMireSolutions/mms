import { useCallback, useMemo } from "react";
import {
  type StudentsSettings,
} from "@mms/shared";
import { useLiveCollection } from "@/hooks/useLiveCollection";
import { useLiveObject } from "@/hooks/useLiveObject";
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
  
  const settings = useLiveObject<StudentsSettings>(
    "studentSettings",
    null as any,
    { loadFn: () => loadStudentSettings() },
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
    saveStudentSettings(settingsDraft);
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
