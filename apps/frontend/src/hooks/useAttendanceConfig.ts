import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_ATTENDANCE_SETTINGS,
  ATTENDANCE_MODULE_CONTRACT,
  DEFAULT_ATTENDANCE_FIELD_DEFS,
  getSortedFields,
  mergeTabbedFields,
  getFlatFieldsConfig,
  type AttendanceModuleSettings,
} from "@mms/shared";
import { getCollection, getObject, saveObject } from "@/lib/db";
import {
  ATTENDANCE_CONFIG_COLLECTION_KEYS,
  getAttendanceConfigCollectionDefaults,
} from "@/lib/attendanceConfig/attendanceConfigSeeds";
import type { AttendanceStatus } from "@/lib/data/attendanceData";

function mergeAttendanceSettings(settings: Partial<AttendanceModuleSettings> | null | undefined): AttendanceModuleSettings {
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

export function loadAttendanceSettings(): AttendanceModuleSettings {
  return mergeAttendanceSettings(
    getObject<Partial<AttendanceModuleSettings>>(
      ATTENDANCE_MODULE_CONTRACT.settingsObjectKey,
      DEFAULT_ATTENDANCE_SETTINGS
    ),
  );
}

export function useAttendanceConfig() {
  const defaults = useMemo(() => getAttendanceConfigCollectionDefaults(), []);
  const [settings, setSettings] = useState<AttendanceModuleSettings>(() => loadAttendanceSettings());
  const [statuses, setStatuses] = useState<AttendanceStatus[]>(() =>
    getCollection(ATTENDANCE_CONFIG_COLLECTION_KEYS.statuses, defaults.statuses)
  );

  const reloadAttendanceConfig = useCallback(() => {
    setSettings(loadAttendanceSettings());
    setStatuses(getCollection(ATTENDANCE_CONFIG_COLLECTION_KEYS.statuses, defaults.statuses));
  }, [defaults]);

  useEffect(() => {
    reloadAttendanceConfig();
  }, [reloadAttendanceConfig]);

  useEffect(() => {
    const handleLocalDatabaseUpdate = () => {
      queueMicrotask(reloadAttendanceConfig);
    };
    window.addEventListener("local-database-update", handleLocalDatabaseUpdate);
    return () => window.removeEventListener("local-database-update", handleLocalDatabaseUpdate);
  }, [reloadAttendanceConfig]);

  const updateSettings = useCallback((settingsDraft: AttendanceModuleSettings) => {
    const merged = mergeAttendanceSettings(settingsDraft);
    saveObject(ATTENDANCE_MODULE_CONTRACT.settingsObjectKey, merged);
    setSettings(merged);
  }, []);

  const fields = useMemo(() => getFlatFieldsConfig(settings.fields), [settings.fields]);
  const customFields = settings.customFields ?? [];
  const fieldOrder = settings.fieldOrder ?? DEFAULT_ATTENDANCE_SETTINGS.fieldOrder ?? [];

  const orderedFields = useMemo(() => {
    return getSortedFields(DEFAULT_ATTENDANCE_FIELD_DEFS, fieldOrder, fields, customFields);
  }, [fieldOrder, fields, customFields]);

  return {
    settings,
    statuses,
    fields,
    customFields,
    orderedFields,
    updateSettings,
  };
}
