import { useCallback, type Dispatch, type SetStateAction } from "react";
import { saveCollectionAsync } from "@/lib/db";

/** Persist a string[] options collection and sync related field-config options. */
export function usePersistedStringCollectionUpdater(
  collectionKey: string,
  setState: Dispatch<SetStateAction<string[]>>,
  syncFieldOptions: (tabId: string, fieldId: string, options: string[]) => Promise<void>,
  tabId: string,
  fieldId: string,
) {
  return useCallback(
    async (options: string[]) => {
      setState(options);
      await saveCollectionAsync(collectionKey, options);
      await syncFieldOptions(tabId, fieldId, options);
    },
    [collectionKey, setState, syncFieldOptions, tabId, fieldId],
  );
}
