import {
  buildRelationshipPairAddition,
  pruneRelationshipPairsForRemovedLabel,
  resolveRelationshipPairs,
} from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";

/** Persist relationship option labels + reciprocal pairs from the Relationship form tab. */
export function useRelationshipTypeOptions(
  relationshipOptions: string[],
  onUpdateRelationships: (relationships: string[]) => void | Promise<void>,
) {
  const { t } = useTranslation();
  const { prefs, updatePrefsAsync } = useContactConfig();

  const addPair = async (forward: string, inverse: string): Promise<string | null> => {
    const result = buildRelationshipPairAddition(
      resolveRelationshipPairs(prefs.relationshipPairs),
      relationshipOptions,
      forward,
      inverse,
    );
    if (!result.ok) {
      if (result.reason === "duplicate") {
        notify.warning(t("contacts.form.duplicateRelationshipPair"));
      }
      return null;
    }
    try {
      await updatePrefsAsync({ relationshipPairs: result.pairs });
      await Promise.resolve(onUpdateRelationships(result.labels));
      return result.selected;
    } catch {
      notify.error(t("contacts.saveFailed"));
      return null;
    }
  };

  const updateOptions = async (nextOptions: string[]): Promise<void> => {
    const removed = relationshipOptions.filter(
      (option) =>
        !nextOptions.some((next) => next.trim().toLowerCase() === option.trim().toLowerCase()),
    );
    try {
      if (removed.length > 0) {
        let pairs = resolveRelationshipPairs(prefs.relationshipPairs);
        for (const label of removed) {
          pairs = pruneRelationshipPairsForRemovedLabel(pairs, label);
        }
        await updatePrefsAsync({ relationshipPairs: pairs });
      }
      await Promise.resolve(onUpdateRelationships(nextOptions));
    } catch {
      notify.error(t("contacts.saveFailed"));
    }
  };

  return { addPair, updateOptions };
}
