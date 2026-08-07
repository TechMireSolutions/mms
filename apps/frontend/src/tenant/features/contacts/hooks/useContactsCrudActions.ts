import { useContactMutations } from "@/tenant/features/contacts/hooks/useContacts";
import { useContactsCrudNotify } from "@/tenant/features/contacts/hooks/useContactsCrudNotify";
import { useContactsCrudWriteActions } from "@/tenant/features/contacts/hooks/useContactsCrudWriteActions";
import { useContactsCrudDeleteActions } from "@/tenant/features/contacts/hooks/useContactsCrudDeleteActions";

export function useContactsCrudActions() {
  const { t, handleError, notifyBulkResult } = useContactsCrudNotify();
  const { logExportAudit } = useContactMutations();
  const write = useContactsCrudWriteActions({ t, handleError, notifyBulkResult });
  const remove = useContactsCrudDeleteActions({ t, handleError, notifyBulkResult });

  return {
    updateContact: write.updateContact,
    logExportAudit,
    handleError,
    notifyBulkResult,
    saveContact: write.saveContact,
    removeContact: remove.removeContact,
    mergeContacts: write.mergeContacts,
    importContacts: write.importContacts,
    bulkDeleteContactsAction: remove.bulkDeleteContactsAction,
    restoreContactAction: remove.restoreContactAction,
    bulkRestoreContactsAction: remove.bulkRestoreContactsAction,
  };
}
