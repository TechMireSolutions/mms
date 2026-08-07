import { useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import type { ModuleSetupDeleteNotify } from "@/lib/setup/moduleFieldDeletePreflight";

type WithOnBlocked<T> = T & { onBlocked: ModuleSetupDeleteNotify };

/**
 * Hook factory helper: preflight one field, then call onDeleteField.
 * Module guards pass a bound preflight + sync context (without onBlocked).
 */
export function useModuleSetupFieldDeleteGuard<TSyncContext extends object>(options: {
  preflightFieldDelete: (
    fieldId: string,
    context: WithOnBlocked<TSyncContext>,
  ) => Promise<boolean>;
  context: TSyncContext;
  onDeleteField: (tabId: string, fieldId: string) => void;
}) {
  const { t } = useTranslation();
  const { preflightFieldDelete, context, onDeleteField } = options;

  return useCallback(
    async (tabId: string, fieldId: string): Promise<boolean> => {
      const allowed = await preflightFieldDelete(fieldId, {
        ...context,
        onBlocked: (messageKey, params) => {
          notify.error(t(messageKey as Parameters<typeof t>[0], params));
        },
      });
      if (!allowed) return false;
      onDeleteField(tabId, fieldId);
      return true;
    },
    [context, onDeleteField, preflightFieldDelete, t],
  );
}

/**
 * Hook factory helper: block seed tabs, batch-preflight fields, then onDeleteTab.
 */
export function useModuleSetupTabDeleteGuard<TSyncContext extends object>(options: {
  isSeedTab: (tabId: string) => boolean;
  cannotDeleteSystemTabKey: string;
  preflightFieldsDelete: (
    fieldIds: string[],
    context: WithOnBlocked<TSyncContext>,
  ) => Promise<boolean>;
  context: TSyncContext;
  tabFields: Record<string, Array<{ key: string }>>;
  onDeleteTab: (tabId: string) => void;
}) {
  const { t } = useTranslation();
  const {
    isSeedTab,
    cannotDeleteSystemTabKey,
    preflightFieldsDelete,
    context,
    tabFields,
    onDeleteTab,
  } = options;

  return useCallback(
    async (tabId: string): Promise<boolean> => {
      if (isSeedTab(tabId)) {
        notify.error(t(cannotDeleteSystemTabKey as Parameters<typeof t>[0]));
        return false;
      }

      const fieldIds = (tabFields[tabId] || []).map((field) => field.key);
      const allowed = await preflightFieldsDelete(fieldIds, {
        ...context,
        onBlocked: (messageKey, params) => {
          notify.error(t(messageKey as Parameters<typeof t>[0], params));
        },
      });
      if (!allowed) return false;

      onDeleteTab(tabId);
      return true;
    },
    [
      cannotDeleteSystemTabKey,
      context,
      isSeedTab,
      onDeleteTab,
      preflightFieldsDelete,
      t,
      tabFields,
    ],
  );
}
