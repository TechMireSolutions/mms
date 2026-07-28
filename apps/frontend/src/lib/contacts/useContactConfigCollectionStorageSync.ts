import { useEffect, type Dispatch, type SetStateAction } from "react";
import { getWorkspaceLocalStoragePrefix } from "@/lib/db";
import { CONTACT_CONFIG_COLLECTION_KEYS } from "@/lib/contacts/contactConfigSeeds";

type CountryCodeEntry = { country: string; code: string };

/** Syncs contact option collections across browser tabs via storage events. */
export function useContactConfigCollectionStorageSync({
  setGendersState,
  setSocialPlatformsState,
  setRelationshipsState,
  setPhoneLabelsState,
  setEmailLabelsState,
  setAddressLabelsState,
  setCountryCodesState,
}: {
  setGendersState: Dispatch<SetStateAction<string[]>>;
  setSocialPlatformsState: Dispatch<SetStateAction<string[]>>;
  setRelationshipsState: Dispatch<SetStateAction<string[]>>;
  setPhoneLabelsState: Dispatch<SetStateAction<string[]>>;
  setEmailLabelsState: Dispatch<SetStateAction<string[]>>;
  setAddressLabelsState: Dispatch<SetStateAction<string[]>>;
  setCountryCodesState: Dispatch<SetStateAction<CountryCodeEntry[]>>;
}) {
  useEffect(() => {
    const safeParseEvent = (storageEvent: StorageEvent, label: string): unknown | null => {
      if (storageEvent.newValue === null) return null;
      try {
        return JSON.parse(storageEvent.newValue);
      } catch (error) {
        console.warn(`[ContactConfigContext] Failed to parse storage event for "${label}":`, error);
        return null;
      }
    };

    const handler = (storageEvent: StorageEvent) => {
      if (!storageEvent.key?.startsWith(getWorkspaceLocalStoragePrefix())) return;
      const subKey = storageEvent.key.slice(getWorkspaceLocalStoragePrefix().length);
      const parsed = safeParseEvent(storageEvent, subKey);
      if (!parsed) return;

      const collectionSetters: Record<string, (value: unknown) => void> = {
        [CONTACT_CONFIG_COLLECTION_KEYS.genders]: setGendersState as (value: unknown) => void,
        [CONTACT_CONFIG_COLLECTION_KEYS.socialPlatforms]: setSocialPlatformsState as (value: unknown) => void,
        [CONTACT_CONFIG_COLLECTION_KEYS.relationships]: setRelationshipsState as (value: unknown) => void,
        [CONTACT_CONFIG_COLLECTION_KEYS.phoneLabels]: setPhoneLabelsState as (value: unknown) => void,
        [CONTACT_CONFIG_COLLECTION_KEYS.emailLabels]: setEmailLabelsState as (value: unknown) => void,
        [CONTACT_CONFIG_COLLECTION_KEYS.addressLabels]: setAddressLabelsState as (value: unknown) => void,
        [CONTACT_CONFIG_COLLECTION_KEYS.countryCodes]: setCountryCodesState as (value: unknown) => void,
      };
      collectionSetters[subKey]?.(parsed);
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [
    setGendersState,
    setSocialPlatformsState,
    setRelationshipsState,
    setPhoneLabelsState,
    setEmailLabelsState,
    setAddressLabelsState,
    setCountryCodesState,
  ]);
}
