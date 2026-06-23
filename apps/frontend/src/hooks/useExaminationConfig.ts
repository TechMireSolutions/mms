import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_EXAMINATIONS_SETTINGS,
  EXAMINATIONS_MODULE_CONTRACT,
  type ExaminationsSettings,
} from "@mms/shared";
import { getObject, saveObject } from "@/lib/db";

function mergeExaminationsSettings(settings: Partial<ExaminationsSettings> | null | undefined): ExaminationsSettings {
  return {
    ...DEFAULT_EXAMINATIONS_SETTINGS,
    ...(settings ?? {}),
    fields: {
      ...(DEFAULT_EXAMINATIONS_SETTINGS.fields ?? {}),
      ...(settings?.fields ?? {}),
    },
    customFields: settings?.customFields ?? DEFAULT_EXAMINATIONS_SETTINGS.customFields ?? [],
    fieldOrder: settings?.fieldOrder ?? DEFAULT_EXAMINATIONS_SETTINGS.fieldOrder ?? [],
  };
}

export function loadExaminationsSettings(): ExaminationsSettings {
  return mergeExaminationsSettings(
    getObject<Partial<ExaminationsSettings>>(
      EXAMINATIONS_MODULE_CONTRACT.settingsObjectKey,
      DEFAULT_EXAMINATIONS_SETTINGS
    ),
  );
}

export function useExaminationConfig() {
  const [settings, setSettings] = useState<ExaminationsSettings>(() => loadExaminationsSettings());

  const reloadExaminationsConfig = useCallback(() => {
    setSettings(loadExaminationsSettings());
  }, []);

  useEffect(() => {
    reloadExaminationsConfig();
  }, [reloadExaminationsConfig]);

  useEffect(() => {
    const handleLocalDatabaseUpdate = () => {
      queueMicrotask(reloadExaminationsConfig);
    };
    window.addEventListener("local-database-update", handleLocalDatabaseUpdate);
    return () => window.removeEventListener("local-database-update", handleLocalDatabaseUpdate);
  }, [reloadExaminationsConfig]);

  const updateSettings = useCallback((next: ExaminationsSettings) => {
    const merged = mergeExaminationsSettings(next);
    saveObject(EXAMINATIONS_MODULE_CONTRACT.settingsObjectKey, merged);
    setSettings(merged);
  }, []);

  return {
    settings,
    updateSettings,
  };
}
