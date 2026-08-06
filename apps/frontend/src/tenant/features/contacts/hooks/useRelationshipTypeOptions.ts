import {
  applyRelationshipOptionsUpdate,
  buildRelationshipPairAddition,
  resolveRelationshipPairs,
  type ParsedRelationshipPairInput,
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

  const addPair = async (input: ParsedRelationshipPairInput): Promise<string | null> => {
    const result = buildRelationshipPairAddition(
      resolveRelationshipPairs(prefs.relationshipPairs),
      relationshipOptions,
      input,
    );
    if (!result.ok) {
      if (result.reason === "duplicate") {
        const existingLabel = relationshipOptions.find(
          (opt) => opt.trim().toLowerCase() === input.forward.trim().toLowerCase(),
        );
        if (existingLabel) {
          return existingLabel;
        }
        notify.warning(t("contacts.form.duplicateRelationshipPair"));
      }
      return null;
    }
    try {
      await updatePrefsAsync({
        relationshipPairs: result.pairs,
        relationshipOptionOrder: result.labels,
      });
      await Promise.resolve(onUpdateRelationships(result.labels));
      return result.selected;
    } catch {
      notify.error(t("contacts.saveFailed"));
      return null;
    }
  };

  const updateOptions = async (nextOptions: string[]): Promise<void> => {
    try {
      const applied = applyRelationshipOptionsUpdate(
        resolveRelationshipPairs(prefs.relationshipPairs),
        relationshipOptions,
        nextOptions,
      );
      await updatePrefsAsync({
        relationshipPairs: applied.pairs,
        relationshipOptionOrder: applied.optionOrder,
      });
      await Promise.resolve(onUpdateRelationships(applied.labels));
    } catch {
      notify.error(t("contacts.saveFailed"));
    }
  };

  return { addPair, updateOptions };
}
