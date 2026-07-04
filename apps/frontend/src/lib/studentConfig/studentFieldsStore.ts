/**
 * @file studentFieldsStore.ts
 * @description Tenant-cache persistence for student field and settings configuration.
 */
import {
  DEFAULT_STUDENTS_SETTINGS,
  STUDENTS_MODULE_CONTRACT,
  normalizeStudentsSettings,
  type StudentsSettings,
} from "@mms/shared";
import { getObject, saveObject } from "@/lib/db";

export function getSystemDefaults(): StudentsSettings {
  return normalizeStudentsSettings(DEFAULT_STUDENTS_SETTINGS);
}

export function migrateConfig(config: unknown): StudentsSettings {
  return normalizeStudentsSettings(config);
}

export function sanitizeConfig(config: StudentsSettings): StudentsSettings {
  return normalizeStudentsSettings(config);
}

export function loadStudentSettings(): StudentsSettings {
  const fallback = getSystemDefaults();
  const parsed = getObject<Partial<StudentsSettings>>(STUDENTS_MODULE_CONTRACT.settingsObjectKey, fallback);
  const migrated = migrateConfig(parsed);

  const merged: StudentsSettings = {
    ...fallback,
    ...migrated,
    enabledTabs: migrated.enabledTabs ?? fallback.enabledTabs,
    requiredTabs: migrated.requiredTabs ?? fallback.requiredTabs,
    fields: migrated.fields ?? fallback.fields,
  };

  return sanitizeConfig(merged);
}

export function saveStudentSettings(config: StudentsSettings): void {
  saveObject(STUDENTS_MODULE_CONTRACT.settingsObjectKey, { ...config, version: 2 });
}
