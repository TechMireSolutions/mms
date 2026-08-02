import {
  type FieldConfig,
  type ContactPreferences,
  DEFAULT_COLUMN_REGISTRY,
  getContactFieldRemovalIssues,
  syncContactColumnRegistryWithFields,
  CONTACTS_MODULE_MANIFEST,
} from "@mms/shared";
import { apiJson } from "@/lib/apiClient";

export type FieldsDraftSnapshot = {
  buildFieldsMap: () => FieldConfig["fields"];
  enabledTabs: Iterable<string>;
};

export type SetupDeleteNotify = (
  messageKey: string,
  params?: { count: number },
) => void;

type PrefightContext = {
  config: FieldConfig;
  contextPrefs: Pick<ContactPreferences, "duplicateDetectionFields">;
  fieldsDraft: FieldsDraftSnapshot;
  onBlocked: SetupDeleteNotify;
};

function syncRemovalBlock(
  fieldId: string,
  {
    config,
    contextPrefs,
    fieldsDraft,
  }: Omit<PrefightContext, "onBlocked">,
): { messageKey: string; count?: number } | null {
  const draftFields = fieldsDraft.buildFieldsMap() || {};
  const fieldsForColumnSync = Object.fromEntries(
    Object.entries(draftFields).map(([draftTabId, list]) => [
      draftTabId,
      (list || []).map((field) =>
        field.key === fieldId ? { ...field, enabled: false } : field,
      ),
    ]),
  );
  const draftColumnRegistry = syncContactColumnRegistryWithFields(
    config.columnRegistry || DEFAULT_COLUMN_REGISTRY,
    fieldsForColumnSync,
    fieldsDraft.enabledTabs,
  ).map((col) => (col.key === fieldId ? { ...col, enabled: false } : col));

  const issues = getContactFieldRemovalIssues({
    fieldKey: fieldId,
    columnRegistry: draftColumnRegistry,
    preferences: contextPrefs,
  });
  if (issues.length === 0) return null;
  const issue = issues[0];
  return {
    messageKey: issue.messageKey,
    count: issue.count,
  };
}

function notifyBlock(
  onBlocked: SetupDeleteNotify,
  block: { messageKey: string; count?: number },
): void {
  onBlocked(
    block.messageKey,
    block.count !== undefined ? { count: block.count } : undefined,
  );
}

/** Shared dependency + live usage checks before removing a Contacts Setup field. */
export async function preflightContactFieldDelete(
  fieldId: string,
  context: PrefightContext,
): Promise<boolean> {
  const syncBlock = syncRemovalBlock(fieldId, context);
  if (syncBlock) {
    notifyBlock(context.onBlocked, syncBlock);
    return false;
  }

  try {
    const { count } = await apiJson<{ count: number }>(
      `${CONTACTS_MODULE_MANIFEST.restBasePath}/field-usage/${encodeURIComponent(fieldId)}`,
    );
    if (count > 0) {
      notifyBlock(context.onBlocked, {
        messageKey: "contacts.setup.fieldHasContactData",
        count,
      });
      return false;
    }
  } catch {
    notifyBlock(context.onBlocked, { messageKey: "contacts.saveFailed" });
    return false;
  }

  return true;
}

/**
 * Prefights many field deletes: sync deps first, then one batch usage POST.
 */
export async function preflightContactFieldsDelete(
  fieldIds: string[],
  context: PrefightContext,
): Promise<boolean> {
  for (const fieldId of fieldIds) {
    const syncBlock = syncRemovalBlock(fieldId, context);
    if (syncBlock) {
      notifyBlock(context.onBlocked, syncBlock);
      return false;
    }
  }

  if (fieldIds.length === 0) return true;

  try {
    const { counts } = await apiJson<{ counts: Record<string, number> }>(
      `${CONTACTS_MODULE_MANIFEST.restBasePath}/field-usage`,
      {
        method: "POST",
        body: JSON.stringify({ fieldKeys: fieldIds }),
      },
    );

    for (const fieldId of fieldIds) {
      const count = counts[fieldId] ?? 0;
      if (count > 0) {
        notifyBlock(context.onBlocked, {
          messageKey: "contacts.setup.fieldHasContactData",
          count,
        });
        return false;
      }
    }
  } catch {
    notifyBlock(context.onBlocked, { messageKey: "contacts.saveFailed" });
    return false;
  }

  return true;
}
