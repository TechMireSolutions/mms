/**
 * @file studentFieldsStore.ts
 * @description Tenant-cache persistence for student field and settings configuration.
 */
import {
  DEFAULT_STUDENT_ENABLED_TABS,
  DEFAULT_STUDENT_REQUIRED_TABS,
  STUDENT_TAB_REGISTRY,
  INITIAL_STUDENT_FIELD_SEED,
  DEFAULT_STUDENT_COLUMN_REGISTRY,
  DEFAULT_STUDENTS_SETTINGS,
  STUDENTS_MODULE_CONTRACT,
  refreshModuleTierTabLabels,
  refreshModuleTierTabKeys,
  type StudentsSettings,
  type FieldDefinition,
  type StudentCustomField,
} from "@mms/shared";
import { getObject, saveObject } from "../db";

function isLegacyFlatFields(fields: unknown): boolean {
  if (!fields || typeof fields !== "object") return false;
  const values = Object.values(fields);
  if (values.length === 0) return false;
  return !Array.isArray(values[0]);
}

export function getSystemDefaults(): StudentsSettings {
  return JSON.parse(JSON.stringify(DEFAULT_STUDENTS_SETTINGS));
}

export function migrateConfig(config: unknown): StudentsSettings {
  const defaults = getSystemDefaults();
  if (!config || typeof config !== "object") {
    return defaults;
  }

  const rawConfig = config as Record<string, unknown>;
  const storedVersion = typeof rawConfig.version === "number" ? rawConfig.version : 0;

  const studentSettingsDraft = { ...rawConfig } as unknown as Partial<StudentsSettings>;

  const normalizeTabs = (tabs: any[] | undefined) => {
    if (!Array.isArray(tabs)) return undefined;
    return tabs.map((tab) => {
      if (tab && typeof tab === "object" && !tab.key && tab.id) {
        return { ...tab, key: tab.id };
      }
      return tab;
    });
  };

  // If the version is < 2, or the fields are in the old flat format, perform migration
  if (storedVersion < 2 || !studentSettingsDraft.fields || isLegacyFlatFields(studentSettingsDraft.fields)) {
    const legacyFields = (studentSettingsDraft.fields ?? {}) as Record<string, { enabled?: boolean; required?: boolean }>;
    const legacyCustomFields = (studentSettingsDraft.customFields ?? []) as StudentCustomField[];
    const legacyFieldOrder = (studentSettingsDraft.fieldOrder ?? []) as string[];

    studentSettingsDraft.formTabs = [...STUDENT_TAB_REGISTRY];
    studentSettingsDraft.enabledTabs = [...DEFAULT_STUDENT_ENABLED_TABS];
    studentSettingsDraft.requiredTabs = [...DEFAULT_STUDENT_REQUIRED_TABS];
    studentSettingsDraft.columnRegistry = [...DEFAULT_STUDENT_COLUMN_REGISTRY];

    const migratedFields: Record<string, FieldDefinition[]> = {};

    for (const [tabKey, seedFields] of Object.entries(INITIAL_STUDENT_FIELD_SEED)) {
      migratedFields[tabKey] = seedFields.map((field) => {
        const legacyCfg = legacyFields[field.key];
        return {
          ...field,
          enabled: legacyCfg?.enabled ?? field.enabled,
          required: legacyCfg?.required ?? field.required,
        };
      });
    }

    if (legacyCustomFields.length > 0) {
      if (!migratedFields.basic) {
        migratedFields.basic = [];
      }
      legacyCustomFields.forEach((legacyCustomField) => {
        if (!migratedFields.basic.some((field) => field.key === legacyCustomField.id)) {
          migratedFields.basic.push({
            key: legacyCustomField.id,
            label: legacyCustomField.label,
            type: legacyCustomField.type as any,
            enabled: true,
            required: legacyCustomField.required ?? false,
            options: legacyCustomField.options,
            order: migratedFields.basic.length,
          });
        }
      });
    }

    if (legacyFieldOrder.length > 0) {
      const orderMap = Object.fromEntries(legacyFieldOrder.map((fieldKey, index) => [fieldKey, index]));
      for (const [tabKey, fieldsList] of Object.entries(migratedFields)) {
        fieldsList.sort((leftField, rightField) => {
          const leftFieldOrder = orderMap[leftField.key] ?? 9999;
          const rightFieldOrder = orderMap[rightField.key] ?? 9999;
          return leftFieldOrder - rightFieldOrder;
        });
        fieldsList.forEach((field, index) => {
          field.order = index;
        });
      }
    }

    studentSettingsDraft.fields = migratedFields;
    studentSettingsDraft.version = 2;
  } else {
    studentSettingsDraft.formTabs = refreshModuleTierTabLabels(
      refreshModuleTierTabKeys(normalizeTabs(studentSettingsDraft.formTabs) ?? defaults.formTabs ?? STUDENT_TAB_REGISTRY)
    );
    studentSettingsDraft.columnRegistry = studentSettingsDraft.columnRegistry ?? defaults.columnRegistry;
    studentSettingsDraft.fields = studentSettingsDraft.fields ?? defaults.fields;
  }

  return {
    ...defaults,
    ...studentSettingsDraft,
  } as StudentsSettings;
}

export function sanitizeConfig(config: StudentsSettings): StudentsSettings {
  if (!config || typeof config !== "object") {
    return getSystemDefaults();
  }

  const studentSettingsDraft = { ...config };

  if (Array.isArray(studentSettingsDraft.formTabs)) {
    studentSettingsDraft.formTabs = studentSettingsDraft.formTabs.filter(
      (tab) => tab && typeof tab === "object" && typeof tab.key === "string" && tab.key.trim().length > 0
    );
  }

  return studentSettingsDraft;
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
