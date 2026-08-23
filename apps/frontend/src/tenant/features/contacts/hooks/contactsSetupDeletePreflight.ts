import {
  type FieldConfig,
  type ContactPreferences,
  type ColumnRegistryEntry,
  type FieldDefinition,
  DEFAULT_COLUMN_REGISTRY,
  getContactFieldRemovalIssues,
  syncContactColumnRegistryWithFields,
} from "@mms/shared";
import {
  createModuleFieldDeletePreflight,
  type ModuleFieldsDraftSnapshot,
  type ModuleSetupDeleteNotify,
} from "@/lib/setup/moduleFieldDeletePreflight";
import { apiContract } from "@/lib/api";

export type FieldsDraftSnapshot = ModuleFieldsDraftSnapshot<FieldDefinition>;

type SetupDeleteNotify = ModuleSetupDeleteNotify;

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
    getFieldUsage: async (fieldKey) => {
      const res = await apiContract.contacts.getFieldUsage({ params: { fieldId: fieldKey } });
      if (res.status !== 200) throw new Error("Failed to get field usage");
      return (res.body as any)?.count ?? 0;
    },
    getFieldsUsage: async (fieldKeys) => {
      const res = await apiContract.contacts.getFieldsUsage({ body: { fieldKeys } });
      if (res.status !== 200) throw new Error("Failed to get fields usage");
      return (res.body as any)?.counts ?? {};
    },
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
