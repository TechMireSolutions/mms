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
import type { FieldDefinition, TabDefinition } from './contactTypes.js';
import {
  refreshModuleTierTabKeys,
  refreshModuleTierTabLabels,
} from './moduleTierTabs.js';

const OBSOLETE_STUDENT_SETUP_TABS = new Set(['guardian', 'academic']);
const STUDENT_SETTINGS_VERSION = 3;

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

function mergeFieldLists(
  primary: FieldDefinition[],
  incoming: FieldDefinition[],
): FieldDefinition[] {
  const merged = [...primary];
  for (const field of incoming) {
    if (merged.some((existing) => existing.key === field.key)) continue;
    merged.push({ ...field });
  }
  merged.forEach((field, index) => {
    field.order = index;
  });
  return merged;
}

/** Collapse guardian → basic and academic → registration (Setup Fields v3). */
export function migrateStudentSetupFieldsToTwoTabs(
  fields: Record<string, FieldDefinition[]>,
): Record<string, FieldDefinition[]> {
  const next: Record<string, FieldDefinition[]> = { ...fields };
  const basic = mergeFieldLists(next.basic ?? [], next.guardian ?? []);
  const registration = mergeFieldLists(next.registration ?? [], next.academic ?? []);
  next.basic = basic;
  next.registration = registration;
  delete next.guardian;
  delete next.academic;
  return next;
}

export function remapStudentEnabledTabs(tabs: string[] | undefined): string[] {
  const source = tabs ?? [];
  const out: string[] = [];
  let hadAcademic = false;
  for (const tab of source) {
    if (tab === 'guardian') continue;
    if (tab === 'academic') {
      hadAcademic = true;
      continue;
    }
    if (!out.includes(tab)) out.push(tab);
  }
  if (hadAcademic && !out.includes('registration')) {
    out.push('registration');
  }
  if (out.length === 0) {
    return [...DEFAULT_STUDENT_ENABLED_TABS];
  }
  return out;
}

function rebuildStudentFormTabs(existing: TabDefinition[] | undefined): TabDefinition[] {
  const registryKeys = new Set(STUDENT_TAB_REGISTRY.map((tab) => tab.key));
  const extras = (normalizeTabs(existing) ?? []).filter(
    (tab) => !registryKeys.has(tab.key) && !OBSOLETE_STUDENT_SETUP_TABS.has(tab.key),
  );
  return refreshModuleTierTabLabels(
    refreshModuleTierTabKeys([...STUDENT_TAB_REGISTRY, ...extras]),
  );
}

function applyStudentSetupV3Migrate(draft: Partial<StudentsSettings>): void {
  const storedVersion = typeof draft.version === 'number' ? draft.version : 0;
  if (storedVersion >= STUDENT_SETTINGS_VERSION) {
    // Still scrub obsolete keys if a partial save left them around.
    if (draft.fields && typeof draft.fields === 'object') {
      const fields = draft.fields as Record<string, FieldDefinition[]>;
      if (fields.guardian || fields.academic) {
        draft.fields = migrateStudentSetupFieldsToTwoTabs(fields);
      }
    }
    return;
  }

  if (draft.fields && typeof draft.fields === 'object' && !isLegacyFlatFields(draft.fields)) {
    draft.fields = migrateStudentSetupFieldsToTwoTabs(
      draft.fields as Record<string, FieldDefinition[]>,
    );
  }

  draft.enabledTabs = remapStudentEnabledTabs(draft.enabledTabs);
  draft.requiredTabs = remapStudentRequiredTabs(draft.requiredTabs);
  draft.formTabs = rebuildStudentFormTabs(draft.formTabs);
  draft.version = STUDENT_SETTINGS_VERSION;
}

function remapStudentRequiredTabs(tabs: string[] | undefined): string[] {
  if (!tabs || tabs.length === 0) return [...DEFAULT_STUDENT_REQUIRED_TABS];
  return remapStudentEnabledTabs(tabs);
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
      version: STUDENT_SETTINGS_VERSION,
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

  applyStudentSetupV3Migrate(draft);

  const merged = {
    ...defaults,
    ...draft,
    enabledTabs: draft.enabledTabs ?? defaults.enabledTabs ?? DEFAULT_STUDENT_ENABLED_TABS,
    requiredTabs: draft.requiredTabs ?? defaults.requiredTabs ?? DEFAULT_STUDENT_REQUIRED_TABS,
    fields: draft.fields ?? defaults.fields,
    version: typeof draft.version === 'number' ? draft.version : STUDENT_SETTINGS_VERSION,
  } as StudentsSettings;

  if (Array.isArray(merged.formTabs)) {
    merged.formTabs = merged.formTabs.filter(
      (tab) => tab && typeof tab === 'object' && typeof tab.key === 'string' && tab.key.trim().length > 0,
    );
  }

  return merged;
}
