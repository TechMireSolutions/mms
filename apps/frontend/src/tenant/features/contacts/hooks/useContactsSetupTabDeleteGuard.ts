import {
  type FieldConfig,
  type ContactPreferences,
  isContactSeedFormTab,
} from "@mms/shared";
import { useModuleSetupTabDeleteGuard } from "@/lib/setup/useModuleSetupDeleteGuards";
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
  return useModuleSetupTabDeleteGuard({
    isSeedTab: isContactSeedFormTab,
    cannotDeleteSystemTabKey: "contacts.setup.cannotDeleteSystemTab",
    preflightFieldsDelete: preflightContactFieldsDelete,
    context: { config, contextPrefs, fieldsDraft },
    tabFields: fieldsDraft.tabFields,
    onDeleteTab,
  });
}
