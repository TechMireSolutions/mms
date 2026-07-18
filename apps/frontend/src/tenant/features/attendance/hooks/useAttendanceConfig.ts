import { useMemo } from "react";
import {
  DEFAULT_ATTENDANCE_SETTINGS,
  ATTENDANCE_MODULE_CONTRACT,
  DEFAULT_ATTENDANCE_FIELD_DEFS,
} from "@mms/shared";
import {
  ATTENDANCE_CONFIG_COLLECTION_KEYS,
  getAttendanceConfigCollectionDefaults,
} from "@/lib/attendanceConfig/attendanceConfigSeeds";
import type { AttendanceStatus } from "@/lib/data/attendanceData";
import { useModuleConfig } from "@/hooks/useModuleConfig";
import { useLiveCollection } from "@/hooks/useLiveCollection";

export function useAttendanceConfig() {
  const defaults = useMemo(() => getAttendanceConfigCollectionDefaults(), []);
  
  const {
    settings,
    orderedFields,
    fields,
    customFields,
    updateSettings,
    isFieldEnabled,
    isFieldRequired,
  } = useModuleConfig({
    settingsObjectKey: ATTENDANCE_MODULE_CONTRACT.settingsObjectKey,
    defaultSettings: DEFAULT_ATTENDANCE_SETTINGS,
    defaultFieldDefs: DEFAULT_ATTENDANCE_FIELD_DEFS,
  });

  const statuses = useLiveCollection<AttendanceStatus>(
    ATTENDANCE_CONFIG_COLLECTION_KEYS.statuses,
    defaults.statuses,
  );

  return {
    settings,
    statuses,
    fields,
    customFields,
    orderedFields,
    updateSettings,
    isFieldEnabled,
    isFieldRequired,
  };
}

