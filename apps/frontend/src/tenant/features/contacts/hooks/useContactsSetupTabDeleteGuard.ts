import { useCallback } from "react";
import {
  type FieldConfig,
  type ContactPreferences,
  isContactSeedFormTab,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import {
  preflightContactFieldsDelete,
  type FieldsDraftSnapshot,
} from "@/tenant/features/contacts/hooks/contactsSetupDeletePreflight";

/**
 * Guards custom-tab deletion: seed tabs are blocked; fields are preflighted
 * in parallel (usage GETs abort after the first blocker).
 */
export function useContactsSetupTabDeleteGuard({
  config,
  contextPrefs,
  fieldsDraft,
  onDeleteTab,
}: {
  config: FieldConfig;
  contextPrefs: Pick<ContactPreferences, "duplicateDetectionFields">;
  fieldsDraft: FieldsDraftSnapshot & {
    tabFields: Record<string, Array<{ key: string }>>;
  };
  onDeleteTab: (tabId: string) => void;
}) {
  const { t } = useTranslation();

  return useCallback(
    async (tabId: string): Promise<boolean> => {
      if (isContactSeedFormTab(tabId)) {
        notify.error(t("contacts.setup.cannotDeleteSystemTab"));
        return false;
      }

      const fieldIds = (fieldsDraft.tabFields[tabId] || []).map((field) => field.key);
      const allowed = await preflightContactFieldsDelete(fieldIds, {
        config,
        contextPrefs,
        fieldsDraft,
        onBlocked: (messageKey, params) => {
          notify.error(t(messageKey as Parameters<typeof t>[0], params));
        },
      });
      if (!allowed) return false;

      onDeleteTab(tabId);
      return true;
    },
    [config, contextPrefs, fieldsDraft, onDeleteTab, t],
  );
}
