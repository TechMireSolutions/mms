import { useRef, useState } from "react";
import type { AppTranslationKey } from "@mms/shared";
import { hasReversalEntry, type JournalEntry } from "@/lib/data/accountingData";
import { notify } from "@/lib/notify";
import { getApiValidationMessage } from "@/lib/apiValidationMessage";
import { reverseJournalEntry } from "./journalEntriesControllerActions";
import type { JournalEntriesChange } from "./journalEntriesTypes";

export interface UseJournalEntriesTrashReversalOptions {
  entries: JournalEntry[];
  showDeleted: boolean;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  onDelete?: (id: string) => void | Promise<void>;
  onRestore?: (id: string) => void | Promise<void>;
  onBulkDelete?: (ids: string[]) => void | Promise<void>;
  onBulkRestore?: (ids: string[]) => void | Promise<void>;
  onChange?: JournalEntriesChange;
  t: (key: AppTranslationKey, args?: Record<string, string | number>) => string;
}

/**
 * Reason a reversal write was refused, as the bookkeeper must read it.
 *
 * ts-rest React Query hooks reject with the raw `{ status, body, headers }`
 * result rather than an `Error`, so the previous `String(error)` produced
 * "[object Object]" and hid the server's own explanation (closed fiscal year,
 * posted-entry immutability, unknown/archived account). `getApiValidationMessage`
 * unwraps exactly that shape.
 */
function describeReverseFailure(error: unknown): string | undefined {
  const apiMessage = getApiValidationMessage(error);
  if (apiMessage) return apiMessage;
  if (error instanceof Error && error.message.trim()) return error.message;
  return undefined;
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
  const [pendingBulkIds, setPendingBulkIds] = useState<string[]>([]);
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
  const [pendingReverseEntry, setPendingReverseEntry] = useState<JournalEntry | null>(null);
  /** Single-flight guard for the reversal write (see confirmReverse). */
  const reverseInFlightRef = useRef(false);

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

  /**
   * Bulk archive with the same posted-entry pre-check the single-row path
   * already applies.
   *
   * Previously the posted rows were simply sent and rejected by the server's SQL
   * filter, which collapsed into a generic "partial failure" count and lost the
   * per-row explanation. Posted rows are now filtered out of the batch, the
   * user is told *which* rows are immutable, and the confirm dialog only opens
   * when something is actually deletable.
   */
  const requestBulkTrash = () => {
    if (showDeleted) {
      // Restore has no immutability rule and no confirm step of its own.
      void onBulkRestore?.(selectedIds);
      setSelectedIds([]);
      return;
    }
    const postedEntries = selectedIds
      .map((id) => entries.find((journalEntry) => journalEntry.id === id))
      .filter((entry): entry is JournalEntry => entry?.status === "posted");
    const deletableIds = selectedIds.filter((id) => {
      const entry = entries.find((journalEntry) => journalEntry.id === id);
      // An id with no loaded row stays in the batch: the server decides.
      return entry ? entry.status !== "posted" : true;
    });

    if (postedEntries.length > 0) {
      notify.warning(
        t("accounting.journal.alerts.bulkPostedBlocked", {
          refs: postedEntries.map((entry) => entry.ref).join(", "),
        }),
      );
    }
    if (deletableIds.length === 0) {
      setPendingBulkIds([]);
      setConfirmBulkOpen(false);
      return;
    }
    setPendingBulkIds(deletableIds);
    setConfirmBulkOpen(true);
  };

  const confirmBulkTrash = (): void => {
    const ids = pendingBulkIds.length > 0 ? pendingBulkIds : selectedIds;
    if (showDeleted) void onBulkRestore?.(ids);
    else void onBulkDelete?.(ids);
    setSelectedIds([]);
    setPendingBulkIds([]);
    setConfirmBulkOpen(false);
  };

  const requestReverse = (entry: JournalEntry) => {
    /**
     * Reverse is refused for an entry that already has a reversal: repeated
     * clicks used to accumulate competing correction entries that could both be
     * posted later, silently reversing the same figure twice.
     */
    if (hasReversalEntry(entry, entries)) {
      notify.warning(t("accounting.journal.alerts.alreadyReversed", { ref: entry.ref }));
      return;
    }
    setPendingReverseEntry(entry);
  };

  const confirmReverse = async (): Promise<void> => {
    const entry = pendingReverseEntry;
    if (!entry || !onChange) return;
    /**
     * A double confirmation must not create two competing correction entries:
     * the pending entry is state, so two clicks before the re-render would both
     * see the same value. The ref makes the write single-flight.
     */
    if (reverseInFlightRef.current) return;
    reverseInFlightRef.current = true;
    setPendingReverseEntry(null);
    try {
      const reversal = await reverseJournalEntry(entry, entries, (updater) => onChange(updater));
      // The reversal is posted immediately, so name the reference: without it
      // the user cannot tell which row in the list now offsets the entry.
      notify.success(t("accounting.journal.alerts.reversalPosted", { ref: reversal.ref }));
    } catch (error: unknown) {
      const description = describeReverseFailure(error);
      notify.error(
        t("accounting.journal.alerts.reverseFailed", { ref: entry.ref }),
        description ? { description } : undefined,
      );
    } finally {
      reverseInFlightRef.current = false;
    }
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
