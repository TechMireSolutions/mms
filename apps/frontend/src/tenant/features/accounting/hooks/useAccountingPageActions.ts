import { useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import type { Account, FiscalYear, JournalEntry } from "@mms/shared";
import { useAccountingMutations } from "@/tenant/features/accounting/hooks/useAccountingApi";
import { NotifiedMutationError } from "@/lib/notifiedMutationError";

interface UseAccountingPageActionsParams {
  accounts: Account[];
  journalEntries: JournalEntry[];
  fiscalYears: FiscalYear[];
}

export function useAccountingPageActions({
  accounts,
  journalEntries,
  fiscalYears,
}: UseAccountingPageActionsParams) {
  const { t } = useTranslation();
  const {
    replaceAccounts,
    replaceEntries,
    replaceFiscalYears,
    deleteEntry,
    restoreEntry,
    bulkDeleteEntries,
    bulkRestoreEntries,
  } = useAccountingMutations();

  const notifySaveFailure = useCallback((error: unknown) => {
    if (error instanceof NotifiedMutationError) return;
    notify.error(t("accounting.settings.saveEntriesFailed"), {
      description: error instanceof Error ? error.message : String(error),
    });
  }, [t]);

  const setAccounts = useCallback(async (updater: Account[] | ((prev: Account[]) => Account[])) => {
    const nextAccounts = typeof updater === "function" ? updater(accounts) : updater;
    try {
      await replaceAccounts.mutateAsync(nextAccounts);
    } catch (error: unknown) {
      notifySaveFailure(error);
      throw error;
    }
  }, [accounts, replaceAccounts, notifySaveFailure]);

  const setEntries = useCallback(async (updater: JournalEntry[] | ((prev: JournalEntry[]) => JournalEntry[])) => {
    const nextJournalEntries = typeof updater === "function" ? updater(journalEntries) : updater;
    try {
      await replaceEntries.mutateAsync(nextJournalEntries);
    } catch (error: unknown) {
      notifySaveFailure(error);
      throw error;
    }
  }, [journalEntries, replaceEntries, notifySaveFailure]);

  const setFiscalYears = useCallback(async (updater: FiscalYear[] | ((prev: FiscalYear[]) => FiscalYear[])) => {
    const nextFiscalYears = typeof updater === "function" ? updater(fiscalYears) : updater;
    try {
      await replaceFiscalYears.mutateAsync(nextFiscalYears);
    } catch (error: unknown) {
      notifySaveFailure(error);
      throw error;
    }
  }, [fiscalYears, replaceFiscalYears, notifySaveFailure]);

  const handleDeleteEntry = useCallback(async (id: string) => {
    try {
      await deleteEntry.mutateAsync(id);
      notify.success(t("accounting.trash.deleted"));
    } catch (error: unknown) {
      notify.error(t("accounting.trash.actionFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }, [deleteEntry, t]);

  const handleRestoreEntry = useCallback(async (id: string) => {
    try {
      await restoreEntry.mutateAsync(id);
      notify.success(t("accounting.trash.restored"));
    } catch (error: unknown) {
      notify.error(t("accounting.trash.actionFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }, [restoreEntry, t]);

  const handleBulkDeleteEntries = useCallback(async (ids: string[]) => {
    try {
      const result = await bulkDeleteEntries.mutateAsync(ids);
      if (result.failed > 0) {
        notify.warning(t("accounting.trash.bulkPartial", {
          succeeded: result.succeeded,
          failed: result.failed,
        }));
      } else {
        notify.success(
          result.succeeded > 1
            ? t("accounting.trash.bulkDeleted", { count: result.succeeded })
            : t("accounting.trash.deleted"),
        );
      }
    } catch (error: unknown) {
      notify.error(t("accounting.trash.actionFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }, [bulkDeleteEntries, t]);

  const handleBulkRestoreEntries = useCallback(async (ids: string[]) => {
    try {
      const result = await bulkRestoreEntries.mutateAsync(ids);
      if (result.failed > 0) {
        notify.warning(t("accounting.trash.bulkPartial", {
          succeeded: result.succeeded,
          failed: result.failed,
        }));
      } else {
        notify.success(
          result.succeeded > 1
            ? t("accounting.trash.bulkRestored", { count: result.succeeded })
            : t("accounting.trash.restored"),
        );
      }
    } catch (error: unknown) {
      notify.error(t("accounting.trash.actionFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }, [bulkRestoreEntries, t]);

  return {
    setAccounts,
    setEntries,
    setFiscalYears,
    handleDeleteEntry,
    handleRestoreEntry,
    handleBulkDeleteEntries,
    handleBulkRestoreEntries,
  };
}
