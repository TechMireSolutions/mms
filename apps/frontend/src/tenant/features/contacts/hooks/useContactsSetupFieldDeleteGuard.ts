import { type FieldConfig, type ContactPreferences } from "@mms/shared";
import { useModuleSetupFieldDeleteGuard } from "@/lib/setup/useModuleSetupDeleteGuards";
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
  return useModuleSetupFieldDeleteGuard({
    preflightFieldDelete: preflightContactFieldDelete,
    context: { config, contextPrefs, fieldsDraft },
    onDeleteField,
  });
}
