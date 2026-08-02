import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  curatedContactCountryCodes,
  needsContactCountryCodesCurate,
  type FieldConfig,
} from "@mms/shared";
import { getCollection, saveCollectionAsync } from "@/lib/db";

import { saveFieldConfigAsync } from "@/lib/contactFieldsStore";
import { syncOptionsInConfig } from "@/lib/contacts/preferencesStorage";
import {
  CONTACT_CONFIG_COLLECTION_KEYS,
  getContactConfigCollectionDefaults,
} from "@/lib/contacts/contactConfigSeeds";
import { usePersistedStringCollectionUpdater } from "@/lib/contacts/usePersistedStringCollectionUpdater";
import { useContactConfigCollectionStorageSync } from "@/lib/contacts/useContactConfigCollectionStorageSync";

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
  const [countryCodes, setCountryCodesState] = useState<CountryCodeEntry[]>(() => {
    const loaded = getCollection(
      CONTACT_CONFIG_COLLECTION_KEYS.countryCodes,
      contactConfigDefaults.countryCodes,
    );
    return needsContactCountryCodesCurate(loaded)
      ? curatedContactCountryCodes()
      : loaded;
  });

  // Persist curated dial codes when localStorage still holds the expanded seed.
  useEffect(() => {
    const loaded = getCollection(
      CONTACT_CONFIG_COLLECTION_KEYS.countryCodes,
      contactConfigDefaults.countryCodes,
    );
    if (!needsContactCountryCodesCurate(loaded)) return;
    void saveCollectionAsync(
      CONTACT_CONFIG_COLLECTION_KEYS.countryCodes,
      curatedContactCountryCodes(),
    );
  }, [contactConfigDefaults.countryCodes]);

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

  useContactConfigCollectionStorageSync({
    setGendersState,
    setSocialPlatformsState,
    setRelationshipsState,
    setPhoneLabelsState,
    setEmailLabelsState,
    setAddressLabelsState,
    setCountryCodesState,
  });

  const syncFieldOptions = useCallback(
    async (tabId: string, fieldId: string, options: string[]) => {
      let updatedConfig: FieldConfig | null = null;
      setFieldConfigState((currentConfig) => {
        updatedConfig = syncOptionsInConfig(currentConfig, tabId, fieldId, options);
        return updatedConfig;
      });
      if (updatedConfig) {
        await saveFieldConfigAsync(updatedConfig);
      }
    },
    [setFieldConfigState],
  );

  const updateGenders = usePersistedStringCollectionUpdater(
    CONTACT_CONFIG_COLLECTION_KEYS.genders,
    setGendersState,
    syncFieldOptions,
    "basic",
    "gender",
  );
  const updateSocialPlatforms = usePersistedStringCollectionUpdater(
    CONTACT_CONFIG_COLLECTION_KEYS.socialPlatforms,
    setSocialPlatformsState,
    syncFieldOptions,
    "socials",
    "platform",
  );
  const updateRelationships = usePersistedStringCollectionUpdater(
    CONTACT_CONFIG_COLLECTION_KEYS.relationships,
    setRelationshipsState,
    syncFieldOptions,
    "relationship",
    "relationship",
  );
  const updatePhoneLabels = usePersistedStringCollectionUpdater(
    CONTACT_CONFIG_COLLECTION_KEYS.phoneLabels,
    setPhoneLabelsState,
    syncFieldOptions,
    "phones",
    "label",
  );
  const updateEmailLabels = usePersistedStringCollectionUpdater(
    CONTACT_CONFIG_COLLECTION_KEYS.emailLabels,
    setEmailLabelsState,
    syncFieldOptions,
    "emails",
    "label",
  );
  const updateAddressLabels = usePersistedStringCollectionUpdater(
    CONTACT_CONFIG_COLLECTION_KEYS.addressLabels,
    setAddressLabelsState,
    syncFieldOptions,
    "addresses",
    "label",
  );
  const updateCountryCodes = useCallback(async (countryCodeOptions: CountryCodeEntry[]) => {
    setCountryCodesState(countryCodeOptions);
    await saveCollectionAsync(CONTACT_CONFIG_COLLECTION_KEYS.countryCodes, countryCodeOptions);
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
