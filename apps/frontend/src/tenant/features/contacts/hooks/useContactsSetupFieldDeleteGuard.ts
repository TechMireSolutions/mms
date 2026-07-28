import { useCallback } from "react";
import {
  type FieldConfig,
  type ContactPreferences,
  DEFAULT_COLUMN_REGISTRY,
  getContactFieldRemovalIssues,
  CONTACTS_MODULE_MANIFEST,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { apiJson } from "@/lib/apiClient";
import { notify } from "@/lib/notify";

/** Guards field deletion against prefs/column deps and live contact data usage. */
export function useContactsSetupFieldDeleteGuard({
  config,
  contextPrefs,
  onDeleteField,
  onDirty,
}: {
  config: FieldConfig;
  contextPrefs: ContactPreferences;
  onDeleteField: (tabId: string, fieldId: string) => void;
  onDirty: () => void;
}) {
  const { t } = useTranslation();

  return useCallback(
    async (tabId: string, fieldId: string) => {
      const issues = getContactFieldRemovalIssues({
        fieldKey: fieldId,
        columnRegistry: config.columnRegistry || DEFAULT_COLUMN_REGISTRY,
        preferences: contextPrefs,
      });
      if (issues.length > 0) {
        const issue = issues[0];
        notify.error(
          t(
            issue.messageKey as Parameters<typeof t>[0],
            issue.count !== undefined ? { count: issue.count } : undefined,
          ),
        );
        return;
      }

      try {
        const { count } = await apiJson<{ count: number }>(
          `${CONTACTS_MODULE_MANIFEST.restBasePath}/field-usage/${encodeURIComponent(fieldId)}`,
        );
        if (count > 0) {
          notify.error(t("contacts.setup.fieldHasContactData", { count }));
          return;
        }
      } catch {
        notify.error(t("contacts.saveFailed"));
        return;
      }

      onDeleteField(tabId, fieldId);
      onDirty();
    },
    [config.columnRegistry, contextPrefs, onDeleteField, onDirty, t],
  );
}
