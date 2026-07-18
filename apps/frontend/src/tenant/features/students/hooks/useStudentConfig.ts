import { useMemo } from "react";
import {
  STUDENTS_MODULE_CONTRACT,
  DEFAULT_STUDENTS_SETTINGS,
  DEFAULT_STUDENT_FIELD_DEFS,
  normalizeStudentsSettings,
  type StudentsSettings,
} from "@mms/shared";
import { useLiveCollection } from "@/hooks/useLiveCollection";
import { useLiveObject } from "@/hooks/useLiveObject";
import { useModuleConfig } from "@/hooks/useModuleConfig";
import {
  STUDENT_CONFIG_COLLECTION_KEYS,
  STUDENT_CONFIG_OBJECT_KEYS,
  getDefaultStudentGuardianContactDefaults,
  getStudentConfigCollectionDefaults,
  type StudentGuardianContactDefaults,
} from "@/lib/studentConfig/studentConfigSeeds";

export function useStudentConfig() {
  const defaults = useMemo(() => getStudentConfigCollectionDefaults(), []);

  const {
    settings,
    orderedFields,
    fields,
    customFields,
    updateSettings,
  } = useModuleConfig<StudentsSettings>({
    settingsObjectKey: STUDENTS_MODULE_CONTRACT.settingsObjectKey,
    defaultSettings: DEFAULT_STUDENTS_SETTINGS,
    defaultFieldDefs: DEFAULT_STUDENT_FIELD_DEFS,
    normalizeFn: normalizeStudentsSettings,
  });
  
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

  return {
    settings,
    statuses,
    genderFilters,
    discountTypes,
    guardianContactDefaults,
    updateSettings,
    fields,
    customFields,
    orderedFields,
  };
}

