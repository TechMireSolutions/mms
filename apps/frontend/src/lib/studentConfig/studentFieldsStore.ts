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

  const cfg = { ...rawConfig } as unknown as Partial<StudentsSettings>;

  const normalizeTabs = (tabs: any[] | undefined) => {
    if (!Array.isArray(tabs)) return undefined;
    return tabs.map(t => {
      if (t && typeof t === "object" && !t.key && t.id) {
        return { ...t, key: t.id };
      }
      return t;
    });
  };

  // If the version is < 2, or the fields are in the old flat format, perform migration
  if (storedVersion < 2 || !cfg.fields || isLegacyFlatFields(cfg.fields)) {
    const legacyFields = (cfg.fields ?? {}) as Record<string, { enabled?: boolean; required?: boolean }>;
    const legacyCustoms = (cfg.customFields ?? []) as StudentCustomField[];
    const legacyOrder = (cfg.fieldOrder ?? []) as string[];

    cfg.formTabs = [...STUDENT_TAB_REGISTRY];
    cfg.enabledTabs = [...DEFAULT_STUDENT_ENABLED_TABS];
    cfg.requiredTabs = [...DEFAULT_STUDENT_REQUIRED_TABS];
    cfg.columnRegistry = [...DEFAULT_STUDENT_COLUMN_REGISTRY];

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

    if (legacyCustoms.length > 0) {
      if (!migratedFields.basic) {
        migratedFields.basic = [];
      }
      legacyCustoms.forEach((cf) => {
        if (!migratedFields.basic.some(f => f.key === cf.id)) {
          migratedFields.basic.push({
            key: cf.id,
            label: cf.label,
            type: cf.type as any,
            enabled: true,
            required: cf.required ?? false,
            options: cf.options,
            order: migratedFields.basic.length,
          });
        }
      });
    }

    if (legacyOrder.length > 0) {
      const orderMap = Object.fromEntries(legacyOrder.map((key, idx) => [key, idx]));
      for (const [tabKey, fieldsList] of Object.entries(migratedFields)) {
        fieldsList.sort((a, b) => {
          const aOrder = orderMap[a.key] ?? 9999;
          const bOrder = orderMap[b.key] ?? 9999;
          return aOrder - bOrder;
        });
        fieldsList.forEach((f, idx) => {
          f.order = idx;
        });
      }
    }

    cfg.fields = migratedFields;
    cfg.version = 2;
  } else {
    cfg.formTabs = refreshModuleTierTabLabels(
      refreshModuleTierTabKeys(normalizeTabs(cfg.formTabs) ?? defaults.formTabs ?? STUDENT_TAB_REGISTRY)
    );
    cfg.columnRegistry = cfg.columnRegistry ?? defaults.columnRegistry;
    cfg.fields = cfg.fields ?? defaults.fields;
  }

  return {
    ...defaults,
    ...cfg,
  } as StudentsSettings;
}

export function sanitizeConfig(config: StudentsSettings): StudentsSettings {
  if (!config || typeof config !== "object") {
    return getSystemDefaults();
  }

  const cfg = { ...config };

  if (Array.isArray(cfg.formTabs)) {
    cfg.formTabs = cfg.formTabs.filter(
      (t) => t && typeof t === "object" && typeof t.key === "string" && t.key.trim().length > 0
    );
  }

  return cfg;
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
