import type { ColumnRegistryEntry, FieldDefinition } from './contactTypes.js';
import {
  DEFAULT_STUDENT_COLUMN_REGISTRY,
  STUDENT_COLUMN_FIELD_MAPPING,
} from './moduleFieldSetupPersons.js';
import { listEnabledCustomStudentFormFields } from './studentFormCustomFields.js';
import { syncModuleColumnRegistryWithFields } from './moduleColumnRegistrySync.js';

const STUDENT_LOCKED_ENABLED_TABS = ['basic'] as const;

/**
 * Aligns Students `columnRegistry.enabled` with Setup Fields tab/field enablement.
 * Mapped system columns for disabled tabs/fields are forced off; when active again they
 * restore the default registry enabled flag. Custom columns (`custom:{key}`) stay when
 * the field is enabled and drop when disabled.
 */
export function syncStudentColumnRegistryWithFields(
  columnRegistry: ColumnRegistryEntry[] | undefined,
  fields: Record<string, FieldDefinition[]>,
  enabledTabIds: Iterable<string>,
): ColumnRegistryEntry[] {
  return syncModuleColumnRegistryWithFields({
    defaultRegistry: DEFAULT_STUDENT_COLUMN_REGISTRY,
    columnFieldMapping: STUDENT_COLUMN_FIELD_MAPPING,
    lockedEnabledTabs: STUDENT_LOCKED_ENABLED_TABS,
    columnRegistry,
    fields,
    enabledTabIds,
    listEnabledCustomFields: listEnabledCustomStudentFormFields,
    dropUnknownSystemKeys: true,
  });
}
