import { useMemo } from "react";
import { useLiveCollection } from "@/hooks/useLiveCollection";
import { useLiveObject } from "@/hooks/useLiveObject";
import { useStandardModuleConfig } from "@/hooks/useStandardModuleConfig";
import {
  STUDENT_CONFIG_COLLECTION_KEYS,
  STUDENT_CONFIG_OBJECT_KEYS,
  getDefaultStudentGuardianContactDefaults,
  getStudentConfigCollectionDefaults,
  type StudentGuardianContactDefaults,
} from "@/lib/studentConfig/studentConfigSeeds";

export function useStudentConfig() {
  const defaults = useMemo(() => getStudentConfigCollectionDefaults(), []);

  const config = useStandardModuleConfig("students");
  
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
    ...config,
    statuses,
    genderFilters,
    discountTypes,
    guardianContactDefaults,
  };
}


