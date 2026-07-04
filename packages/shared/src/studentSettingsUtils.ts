import {
  DEFAULT_STUDENT_COLUMN_REGISTRY,
  DEFAULT_STUDENT_ENABLED_TABS,
  DEFAULT_STUDENT_REQUIRED_TABS,
  DEFAULT_STUDENTS_SETTINGS,
  INITIAL_STUDENT_FIELD_SEED,
  STUDENT_TAB_REGISTRY,
  type StudentCustomField,
  type StudentsSettings,
} from './settingsTypes.js';
import type { FieldDefinition } from './contactTypes.js';
import {
  refreshModuleTierTabKeys,
  refreshModuleTierTabLabels,
} from './moduleTierTabs.js';

function cloneStudentSettings(settings: StudentsSettings): StudentsSettings {
  return JSON.parse(JSON.stringify(settings)) as StudentsSettings;
}

function isLegacyFlatFields(fields: unknown): boolean {
  if (!fields || typeof fields !== 'object') return false;
  const values = Object.values(fields);
  if (values.length === 0) return false;
  return !Array.isArray(values[0]);
}

function normalizeTabs(tabs: unknown): StudentsSettings['formTabs'] | undefined {
  if (!Array.isArray(tabs)) return undefined;
  return tabs
    .filter((tab) => tab && typeof tab === 'object')
    .map((tab) => {
      const tabRecord = tab as Record<string, unknown>;
      if (!tabRecord.key && typeof tabRecord.id === 'string') {
        return { ...tabRecord, key: tabRecord.id };
      }
      return tabRecord;
    }) as unknown as StudentsSettings['formTabs'];
}

export function normalizeStudentsSettings(config: unknown): StudentsSettings {
  const defaults = cloneStudentSettings(DEFAULT_STUDENTS_SETTINGS);
  if (!config || typeof config !== 'object') {
    return {
      ...defaults,
      formTabs: refreshModuleTierTabLabels(refreshModuleTierTabKeys([...STUDENT_TAB_REGISTRY])),
      enabledTabs: [...DEFAULT_STUDENT_ENABLED_TABS],
      requiredTabs: [...DEFAULT_STUDENT_REQUIRED_TABS],
      fields: JSON.parse(JSON.stringify(INITIAL_STUDENT_FIELD_SEED)) as Record<string, FieldDefinition[]>,
      columnRegistry: [...DEFAULT_STUDENT_COLUMN_REGISTRY],
      version: 2,
    };
  }

  const rawConfig = config as Record<string, unknown>;
  const storedVersion = typeof rawConfig.version === 'number' ? rawConfig.version : 0;
  const draft = { ...rawConfig } as Partial<StudentsSettings>;
  const hasLegacyFlatFields = isLegacyFlatFields(draft.fields);
  const hasModernTabbedFields = !!draft.fields && !hasLegacyFlatFields;

  if (!hasModernTabbedFields && (storedVersion < 2 || !draft.fields || hasLegacyFlatFields)) {
    const legacyFields = (draft.fields ?? {}) as Record<string, { enabled?: boolean; required?: boolean }>;
    const legacyCustomFields = (draft.customFields ?? []) as StudentCustomField[];
    const legacyFieldOrder = (draft.fieldOrder ?? []) as string[];

    draft.formTabs = refreshModuleTierTabLabels(refreshModuleTierTabKeys([...STUDENT_TAB_REGISTRY]));
    draft.enabledTabs = [...DEFAULT_STUDENT_ENABLED_TABS];
    draft.requiredTabs = [...DEFAULT_STUDENT_REQUIRED_TABS];
    draft.columnRegistry = [...DEFAULT_STUDENT_COLUMN_REGISTRY];

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
      migratedFields.basic ??= [];
      for (const legacyCustomField of legacyCustomFields) {
        if (migratedFields.basic.some((field) => field.key === legacyCustomField.id)) continue;
        migratedFields.basic.push({
          key: legacyCustomField.id,
          label: legacyCustomField.label,
          type: (legacyCustomField.type ?? 'text') as FieldDefinition['type'],
          enabled: true,
          required: legacyCustomField.required ?? false,
          options: legacyCustomField.options,
          order: migratedFields.basic.length,
        });
      }
    }

    if (legacyFieldOrder.length > 0) {
      const orderMap = Object.fromEntries(legacyFieldOrder.map((fieldKey, index) => [fieldKey, index]));
      for (const fieldsList of Object.values(migratedFields)) {
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

    draft.fields = migratedFields;
    draft.version = 2;
  } else {
    draft.formTabs = refreshModuleTierTabLabels(
      refreshModuleTierTabKeys(normalizeTabs(draft.formTabs) ?? defaults.formTabs ?? STUDENT_TAB_REGISTRY),
    );
    draft.enabledTabs = draft.enabledTabs ?? defaults.enabledTabs ?? DEFAULT_STUDENT_ENABLED_TABS;
    draft.requiredTabs = draft.requiredTabs ?? defaults.requiredTabs ?? DEFAULT_STUDENT_REQUIRED_TABS;
    draft.fields = draft.fields ?? defaults.fields;
    draft.columnRegistry = draft.columnRegistry ?? defaults.columnRegistry ?? DEFAULT_STUDENT_COLUMN_REGISTRY;
  }

  const merged = {
    ...defaults,
    ...draft,
    enabledTabs: draft.enabledTabs ?? defaults.enabledTabs ?? DEFAULT_STUDENT_ENABLED_TABS,
    requiredTabs: draft.requiredTabs ?? defaults.requiredTabs ?? DEFAULT_STUDENT_REQUIRED_TABS,
    fields: draft.fields ?? defaults.fields,
    version: typeof draft.version === 'number' ? draft.version : 2,
  } as StudentsSettings;

  if (Array.isArray(merged.formTabs)) {
    merged.formTabs = merged.formTabs.filter(
      (tab) => tab && typeof tab === 'object' && typeof tab.key === 'string' && tab.key.trim().length > 0,
    );
  }

  return merged;
}
