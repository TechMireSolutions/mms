import { useCallback } from "react";
import { getDisplayName, type Contact } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import type { useContactsCrudActions } from "@/tenant/features/contacts/hooks/useContactsCrudActions";

type CrudActions = ReturnType<typeof useContactsCrudActions>;

export function useContactsPageDeleteActions({
  canDelete,
  selected,
  setSelected,
  deleteTarget,
  setDeleteTarget,
  setBulkDeleteOpen,
  setBulkRestoreOpen,
  findContactById,
  crud,
}: {
  canDelete: boolean;
  selected: Array<string | number>;
  setSelected: (ids: Array<string | number>) => void;
  deleteTarget: { id: string | number; name?: string } | null;
  setDeleteTarget: (target: { id: string | number; name?: string } | null) => void;
  setBulkDeleteOpen: (open: boolean) => void;
  setBulkRestoreOpen: (open: boolean) => void;
  findContactById: (id: string | number) => Contact | undefined;
  crud: Pick<
    CrudActions,
    | "handleError"
    | "notifyBulkResult"
    | "removeContact"
    | "bulkDeleteContactsAction"
    | "restoreContactAction"
    | "bulkRestoreContactsAction"
  >;
}) {
  const { t } = useTranslation();
  const {
    handleError,
    notifyBulkResult,
    removeContact,
    bulkDeleteContactsAction,
    restoreContactAction,
    bulkRestoreContactsAction,
  } = crud;

  const handleDelete = ((id: string | number) => {
      if (!canDelete) return;
      const selectedContact = findContactById(id);
      setDeleteTarget({ id, name: selectedContact ? getDisplayName(selectedContact) : undefined });
    });

  const confirmSingleDelete = ((deletionReason?: string) => {
      if (!deleteTarget || !canDelete) return;
      setDeleteTarget(null);
      void removeContact(deleteTarget.id, deleteTarget.name, deletionReason);
    });

  const checkBulkAllowed = useCallback(
    () => canDelete && selected.length > 0,
    [canDelete, selected.length],
  );

  const requestBulkDelete = (() => {
    if (checkBulkAllowed()) setBulkDeleteOpen(true);
  });

  const confirmBulkDelete = ((deletionReason?: string) => {
      if (!checkBulkAllowed()) return;
      setBulkDeleteOpen(false);
      void bulkDeleteContactsAction(selected, deletionReason).then(() => setSelected([]));
    });

  const requestBulkRestore = (() => {
    if (checkBulkAllowed()) setBulkRestoreOpen(true);
  });

  const confirmBulkRestore = (() => {
    if (!checkBulkAllowed()) return;
    setBulkRestoreOpen(false);
    void bulkRestoreContactsAction(selected)
      .then((result) => {
        const conflictDetail = result.conflicts?.[0]?.errors?.[0]?.message;
        notifyBulkResult(
          result.succeeded,
          result.failed,
          "contacts.restoreSuccessTitle",
          "contacts.bulkRestoreSuccess",
          conflictDetail,
        );
        setSelected([]);
      })
      .catch((err) => {
        handleError(err, "contacts.bulk_restore", "contacts.restoreFailed");
      });
  });

  const handleRestore = (async (id: string | number) => {
      if (!canDelete) return;
      const selectedContact = findContactById(id);
      const name = selectedContact ? getDisplayName(selectedContact) : undefined;
      try {
        await restoreContactAction(String(id));
        notify.success(t("contacts.restoreSuccessTitle"), {
          description: name
            ? t("contacts.restoreSuccessDescription", { name })
            : t("contacts.restoreSuccessDescriptionDefault"),
        });
      } catch (err) {
        handleError(err, "contacts.restore_single", "contacts.restoreFailed");
        throw err;
      }
    });

  return {
    handleDelete,
    confirmSingleDelete,
    requestBulkDelete,
    confirmBulkDelete,
    requestBulkRestore,
    confirmBulkRestore,
    handleRestore,
  };
}
