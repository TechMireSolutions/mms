import { useState } from "react";

/**
 * Setup SubTabBar state with dirty-gated discard confirm.
 * Module shells supply initial key, dirtiness, and discard side effects.
 */
export function useModuleSetupSubTabs({
  initialKey,
  isDirty,
  onDiscard,
  onSave,
}: {
  initialKey: string;
  /** True when leaving `currentKey` requires a discard confirm. */
  isDirty: (currentKey: string) => boolean;
  /** Called when the user confirms discard before switching tabs. */
  onDiscard: (leavingKey: string) => void;
  /** Optional save handler to auto-save dirty tab before switching. */
  onSave?: (leavingKey: string) => Promise<void | boolean>;
}) {
  const [sub, setSub] = useState(initialKey);
  const [pendingSubTab, setPendingSubTab] = useState<string | null>(null);

  const discardConfirmOpen = pendingSubTab != null;
  const discardConfirmIsFields = sub === "fields" && isDirty("fields");

  const handleSubTabChange = async (next: string): Promise<void> => {
    if (next === sub) return;
    if (isDirty(sub)) {
      if (onSave) {
        try {
          const res = await onSave(sub);
          if (res === false) return;
          setSub(next);
          return;
        } catch {
          // If auto-save threw an error, prompt discard dialog
          setPendingSubTab(next);
          return;
        }
      }
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
