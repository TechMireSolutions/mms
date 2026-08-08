import {
  type FieldDefinition,
  type TeachersSettings,
  type ColumnRegistryEntry,
  TEACHERS_MODULE_MANIFEST,
  getTeacherFieldRemovalIssues,
} from "@mms/shared";
import {
  createModuleFieldDeletePreflight,
  type ModuleFieldsDraftSnapshot,
  type ModuleSetupDeleteNotify,
} from "@/lib/setup/moduleFieldDeletePreflight";

export type TeachersFieldsDraftSnapshot = ModuleFieldsDraftSnapshot<FieldDefinition>;

export type TeachersSetupDeleteNotify = ModuleSetupDeleteNotify;

type TeacherPreflightContext = {
  settings: TeachersSettings;
  fieldsDraft: TeachersFieldsDraftSnapshot;
  onBlocked: TeachersSetupDeleteNotify;
};

const EMPTY_COLUMN_REGISTRY: ColumnRegistryEntry[] = [];

const { preflightFieldDelete, preflightFieldsDelete } =
  createModuleFieldDeletePreflight<
    FieldDefinition,
    ColumnRegistryEntry,
    TeacherPreflightContext
  >({
    restBasePath: TEACHERS_MODULE_MANIFEST.restBasePath,
    usageMessageKey: "teachers.setup.fieldHasTeacherData",
    saveFailedKey: "teachers.setup.saveFailed",
    defaultColumnRegistry: EMPTY_COLUMN_REGISTRY,
    syncColumnRegistryWithFields: (registry) => registry,
    getColumnRegistry: (context) => context.settings.columnRegistry,
    getRemovalIssues: (fieldKey, columnRegistry) =>
      getTeacherFieldRemovalIssues({
        fieldKey,
        columnRegistry,
      }),
  });

/** Shared dependency + live usage checks before removing a Teachers Setup field. */
export async function preflightTeacherFieldDelete(
  fieldId: string,
  context: TeacherPreflightContext,
): Promise<boolean> {
  return preflightFieldDelete(fieldId, context);
}

/**
 * Prefights many field deletes: sync deps first, then one batch usage POST.
 */
export async function preflightTeacherFieldsDelete(
  fieldIds: string[],
  context: TeacherPreflightContext,
): Promise<boolean> {
  return preflightFieldsDelete(fieldIds, context);
}
