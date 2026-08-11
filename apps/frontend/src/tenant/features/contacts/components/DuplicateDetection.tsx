import { AnimatePresence } from "framer-motion";
import type { Contact } from "@mms/shared";
import { MergePreview } from "@/tenant/features/contacts/components/DuplicateDetectionParts";
import { DuplicateDetectionModal } from "@/tenant/features/contacts/components/DuplicateDetectionModal";
import { useDuplicateDetectionState } from "@/tenant/features/contacts/hooks/useDuplicateDetectionState";

interface DuplicateDetectionProps {
  contacts?: Contact[];
  onClose: () => void;
  onMerge: (keepId: string | number, deleteId: string | number, mergedData: Contact) => Promise<void>;
  canWrite?: boolean;
}

/**
 * DuplicateDetection component that finds duplicate contacts dynamically
 * and allows the user to merge them.
 */
export default function DuplicateDetection({
  contacts = [],
  onClose,
  onMerge,
  canWrite = false,
}: DuplicateDetectionProps): JSX.Element {
  const {
    prefs,
    pairsLoading,
    pairsFetching,
    pairsError,
    refetchPairs,
    hasMore,
    activePairs,
    totalPairs,
    keepIndex,
    merging,
    confirming,
    totalMerged,
    setMerging,
    handleLoadMoreDuplicates,
    handleMergeConfirm,
    handleDismiss,
    setKeepIndexForPair,
  } = useDuplicateDetectionState({ contacts, onMerge });

  return (
    <>
      <DuplicateDetectionModal
        prefs={prefs}
        pairsLoading={pairsLoading}
        pairsFetching={pairsFetching}
        pairsError={pairsError}
        hasMore={hasMore}
        activePairs={activePairs}
        totalPairs={totalPairs}
        keepIndex={keepIndex}
        totalMerged={totalMerged}
        canWrite={canWrite}
        onClose={onClose}
        onMergePair={setMerging}
        onDismiss={handleDismiss}
        onSelectKeep={setKeepIndexForPair}
        onLoadMore={handleLoadMoreDuplicates}
        onRetry={() => {
          void refetchPairs();
        }}
      />

      <AnimatePresence>
        {merging && (
          <MergePreview
            pair={merging}
            keepIndex={keepIndex[merging.id] ?? 0}
            onClose={() => setMerging(null)}
            onConfirm={handleMergeConfirm}
            confirming={confirming}
          />
        )}
      </AnimatePresence>
    </>
  );
}
