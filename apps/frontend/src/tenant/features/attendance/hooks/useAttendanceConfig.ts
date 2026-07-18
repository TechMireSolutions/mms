import { useMemo } from "react";
import {
  ATTENDANCE_CONFIG_COLLECTION_KEYS,
  getAttendanceConfigCollectionDefaults,
} from "@/lib/attendanceConfig/attendanceConfigSeeds";
import type { AttendanceStatus } from "@/lib/data/attendanceData";
import { useLiveCollection } from "@/hooks/useLiveCollection";
import { useStandardModuleConfig } from "@/hooks/useStandardModuleConfig";

export function useAttendanceConfig() {
  const defaults = useMemo(() => getAttendanceConfigCollectionDefaults(), []);
  
  const config = useStandardModuleConfig("attendance");

  const statuses = useLiveCollection<AttendanceStatus>(
    ATTENDANCE_CONFIG_COLLECTION_KEYS.statuses,
    defaults.statuses,
  );

  return {
    ...config,
    statuses,
  };
}


