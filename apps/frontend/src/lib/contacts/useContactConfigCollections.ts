import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { FieldConfig } from "@mms/shared";
import { getCollection, getWorkspaceLocalStoragePrefix, saveCollection } from "@/lib/db";
import { saveFieldConfig } from "@/lib/contactFieldsStore";
import { syncOptionsInConfig } from "@/lib/contacts/preferencesStorage";
import {
  CONTACT_CONFIG_COLLECTION_KEYS,
  getContactConfigCollectionDefaults,
} from "@/lib/contacts/contactConfigSeeds";

type CountryCodeEntry = { country: string; code: string };
type ContactConfigDefaults = ReturnType<typeof getContactConfigCollectionDefaults>;

export function useContactConfigCollections({
  contactConfigDefaults,
  setFieldConfigState,
}: {
  contactConfigDefaults: ContactConfigDefaults;
  setFieldConfigState: Dispatch<SetStateAction<FieldConfig>>;
}) {
  const [genders, setGendersState] = useState<string[]>(() =>
    getCollection(CONTACT_CONFIG_COLLECTION_KEYS.genders, contactConfigDefaults.genders),
  );
  const [socialPlatforms, setSocialPlatformsState] = useState<string[]>(() =>
    getCollection(CONTACT_CONFIG_COLLECTION_KEYS.socialPlatforms, contactConfigDefaults.socialPlatforms),
  );
  const [relationships, setRelationshipsState] = useState<string[]>(() =>
    getCollection(CONTACT_CONFIG_COLLECTION_KEYS.relationships, contactConfigDefaults.relationships),
  );
  const [phoneLabels, setPhoneLabelsState] = useState<string[]>(() =>
    getCollection(CONTACT_CONFIG_COLLECTION_KEYS.phoneLabels, contactConfigDefaults.phoneLabels),
  );
  const [emailLabels, setEmailLabelsState] = useState<string[]>(() =>
    getCollection(CONTACT_CONFIG_COLLECTION_KEYS.emailLabels, contactConfigDefaults.emailLabels),
  );
  const [addressLabels, setAddressLabelsState] = useState<string[]>(() =>
    getCollection(CONTACT_CONFIG_COLLECTION_KEYS.addressLabels, contactConfigDefaults.addressLabels),
  );
  const [countryCodes, setCountryCodesState] = useState<CountryCodeEntry[]>(() =>
    getCollection(CONTACT_CONFIG_COLLECTION_KEYS.countryCodes, contactConfigDefaults.countryCodes),
  );

  const reloadCollections = useCallback(() => {
    setGendersState(getCollection(CONTACT_CONFIG_COLLECTION_KEYS.genders, contactConfigDefaults.genders));
    setSocialPlatformsState(
      getCollection(CONTACT_CONFIG_COLLECTION_KEYS.socialPlatforms, contactConfigDefaults.socialPlatforms),
    );
    setRelationshipsState(
      getCollection(CONTACT_CONFIG_COLLECTION_KEYS.relationships, contactConfigDefaults.relationships),
    );
    setPhoneLabelsState(getCollection(CONTACT_CONFIG_COLLECTION_KEYS.phoneLabels, contactConfigDefaults.phoneLabels));
    setEmailLabelsState(getCollection(CONTACT_CONFIG_COLLECTION_KEYS.emailLabels, contactConfigDefaults.emailLabels));
    setAddressLabelsState(
      getCollection(CONTACT_CONFIG_COLLECTION_KEYS.addressLabels, contactConfigDefaults.addressLabels),
    );
    setCountryCodesState(
      getCollection(CONTACT_CONFIG_COLLECTION_KEYS.countryCodes, contactConfigDefaults.countryCodes),
    );
  }, [contactConfigDefaults]);

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
  }, []);

  const syncFieldOptions = useCallback(
    (tabId: string, fieldId: string, options: string[]) => {
      setFieldConfigState((currentConfig) => {
        const updatedConfig = syncOptionsInConfig(currentConfig, tabId, fieldId, options);
        saveFieldConfig(updatedConfig);
        return updatedConfig;
      });
    },
    [setFieldConfigState],
  );

  const updateGenders = useCallback(
    (genderOptions: string[]) => {
      saveCollection(CONTACT_CONFIG_COLLECTION_KEYS.genders, genderOptions);
      setGendersState(genderOptions);
      syncFieldOptions("basic", "gender", genderOptions);
    },
    [syncFieldOptions],
  );
  const updateSocialPlatforms = useCallback(
    (socialPlatformOptions: string[]) => {
      saveCollection(CONTACT_CONFIG_COLLECTION_KEYS.socialPlatforms, socialPlatformOptions);
      setSocialPlatformsState(socialPlatformOptions);
      syncFieldOptions("socials", "platform", socialPlatformOptions);
    },
    [syncFieldOptions],
  );
  const updateRelationships = useCallback(
    (relationshipOptions: string[]) => {
      saveCollection(CONTACT_CONFIG_COLLECTION_KEYS.relationships, relationshipOptions);
      setRelationshipsState(relationshipOptions);
      syncFieldOptions("emergency", "relationship", relationshipOptions);
    },
    [syncFieldOptions],
  );
  const updatePhoneLabels = useCallback(
    (phoneLabelOptions: string[]) => {
      saveCollection(CONTACT_CONFIG_COLLECTION_KEYS.phoneLabels, phoneLabelOptions);
      setPhoneLabelsState(phoneLabelOptions);
      syncFieldOptions("phones", "label", phoneLabelOptions);
    },
    [syncFieldOptions],
  );
  const updateEmailLabels = useCallback(
    (emailLabelOptions: string[]) => {
      saveCollection(CONTACT_CONFIG_COLLECTION_KEYS.emailLabels, emailLabelOptions);
      setEmailLabelsState(emailLabelOptions);
      syncFieldOptions("emails", "label", emailLabelOptions);
    },
    [syncFieldOptions],
  );
  const updateAddressLabels = useCallback(
    (addressLabelOptions: string[]) => {
      saveCollection(CONTACT_CONFIG_COLLECTION_KEYS.addressLabels, addressLabelOptions);
      setAddressLabelsState(addressLabelOptions);
      syncFieldOptions("addresses", "label", addressLabelOptions);
    },
    [syncFieldOptions],
  );
  const updateCountryCodes = useCallback((countryCodeOptions: CountryCodeEntry[]) => {
    saveCollection(CONTACT_CONFIG_COLLECTION_KEYS.countryCodes, countryCodeOptions);
    setCountryCodesState(countryCodeOptions);
  }, []);

  const countryCodesMap = useMemo(() => {
    const countryCodeByCountry: Record<string, string> = {};
    countryCodes.forEach(({ country, code }) => {
      countryCodeByCountry[country] = code;
    });
    return countryCodeByCountry;
  }, [countryCodes]);

  return {
    genders,
    socialPlatforms,
    relationships,
    phoneLabels,
    emailLabels,
    addressLabels,
    countryCodes,
    countryCodesMap,
    reloadCollections,
    updateGenders,
    updateSocialPlatforms,
    updateRelationships,
    updatePhoneLabels,
    updateEmailLabels,
    updateAddressLabels,
    updateCountryCodes,
  };
}
