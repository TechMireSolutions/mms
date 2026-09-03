import { useState } from "react";
import type { JournalEntry } from "@/lib/data/accountingData";
import { notify } from "@/lib/notify";
import { reverseJournalEntry } from "./journalEntriesControllerActions";
import type { AppTranslationKey } from "@mms/shared";

export interface UseJournalEntriesTrashReversalOptions {
  entries: JournalEntry[];
  showDeleted: boolean;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  onDelete?: (id: string) => void | Promise<void>;
  onRestore?: (id: string) => void | Promise<void>;
  onBulkDelete?: (ids: string[]) => void | Promise<void>;
  onBulkRestore?: (ids: string[]) => void | Promise<void>;
  onChange?: (entries: JournalEntry[] | ((prev: JournalEntry[]) => JournalEntry[])) => void | Promise<void>;
  t: (key: AppTranslationKey) => string;
}

export function useJournalEntriesTrashReversal({
  entries,
  showDeleted,
  selectedIds,
  setSelectedIds,
  onDelete,
  onRestore,
  onBulkDelete,
  onBulkRestore,
  onChange,
  t,
}: UseJournalEntriesTrashReversalOptions) {
  const [pendingTrashId, setPendingTrashId] = useState<string | null>(null);
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
  const [pendingReverseEntry, setPendingReverseEntry] = useState<JournalEntry | null>(null);

  const requestRowTrash = (id: string) => {
    if (showDeleted) {
      void onRestore?.(id);
      return;
    }
    const entry = entries.find((journalEntry) => journalEntry.id === id);
    if (entry?.status === "posted") {
      notify.warning(t("accounting.journal.alerts.cannotDeletePosted"));
      return;
    }
    setPendingTrashId(id);
  };

  const confirmRowTrash = (): void => {
    if (!pendingTrashId) return;
    void onDelete?.(pendingTrashId);
    setPendingTrashId(null);
  };

  const requestBulkTrash = () => {
    if (showDeleted) {
      void onBulkRestore?.(selectedIds);
      setSelectedIds([]);
      return;
    }
    setConfirmBulkOpen(true);
  };

  const confirmBulkTrash = (): void => {
    if (showDeleted) void onBulkRestore?.(selectedIds);
    else void onBulkDelete?.(selectedIds);
    setSelectedIds([]);
    setConfirmBulkOpen(false);
  };

  const requestReverse = (entry: JournalEntry) => {
    setPendingReverseEntry(entry);
  };

  const confirmReverse = (): void => {
    if (!pendingReverseEntry || !onChange) return;
    void reverseJournalEntry(pendingReverseEntry, entries, (updater) => onChange(updater));
    setPendingReverseEntry(null);
  };

  return {
    pendingTrashId,
    setPendingTrashId,
    requestRowTrash,
    confirmRowTrash,
    confirmBulkOpen,
    setConfirmBulkOpen,
    requestBulkTrash,
    confirmBulkTrash,
    pendingReverseEntry,
    setPendingReverseEntry,
    requestReverse,
    confirmReverse,
  };
}
