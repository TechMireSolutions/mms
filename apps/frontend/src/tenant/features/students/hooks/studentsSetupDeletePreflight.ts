import {
  type FieldDefinition,
  type StudentsSettings,
  type ColumnRegistryEntry,
  DEFAULT_STUDENT_COLUMN_REGISTRY,
  STUDENTS_MODULE_MANIFEST,
  getStudentFieldRemovalIssues,
  syncStudentColumnRegistryWithFields,
} from "@mms/shared";
import {
  createModuleFieldDeletePreflight,
  type ModuleFieldsDraftSnapshot,
  type ModuleSetupDeleteNotify,
} from "@/lib/setup/moduleFieldDeletePreflight";

export type StudentsFieldsDraftSnapshot = ModuleFieldsDraftSnapshot<FieldDefinition>;

type StudentsSetupDeleteNotify = ModuleSetupDeleteNotify;

type StudentPreflightContext = {
  settings: StudentsSettings;
  fieldsDraft: StudentsFieldsDraftSnapshot;
  onBlocked: StudentsSetupDeleteNotify;
};

const { preflightFieldDelete, preflightFieldsDelete } =
  createModuleFieldDeletePreflight<
    FieldDefinition,
    ColumnRegistryEntry,
    StudentPreflightContext
  >({
    restBasePath: STUDENTS_MODULE_MANIFEST.restBasePath,
    usageMessageKey: "students.setup.fieldHasStudentData",
    saveFailedKey: "students.setup.saveFailed",
    defaultColumnRegistry: DEFAULT_STUDENT_COLUMN_REGISTRY,
    syncColumnRegistryWithFields: syncStudentColumnRegistryWithFields,
    getColumnRegistry: (context) => context.settings.columnRegistry,
    getRemovalIssues: (fieldKey, columnRegistry) =>
      getStudentFieldRemovalIssues({
        fieldKey,
        columnRegistry,
      }),
  });

/** Shared dependency + live usage checks before removing a Students Setup field. */
export async function preflightStudentFieldDelete(
  fieldId: string,
  context: StudentPreflightContext,
): Promise<boolean> {
  return preflightFieldDelete(fieldId, context);
}

/**
 * Prefights many field deletes: sync deps first, then one batch usage POST.
 */
export async function preflightStudentFieldsDelete(
  fieldIds: string[],
  context: StudentPreflightContext,
): Promise<boolean> {
  return preflightFieldsDelete(fieldIds, context);
}
