import { useCallback } from "react";
import { type FieldConfig, type ContactPreferences } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import {
  preflightContactFieldDelete,
  type FieldsDraftSnapshot,
} from "@/tenant/features/contacts/hooks/contactsSetupDeletePreflight";

/** Guards field deletion against prefs/column deps (draft-aware) and live contact data usage. */
export function useContactsSetupFieldDeleteGuard({
  config,
  contextPrefs,
  fieldsDraft,
  onDeleteField,
}: {
  config: FieldConfig;
  contextPrefs: Pick<ContactPreferences, "duplicateDetectionFields">;
  fieldsDraft: FieldsDraftSnapshot;
  onDeleteField: (tabId: string, fieldId: string) => void;
}) {
  const { t } = useTranslation();

  return useCallback(
    async (tabId: string, fieldId: string): Promise<boolean> => {
      const allowed = await preflightContactFieldDelete(fieldId, {
        config,
        contextPrefs,
        fieldsDraft,
        onBlocked: (messageKey, params) => {
          notify.error(t(messageKey as Parameters<typeof t>[0], params));
        },
      });
      if (!allowed) return false;

      onDeleteField(tabId, fieldId);
      return true;
    },
    [config, contextPrefs, fieldsDraft, onDeleteField, t],
  );
}
