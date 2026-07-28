import { useCallback, type Dispatch, type SetStateAction } from "react";
import { saveCollection } from "@/lib/db";

/** Persist a string[] options collection and sync related field-config options. */
export function usePersistedStringCollectionUpdater(
  collectionKey: string,
  setState: Dispatch<SetStateAction<string[]>>,
  syncFieldOptions: (tabId: string, fieldId: string, options: string[]) => void,
  tabId: string,
  fieldId: string,
) {
  return useCallback(
    (options: string[]) => {
      saveCollection(collectionKey, options);
      setState(options);
      syncFieldOptions(tabId, fieldId, options);
    },
    [collectionKey, setState, syncFieldOptions, tabId, fieldId],
  );
}
