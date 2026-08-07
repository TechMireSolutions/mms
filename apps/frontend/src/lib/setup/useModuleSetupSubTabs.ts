import { useState } from "react";

/**
 * Setup SubTabBar state with dirty-gated discard confirm.
 * Module shells supply initial key, dirtiness, and discard side effects.
 */
export function useModuleSetupSubTabs({
  initialKey,
  isDirty,
  onDiscard,
}: {
  initialKey: string;
  /** True when leaving `currentKey` requires a discard confirm. */
  isDirty: (currentKey: string) => boolean;
  /** Called when the user confirms discard before switching tabs. */
  onDiscard: (leavingKey: string) => void;
}) {
  const [sub, setSub] = useState(initialKey);
  const [pendingSubTab, setPendingSubTab] = useState<string | null>(null);

  const discardConfirmOpen = pendingSubTab != null;
  const discardConfirmIsFields = sub === "fields" && isDirty("fields");

  const handleSubTabChange = (next: string): void => {
    if (next === sub) return;
    if (isDirty(sub)) {
      setPendingSubTab(next);
      return;
    }
    setSub(next);
  };

  const handleConfirmDiscard = (): void => {
    if (!pendingSubTab) return;
    onDiscard(sub);
    setSub(pendingSubTab);
    setPendingSubTab(null);
  };

  const clearPendingSubTab = (): void => {
    setPendingSubTab(null);
  };

  return {
    sub,
    showFields: sub === "fields",
    showPrefs: sub === "preferences",
    showLookups: sub === "lookups",
    showSync: sub === "sync",
    discardConfirmOpen,
    discardConfirmIsFields,
    handleSubTabChange,
    handleConfirmDiscard,
    clearPendingSubTab,
  };
}
