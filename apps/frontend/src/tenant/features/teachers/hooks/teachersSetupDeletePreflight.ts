import {
  type FieldDefinition,
  type TeachersSettings,
  type ColumnRegistryEntry,
  TEACHERS_MODULE_MANIFEST,
  buildTeacherWorkColumnRegistry,
  getTeacherFieldRemovalIssues,
  syncTeacherColumnRegistryWithFields,
  defaultTeacherWorkColumnRegistry,
  TEACHER_WORK_COLUMN_PLACEHOLDER_LABELS,
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

const { preflightFieldDelete } =
  createModuleFieldDeletePreflight<
    FieldDefinition,
    ColumnRegistryEntry,
    TeacherPreflightContext
  >({
    restBasePath: TEACHERS_MODULE_MANIFEST.restBasePath,
    usageMessageKey: "teachers.setup.fieldHasTeacherData",
    saveFailedKey: "teachers.setup.saveFailed",
    defaultColumnRegistry: defaultTeacherWorkColumnRegistry(),
    syncColumnRegistryWithFields: syncTeacherColumnRegistryWithFields,
    getColumnRegistry: (context) =>
      buildTeacherWorkColumnRegistry(context.settings, TEACHER_WORK_COLUMN_PLACEHOLDER_LABELS),
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
