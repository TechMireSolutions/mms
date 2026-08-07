import { apiJson } from "@/lib/apiClient";

/** Draft Fields map used when simulating column registry after a field disable. */
export type ModuleFieldsDraftSnapshot<TField extends { key: string } = { key: string }> = {
  buildFieldsMap: () => Record<string, TField[]>;
  enabledTabs: Iterable<string>;
};

export type ModuleSetupDeleteNotify = (
  messageKey: string,
  params?: { count: number },
) => void;

type RemovalBlock = { messageKey: string; count?: number };

type ColumnLike = { key: string; enabled?: boolean };

export type CreateModuleFieldDeletePreflightOptions<
  TField extends { key: string },
  TColumn extends ColumnLike,
  TContext extends {
    fieldsDraft: ModuleFieldsDraftSnapshot<TField>;
    onBlocked: ModuleSetupDeleteNotify;
  },
> = {
  restBasePath: string;
  usageMessageKey: string;
  saveFailedKey: string;
  defaultColumnRegistry: TColumn[];
  syncColumnRegistryWithFields: (
    registry: TColumn[],
    fields: Record<string, TField[]>,
    enabledTabs: Iterable<string>,
  ) => TColumn[];
  getColumnRegistry: (context: TContext) => TColumn[] | undefined;
  getRemovalIssues: (
    fieldKey: string,
    columnRegistry: TColumn[],
    context: TContext,
  ) => Array<{ messageKey: string; count?: number }>;
};

/**
 * Factory for Setup field-delete preflight (sync column deps + live field-usage API).
 * Contacts/Students bind domain sync + removal-issue helpers; HTTP orchestration stays shared.
 */
export function createModuleFieldDeletePreflight<
  TField extends { key: string },
  TColumn extends ColumnLike,
  TContext extends {
    fieldsDraft: ModuleFieldsDraftSnapshot<TField>;
    onBlocked: ModuleSetupDeleteNotify;
  },
>(
  options: CreateModuleFieldDeletePreflightOptions<TField, TColumn, TContext>,
) {
  function syncRemovalBlock(
    fieldId: string,
    context: TContext,
  ): RemovalBlock | null {
    const draftFields = context.fieldsDraft.buildFieldsMap() || {};
    const fieldsForColumnSync = Object.fromEntries(
      Object.entries(draftFields).map(([draftTabId, list]) => [
        draftTabId,
        (list || []).map((field) =>
          field.key === fieldId ? { ...field, enabled: false } : field,
        ),
      ]),
    ) as Record<string, TField[]>;

    const draftColumnRegistry = options
      .syncColumnRegistryWithFields(
        options.getColumnRegistry(context) || options.defaultColumnRegistry,
        fieldsForColumnSync,
        context.fieldsDraft.enabledTabs,
      )
      .map((col) => (col.key === fieldId ? { ...col, enabled: false } : col));

    const issues = options.getRemovalIssues(fieldId, draftColumnRegistry, context);
    if (issues.length === 0) return null;
    const issue = issues[0];
    return {
      messageKey: issue.messageKey,
      count: issue.count,
    };
  }

  function notifyBlock(
    onBlocked: ModuleSetupDeleteNotify,
    block: RemovalBlock,
  ): void {
    onBlocked(
      block.messageKey,
      block.count !== undefined ? { count: block.count } : undefined,
    );
  }

  async function preflightFieldDelete(
    fieldId: string,
    context: TContext,
  ): Promise<boolean> {
    const syncBlock = syncRemovalBlock(fieldId, context);
    if (syncBlock) {
      notifyBlock(context.onBlocked, syncBlock);
      return false;
    }

    try {
      const { count } = await apiJson<{ count: number }>(
        `${options.restBasePath}/field-usage/${encodeURIComponent(fieldId)}`,
      );
      if (count > 0) {
        notifyBlock(context.onBlocked, {
          messageKey: options.usageMessageKey,
          count,
        });
        return false;
      }
    } catch {
      notifyBlock(context.onBlocked, { messageKey: options.saveFailedKey });
      return false;
    }

    return true;
  }

  async function preflightFieldsDelete(
    fieldIds: string[],
    context: TContext,
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
        `${options.restBasePath}/field-usage`,
        {
          method: "POST",
          body: JSON.stringify({ fieldKeys: fieldIds }),
        },
      );

      for (const fieldId of fieldIds) {
        const count = counts[fieldId] ?? 0;
        if (count > 0) {
          notifyBlock(context.onBlocked, {
            messageKey: options.usageMessageKey,
            count,
          });
          return false;
        }
      }
    } catch {
      notifyBlock(context.onBlocked, { messageKey: options.saveFailedKey });
      return false;
    }

    return true;
  }

  return { preflightFieldDelete, preflightFieldsDelete };
}
