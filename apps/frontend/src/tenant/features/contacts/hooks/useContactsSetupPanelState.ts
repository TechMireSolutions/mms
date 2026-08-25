import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type ContactPreferences,
  normalizeContactDialCode,
} from "@mms/shared";
import type { CountryCodeEntry } from "@/lib/contacts/countryCodeOptions";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useContactsPreferencesSave } from "@/tenant/features/contacts/hooks/useContactsPreferencesSave";
import { buildCountrySelectOptions } from "@/tenant/features/contacts/hooks/contactsSetupPanelEditor";

export function useContactsSetupPanelState() {
  const {
    updatePrefsAsync,
    prefs: contextPrefs,
    countryCodes,
    updateCountryCodes,
  } = useContactConfig();

  const [saved, setSaved] = useState(false);
  const [prefs, setPrefs] = useState<ContactPreferences>(() => contextPrefs);
  const [countryCodesDraft, setCountryCodesDraft] = useState<CountryCodeEntry[]>(
    () => countryCodes,
  );

  const isPrefsDraftDirty = useMemo(
    () => JSON.stringify(prefs) !== JSON.stringify(contextPrefs),
    [prefs, contextPrefs],
  );

  const isCountryCodesDirty = useMemo(
    () => JSON.stringify(countryCodesDraft) !== JSON.stringify(countryCodes),
    [countryCodesDraft, countryCodes],
  );

  const isPreferencesDirty = isPrefsDraftDirty || isCountryCodesDirty;

  useEffect(() => {
    if (isPreferencesDirty) return;
    setPrefs(contextPrefs);
  }, [contextPrefs, isPreferencesDirty]);

  useEffect(() => {
    if (isPreferencesDirty) return;
    setCountryCodesDraft(countryCodes);
  }, [countryCodes, isPreferencesDirty]);

  const countryOptions = useMemo(
    () => buildCountrySelectOptions(countryCodesDraft, normalizeContactDialCode),
    [countryCodesDraft],
  );

  const updatePreference = useCallback(
    <K extends keyof ContactPreferences>(key: K, value: ContactPreferences[K]): void => {
      setPrefs((currentPreferences) => ({ ...currentPreferences, [key]: value }));
      setSaved(false);
    },
    [],
  );

  const updateCountryCodesDraft = useCallback(
    (next: CountryCodeEntry[]) => {
      setCountryCodesDraft(next);
      setSaved(false);
    },
    [],
  );

  const { isSaving, handleSave } = useContactsPreferencesSave({
    contextPrefs,
    prefs,
    setPrefs,
    updatePrefsAsync,
    updateCountryCodes,
    countryCodesDraft,
    setCountryCodesDraft,
    setSaved,
  });

  return {
    prefs,
    saved,
    setSaved,
    isSaving,
    isPrefsDirty: isPreferencesDirty,
    countryOptions,
    countryCodes: countryCodesDraft,
    updateCountryCodes: updateCountryCodesDraft,
    updatePreference,
    handleSave,
  };
}
