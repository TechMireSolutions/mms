import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { loadFieldConfig, saveFieldConfig, saveFieldConfigAsync } from "@/lib/contactFieldsStore";
import {
  FieldConfig,
  ContactPreferences,
  ColumnRegistryEntry,
} from "@mms/shared";
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  savePreferencesAsync,
} from "@/lib/contacts/preferencesStorage";
import { useContactConfigColumnPrefs } from "@/lib/contacts/useContactConfigColumnPrefs";
import { useContactConfigTabFields } from "@/lib/contacts/useContactConfigTabFields";

/**
 * Field config, prefs, column overlay, and tab/field enablement for ContactConfigProvider.
 */
export function useContactConfigCore({
  userId,
  userRole,
  reloadCollections,
}: {
  userId: string | number | undefined;
  userRole: string;
  reloadCollections: () => void;
}) {
  const lastUserIdRef = useRef<string | number | undefined>(userId);
  const [fieldConfig, setFieldConfigState] = useState<FieldConfig>(() => loadFieldConfig());
  const [prefs, setPrefsState] = useState<ContactPreferences>(() => ({
    ...DEFAULT_PREFERENCES,
    ...loadPreferences(),
  }));
  const { rawUserColumnOverlay, updateUserColumnLayout } = useContactConfigColumnPrefs(userId);

  const reloadContactConfigFromDatabaseCache = useCallback(() => {
    setFieldConfigState(loadFieldConfig());
    setPrefsState({
      ...DEFAULT_PREFERENCES,
      ...loadPreferences(),
    });
    reloadCollections();
  }, [reloadCollections]);

  useEffect(() => {
    if (lastUserIdRef.current !== userId) {
      lastUserIdRef.current = userId;
      setTimeout(reloadContactConfigFromDatabaseCache, 0);
    }
  }, [reloadContactConfigFromDatabaseCache, userId]);

  useEffect(() => {
    const handleLocalDatabaseUpdate = () => {
      setTimeout(reloadContactConfigFromDatabaseCache, 0);
    };
    window.addEventListener("local-database-update", handleLocalDatabaseUpdate);
    return () => window.removeEventListener("local-database-update", handleLocalDatabaseUpdate);
  }, [reloadContactConfigFromDatabaseCache]);

  const updateConfig = useCallback((nextConfig: FieldConfig) => {
    saveFieldConfig(nextConfig);
    setFieldConfigState(nextConfig);
  }, []);

  const updateConfigAsync = useCallback(async (nextConfig: FieldConfig): Promise<void> => {
    await saveFieldConfigAsync(nextConfig);
    setFieldConfigState(nextConfig);
  }, []);

  const updatePrefs = useCallback((newPrefs: Partial<ContactPreferences>) => {
    setPrefsState((currentPreferences) => {
      const merged = { ...currentPreferences, ...newPrefs };
      savePreferences(merged);
      return merged;
    });
  }, []);

  const updatePrefsAsync = useCallback(async (newPrefs: Partial<ContactPreferences>): Promise<void> => {
    const merged = { ...prefs, ...newPrefs };
    await savePreferencesAsync(merged);
    setPrefsState(merged);
  }, [prefs]);

  const updateColumnRegistry = useCallback((columnRegistry: ColumnRegistryEntry[]) => {
    updateConfig({ ...fieldConfig, columnRegistry });
  }, [fieldConfig, updateConfig]);

  const tabFields = useContactConfigTabFields({ fieldConfig, userRole });

  return {
    fieldConfig,
    setFieldConfigState: setFieldConfigState as Dispatch<SetStateAction<FieldConfig>>,
    prefs,
    rawUserColumnOverlay,
    updateConfig,
    updateConfigAsync,
    updatePrefs,
    updatePrefsAsync,
    updateColumnRegistry,
    updateUserColumnLayout,
    ...tabFields,
  };
}
