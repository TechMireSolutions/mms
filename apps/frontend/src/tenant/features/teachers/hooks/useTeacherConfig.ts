import { useMemo } from "react";
import {
  TEACHER_CONFIG_COLLECTION_KEYS,
  getTeacherConfigCollectionDefaults,
} from "@/lib/teacherConfig/teacherConfigSeeds";
import { useLiveCollection } from "@/hooks/useLiveCollection";
import { useStandardModuleConfig } from "@/hooks/useStandardModuleConfig";

export function useTeacherConfig() {
  const defaults = useMemo(() => getTeacherConfigCollectionDefaults(), []);
  
  const config = useStandardModuleConfig("teachers");
  
  const statuses = useLiveCollection<string>(
    TEACHER_CONFIG_COLLECTION_KEYS.statuses,
    defaults.statuses,
  );
  
  const specializations = useLiveCollection<string>(
    TEACHER_CONFIG_COLLECTION_KEYS.specializations,
    defaults.specializations,
  );

  return {
    ...config,
    statuses,
    specializations,
  };
}


