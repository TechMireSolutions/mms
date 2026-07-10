import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_ATTENDANCE_SETTINGS,
  ATTENDANCE_MODULE_CONTRACT,
  DEFAULT_ATTENDANCE_FIELD_DEFS,
  mergeTabbedFields,
  type AttendanceModuleSettings,
} from "@mms/shared";
import { getCollection, getObject } from "@/lib/db";
import {
  ATTENDANCE_CONFIG_COLLECTION_KEYS,
  getAttendanceConfigCollectionDefaults,
} from "@/lib/attendanceConfig/attendanceConfigSeeds";
import type { AttendanceStatus } from "@/lib/data/attendanceData";
import { useModuleConfig } from "@/hooks/useModuleConfig";

export function loadAttendanceSettings(): AttendanceModuleSettings {
  const settings = getObject<Partial<AttendanceModuleSettings>>(
    ATTENDANCE_MODULE_CONTRACT.settingsObjectKey,
    DEFAULT_ATTENDANCE_SETTINGS
  );
  return {
    ...DEFAULT_ATTENDANCE_SETTINGS,
    ...(settings ?? {}),
    formTabs: settings?.formTabs ?? DEFAULT_ATTENDANCE_SETTINGS.formTabs ?? [],
    enabledTabs: settings?.enabledTabs ?? DEFAULT_ATTENDANCE_SETTINGS.enabledTabs ?? [],
    requiredTabs: settings?.requiredTabs ?? DEFAULT_ATTENDANCE_SETTINGS.requiredTabs ?? [],
    fields: mergeTabbedFields(
      DEFAULT_ATTENDANCE_SETTINGS.fields || {},
      settings?.fields
    ),
    customFields: settings?.customFields ?? DEFAULT_ATTENDANCE_SETTINGS.customFields ?? [],
    fieldOrder: settings?.fieldOrder ?? DEFAULT_ATTENDANCE_SETTINGS.fieldOrder ?? [],
  };
}

export function useAttendanceConfig() {
  const defaults = useMemo(() => getAttendanceConfigCollectionDefaults(), []);
  
  const {
    settings,
    orderedFields,
    fields,
    customFields,
    updateSettings,
    reloadConfig,
  } = useModuleConfig({
    settingsObjectKey: ATTENDANCE_MODULE_CONTRACT.settingsObjectKey,
    defaultSettings: DEFAULT_ATTENDANCE_SETTINGS,
    defaultFieldDefs: DEFAULT_ATTENDANCE_FIELD_DEFS,
  });

  const [statuses, setStatuses] = useState<AttendanceStatus[]>(() =>
    getCollection(ATTENDANCE_CONFIG_COLLECTION_KEYS.statuses, defaults.statuses)
  );

  const reloadStatuses = useCallback(() => {
    reloadConfig();
    setStatuses(getCollection(ATTENDANCE_CONFIG_COLLECTION_KEYS.statuses, defaults.statuses));
  }, [defaults, reloadConfig]);

  useEffect(() => {
    reloadStatuses();
  }, [reloadStatuses]);

  useEffect(() => {
    const handleLocalDatabaseUpdate = () => {
      queueMicrotask(reloadStatuses);
    };
    window.addEventListener("local-database-update", handleLocalDatabaseUpdate);
    return () => window.removeEventListener("local-database-update", handleLocalDatabaseUpdate);
  }, [reloadStatuses]);

  return {
    settings,
    statuses,
    fields,
    customFields,
    orderedFields,
    updateSettings,
  };
}

