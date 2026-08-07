import {
  type FieldConfig,
  type ContactPreferences,
  type ColumnRegistryEntry,
  type FieldDefinition,
  DEFAULT_COLUMN_REGISTRY,
  getContactFieldRemovalIssues,
  syncContactColumnRegistryWithFields,
  CONTACTS_MODULE_MANIFEST,
} from "@mms/shared";
import {
  createModuleFieldDeletePreflight,
  type ModuleFieldsDraftSnapshot,
  type ModuleSetupDeleteNotify,
} from "@/lib/setup/moduleFieldDeletePreflight";

export type FieldsDraftSnapshot = ModuleFieldsDraftSnapshot<FieldDefinition>;

export type SetupDeleteNotify = ModuleSetupDeleteNotify;

type ContactPreflightContext = {
  config: FieldConfig;
  contextPrefs: Pick<ContactPreferences, "duplicateDetectionFields">;
  fieldsDraft: FieldsDraftSnapshot;
  onBlocked: SetupDeleteNotify;
};

const { preflightFieldDelete, preflightFieldsDelete } =
  createModuleFieldDeletePreflight<
    FieldDefinition,
    ColumnRegistryEntry,
    ContactPreflightContext
  >({
    restBasePath: CONTACTS_MODULE_MANIFEST.restBasePath,
    usageMessageKey: "contacts.setup.fieldHasContactData",
    saveFailedKey: "contacts.saveFailed",
    defaultColumnRegistry: DEFAULT_COLUMN_REGISTRY,
    syncColumnRegistryWithFields: syncContactColumnRegistryWithFields,
    getColumnRegistry: (context) => context.config.columnRegistry,
    getRemovalIssues: (fieldKey, columnRegistry, context) =>
      getContactFieldRemovalIssues({
        fieldKey,
        columnRegistry,
        preferences: context.contextPrefs,
      }),
  });

/** Shared dependency + live usage checks before removing a Contacts Setup field. */
export async function preflightContactFieldDelete(
  fieldId: string,
  context: ContactPreflightContext,
): Promise<boolean> {
  return preflightFieldDelete(fieldId, context);
}

/**
 * Prefights many field deletes: sync deps first, then one batch usage POST.
 */
export async function preflightContactFieldsDelete(
  fieldIds: string[],
  context: ContactPreflightContext,
): Promise<boolean> {
  return preflightFieldsDelete(fieldIds, context);
}
