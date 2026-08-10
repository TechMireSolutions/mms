import type { FieldDefinition } from './contactFieldSchemaTypes.js';

export interface ModuleFormCustomFieldHelpers {
  listSystemFormFieldKeys: () => ReadonlySet<string>;
  listEnabledCustomFormFields: (
    fields: Record<string, FieldDefinition[]>,
    tabId?: string,
  ) => FieldDefinition[];
  isSystemFormField: (tabId: string, fieldId: string) => boolean;
}

/**
 * Shared form custom-field helpers over a static module field seed.
 * Teachers/Students adapters pass their seed ({@link INITIAL_TEACHERS_FIELD_SEED} /
 * {@link INITIAL_STUDENT_FIELD_SEED}).
 */
export function createFormCustomFieldHelpers(
  seed: Record<string, FieldDefinition[]>,
): ModuleFormCustomFieldHelpers {
  function listSystemFormFieldKeys(): ReadonlySet<string> {
    const keys = new Set<string>();
    for (const tabFields of Object.values(seed)) {
      for (const field of tabFields) {
        keys.add(field.key);
      }
    }
    return keys;
  }

  function listEnabledCustomFormFields(
    fields: Record<string, FieldDefinition[]>,
    tabId?: string,
  ): FieldDefinition[] {
    const systemKeys = listSystemFormFieldKeys();
    const byKey = new Map<string, FieldDefinition>();
    const sourceTabs: FieldDefinition[][] =
      tabId != null ? [fields[tabId] ?? []] : Object.values(fields);

    for (const tabFields of sourceTabs) {
      for (const field of tabFields) {
        if (!field.enabled || systemKeys.has(field.key)) continue;
        if (!byKey.has(field.key)) {
          byKey.set(field.key, field);
        }
      }
    }

    return [...byKey.values()].sort((left, right) => {
      const orderDelta = (left.order ?? 0) - (right.order ?? 0);
      return orderDelta !== 0 ? orderDelta : left.key.localeCompare(right.key);
    });
  }

  function isSystemFormField(tabId: string, fieldId: string): boolean {
    return (seed[tabId] ?? []).some((field) => field.key === fieldId);
  }

  return { listSystemFormFieldKeys, listEnabledCustomFormFields, isSystemFormField };
}
