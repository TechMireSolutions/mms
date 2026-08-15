import { useCallback, useEffect, useMemo, useState } from "react";
import {
  applyTitleCaseToContact,
  mergeContacts,
  type AppTranslationKey,
  type Contact,
} from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactsDuplicatePairs } from "@/tenant/features/contacts/hooks/useContacts";
import { DUPLICATE_REASON_I18N } from "@/lib/contacts/contactI18n";
import { notify } from "@/lib/notify";
import { reportClientError } from "@/lib/clientErrorReporting";
import type { DuplicatePair } from "@/tenant/features/contacts/components/DuplicateDetectionParts";

function mapPairToViewModel(
  pair: {
    id: string;
    confidence: number;
    reasonKey: keyof typeof DUPLICATE_REASON_I18N;
    contacts: [Contact, Contact];
  },
  t: (key: AppTranslationKey, params?: Record<string, string | number>) => string,
): DuplicatePair {
  const i18nKey = DUPLICATE_REASON_I18N[pair.reasonKey];
  return {
    id: pair.id,
    confidence: pair.confidence,
    reason: i18nKey ? t(i18nKey) : pair.reasonKey,
    contacts: pair.contacts,
  };
}

export function useDuplicateDetectionState({
  onMerge,
}: {
  contacts?: Contact[];
  onMerge: (keepId: string | number, deleteId: string | number, mergedData: Contact) => Promise<void>;
}) {
  const { prefs } = useContactConfig();
  const { t } = useTranslation();
  const [dupPage, setDupPage] = useState(1);
  const {
    data: serverPairs,
    isLoading: pairsLoading,
    isFetching: pairsFetching,
    isError: pairsError,
    isSuccess: pairsSuccess,
    refetch: refetchPairs,
  } = useContactsDuplicatePairs({
    page: dupPage,
    limit: 50,
  });
  const [dismissedPairIds, setDismissedPairIds] = useState<Set<string>>(new Set());
  const [mergedPairIds, setMergedPairIds] = useState<Set<string>>(new Set());
  const [keepIndex, setKeepIndex] = useState<Record<string, number>>({});
  const [merging, setMerging] = useState<DuplicatePair | null>(null);
  const [loadedPairs, setLoadedPairs] = useState<DuplicatePair[]>([]);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!serverPairs?.pairs) return;
    const mappedPairs = serverPairs.pairs.map((pair) => mapPairToViewModel(pair, t));
    setLoadedPairs((prev) => {
      if (dupPage <= 1) return mappedPairs;
      const byId = new Map(prev.map((previousPair) => [previousPair.id, previousPair]));
      for (const mappedPair of mappedPairs) byId.set(mappedPair.id, mappedPair);
      return [...byId.values()];
    });
  }, [serverPairs, dupPage, t]);

  const detectedPairs = useMemo<DuplicatePair[]>(() => {
    if (pairsError) return [];
    if (pairsSuccess || loadedPairs.length > 0) return loadedPairs;
    return [];
  }, [loadedPairs, pairsError, pairsSuccess]);

  const handleLoadMoreDuplicates = useCallback(() => {
    if (serverPairs?.hasMore) setDupPage((currentPage) => currentPage + 1);
  }, [serverPairs?.hasMore]);

  const activePairs = useMemo<DuplicatePair[]>(
    () => detectedPairs.filter((pair) => !dismissedPairIds.has(pair.id) && !mergedPairIds.has(pair.id)),
    [detectedPairs, dismissedPairIds, mergedPairIds],
  );

  const totalPairs = serverPairs?.total ?? detectedPairs.length;

  const handleMergeConfirm = async (): Promise<void> => {
    if (!merging || confirming) return;
    const pair = merging;
    const selectedKeepIndex = keepIndex[pair.id] ?? 0;
    const keep = pair.contacts[selectedKeepIndex];
    const other = pair.contacts[1 - selectedKeepIndex];

    const mergedRaw = mergeContacts(keep, other);
    const mergedResult = applyTitleCaseToContact(mergedRaw);
    setConfirming(true);
    try {
      await onMerge(keep.id, other.id, mergedResult);
      setMergedPairIds((prev) => new Set(prev).add(pair.id));
      setMerging(null);
    } catch (err) {
      notify.error(t("contacts.saveFailed"));
      reportClientError(err, { scope: "contacts.duplicate_merge_confirm" });
    } finally {
      setConfirming(false);
    }
  };

  const handleDismiss = (pairId: string): void => {
    setDismissedPairIds((prev) => new Set(prev).add(pairId));
  };

  const setKeepIndexForPair = (pairId: string, contactIndex: number): void => {
    setKeepIndex((previousSelection) => ({ ...previousSelection, [pairId]: contactIndex }));
  };

  return {
    prefs,
    pairsLoading,
    pairsFetching,
    pairsError,
    refetchPairs,
    hasMore: Boolean(serverPairs?.hasMore),
    activePairs,
    totalPairs,
    keepIndex,
    merging,
    confirming,
    totalMerged: mergedPairIds.size,
    setMerging,
    handleLoadMoreDuplicates,
    handleMergeConfirm,
    handleDismiss,
    setKeepIndexForPair,
  };
}
