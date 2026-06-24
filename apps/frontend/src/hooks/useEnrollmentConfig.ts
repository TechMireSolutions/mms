import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_ENROLLMENTS_SETTINGS,
  DEFAULT_ENROLLMENTS_FIELD_DEFS,
  ENROLLMENTS_MODULE_CONTRACT,
  getSortedFields,
  mergeTabbedFields,
  getFlatFieldsConfig,
  type EnrollmentsSettings,
} from "@mms/shared";
import { getObject, saveObject } from "@/lib/db";

function mergeEnrollmentsSettings(settings: Partial<EnrollmentsSettings> | null | undefined): EnrollmentsSettings {
  return {
    ...DEFAULT_ENROLLMENTS_SETTINGS,
    ...(settings ?? {}),
    formTabs: settings?.formTabs ?? DEFAULT_ENROLLMENTS_SETTINGS.formTabs ?? [],
    enabledTabs: settings?.enabledTabs ?? DEFAULT_ENROLLMENTS_SETTINGS.enabledTabs ?? [],
    requiredTabs: settings?.requiredTabs ?? DEFAULT_ENROLLMENTS_SETTINGS.requiredTabs ?? [],
    fields: mergeTabbedFields(
      DEFAULT_ENROLLMENTS_SETTINGS.fields || {},
      settings?.fields
    ),
    customFields: settings?.customFields ?? DEFAULT_ENROLLMENTS_SETTINGS.customFields ?? [],
    fieldOrder: settings?.fieldOrder ?? DEFAULT_ENROLLMENTS_SETTINGS.fieldOrder ?? [],
  };
}

export function loadEnrollmentsSettings(): EnrollmentsSettings {
  return mergeEnrollmentsSettings(
    getObject<Partial<EnrollmentsSettings>>(
      ENROLLMENTS_MODULE_CONTRACT.settingsObjectKey,
      DEFAULT_ENROLLMENTS_SETTINGS
    ),
  );
}

export function useEnrollmentConfig() {
  const [settings, setSettings] = useState<EnrollmentsSettings>(() => loadEnrollmentsSettings());

  const reloadEnrollmentConfig = useCallback(() => {
    setSettings(loadEnrollmentsSettings());
  }, []);

  useEffect(() => {
    reloadEnrollmentConfig();
  }, [reloadEnrollmentConfig]);

  useEffect(() => {
    const handleLocalDatabaseUpdate = () => {
      queueMicrotask(reloadEnrollmentConfig);
    };
    window.addEventListener("local-database-update", handleLocalDatabaseUpdate);
    return () => window.removeEventListener("local-database-update", handleLocalDatabaseUpdate);
  }, [reloadEnrollmentConfig]);

  const updateSettings = useCallback((next: EnrollmentsSettings) => {
    const merged = mergeEnrollmentsSettings(next);
    saveObject(ENROLLMENTS_MODULE_CONTRACT.settingsObjectKey, merged);
    setSettings(merged);
  }, []);

  const fields = useMemo(() => getFlatFieldsConfig(settings.fields), [settings.fields]);
  const customFields = settings.customFields ?? [];
  const fieldOrder = settings.fieldOrder ?? DEFAULT_ENROLLMENTS_SETTINGS.fieldOrder ?? [];

  const orderedFields = useMemo(
    () => getSortedFields(DEFAULT_ENROLLMENTS_FIELD_DEFS, fieldOrder, fields, customFields),
    [fieldOrder, fields, customFields],
  );

  return {
    settings,
    orderedFields,
    fields,
    customFields,
    updateSettings,
  };
}

