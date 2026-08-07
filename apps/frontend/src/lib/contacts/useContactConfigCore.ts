import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  loadFieldConfig,
  saveFieldConfig,
  saveFieldConfigAsync,
  setFieldConfigMemory,
} from "@/lib/contactFieldsStore";
import {
  FieldConfig,
  ContactPreferences,
  ColumnRegistryEntry,
  mergeContactsFormTabsFromApi,
  type TabDefinition,
} from "@mms/shared";
import { loadContactsFormTabs } from "@/lib/contacts/contactsCustomTabsApi";
import {
  loadPreferences,
  savePreferences,
  savePreferencesAsync,
  setPreferencesMemory,
} from "@/lib/contacts/preferencesStorage";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useContactConfigTabFields } from "@/lib/contacts/useContactConfigTabFields";
import { notify } from "@/lib/notify";
import { useTranslation } from "@/hooks/useTranslation";
import {
  CONTACTS_FIELD_CONFIG_QUERY_KEY,
  useContactFieldConfigQuery,
  useContactPreferencesQuery,
} from "@/tenant/features/contacts/hooks/useContactSetupConfig";

/**
 * Field config, prefs, column overlay, and tab/field enablement for ContactConfigProvider.
 * Field config + preferences hydrate from typed REST; formTabs from `/api/custom-tabs`.
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
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const tabsAbortRef = useRef<AbortController | null>(null);
  const lastGoodFormTabsRef = useRef<TabDefinition[] | null>(null);
  const hasHydratedTabsOnceRef = useRef(false);
  const fieldConfigQuery = useContactFieldConfigQuery();
  const preferencesQuery = useContactPreferencesQuery();
  const [fieldConfig, setFieldConfigState] = useState<FieldConfig>(() => loadFieldConfig());
  const [prefs, setPrefsState] = useState<ContactPreferences>(() => loadPreferences());
  /** False until first authenticated tabs hydrate settles (avoids DEFAULT flash for customs). */
  const [formTabsReady, setFormTabsReady] = useState(false);

  const rememberFormTabs = useCallback((tabs: TabDefinition[] | undefined) => {
    if (tabs && tabs.length > 0) {
      lastGoodFormTabsRef.current = tabs;
    }
  }, []);

  useEffect(() => {
    if (!fieldConfigQuery.data) return;
    setFieldConfigMemory(fieldConfigQuery.data);
    setFieldConfigState((current) => ({
      ...fieldConfigQuery.data,
      formTabs: current.formTabs?.length ? current.formTabs : fieldConfigQuery.data.formTabs,
    }));
  }, [fieldConfigQuery.data]);

  useEffect(() => {
    if (!preferencesQuery.data) return;
    setPreferencesMemory(preferencesQuery.data);
    setPrefsState(preferencesQuery.data);
  }, [preferencesQuery.data]);

  const fieldConfigQueryDataRef = useRef(fieldConfigQuery.data);
  fieldConfigQueryDataRef.current = fieldConfigQuery.data;

  const preferencesQueryDataRef = useRef(preferencesQuery.data);
  preferencesQueryDataRef.current = preferencesQuery.data;

  const reloadCollectionsRef = useRef(reloadCollections);
  reloadCollectionsRef.current = reloadCollections;

  const reloadContactConfigFromDatabaseCache = useCallback(() => {
    tabsAbortRef.current?.abort();
    const controller = new AbortController();
    tabsAbortRef.current = controller;

    const documentConfig = fieldConfigQueryDataRef.current ?? loadFieldConfig();
    if (preferencesQueryDataRef.current) {
      setPrefsState(preferencesQueryDataRef.current);
    } else {
      setPrefsState(loadPreferences());
    }

    // Unauthenticated hosts (tenant login) must not refetch lookups — Query.refetch()
    // bypasses `enabled: false` and floods /lookups + /auth/refresh with 401s.
    if (!isAuthenticated) {
      setFieldConfigState(documentConfig);
      hasHydratedTabsOnceRef.current = true;
      setFormTabsReady(true);
      return;
    }

    reloadCollectionsRef.current();

    if (!hasHydratedTabsOnceRef.current) {
      setFormTabsReady(false);
    }

    void (async () => {
      try {
        const apiTabs = await loadContactsFormTabs(controller.signal);
        if (controller.signal.aborted) return;
        const formTabs = mergeContactsFormTabsFromApi(
          documentConfig.formTabs,
          apiTabs,
          documentConfig.fields,
        );
        rememberFormTabs(formTabs);
        setFieldConfigState({
          ...documentConfig,
          formTabs,
        });
        hasHydratedTabsOnceRef.current = true;
        setFormTabsReady(true);
      } catch {
        if (controller.signal.aborted) return;
        const fallbackTabs = lastGoodFormTabsRef.current;
        setFieldConfigState({
          ...documentConfig,
          formTabs: fallbackTabs
            ? mergeContactsFormTabsFromApi(
                documentConfig.formTabs,
                fallbackTabs,
                documentConfig.fields,
              )
            : documentConfig.formTabs,
        });
        hasHydratedTabsOnceRef.current = true;
        setFormTabsReady(true);
        notify.warning(t("contacts.setup.formTabsLoadFailed"));
      }
    })();
  }, [isAuthenticated, rememberFormTabs, t]);

  useEffect(() => {
    reloadContactConfigFromDatabaseCache();
    return () => {
      tabsAbortRef.current?.abort();
    };
  }, [reloadContactConfigFromDatabaseCache, userId]);

  const updateConfig = useCallback((nextConfig: FieldConfig) => {
    saveFieldConfig(nextConfig);
    rememberFormTabs(nextConfig.formTabs);
    setFieldConfigState(nextConfig);
  }, [rememberFormTabs]);

  const updateConfigAsync = useCallback(async (nextConfig: FieldConfig): Promise<void> => {
    const saved = await saveFieldConfigAsync(nextConfig);
    const withTabs = { ...saved, formTabs: nextConfig.formTabs ?? saved.formTabs };
    // Drop in-flight tab hydrates that may still hold pre-save Query document fields.
    tabsAbortRef.current?.abort();
    tabsAbortRef.current = null;
    rememberFormTabs(withTabs.formTabs);
    setFieldConfigMemory(withTabs);
    setFieldConfigState(withTabs);
    queryClient.setQueryData(CONTACTS_FIELD_CONFIG_QUERY_KEY, withTabs);
  }, [queryClient, rememberFormTabs]);

  const updatePrefs = useCallback((newPrefs: Partial<ContactPreferences>) => {
    setPrefsState((currentPreferences) => {
      const merged = { ...currentPreferences, ...newPrefs };
      savePreferences(merged);
      return merged;
    });
  }, []);

  const updatePrefsAsync = useCallback(async (newPrefs: Partial<ContactPreferences>): Promise<void> => {
    const merged = { ...prefs, ...newPrefs };
    const saved = await savePreferencesAsync(merged);
    setPrefsState(saved);
  }, [prefs]);

  const updateColumnRegistry = useCallback((columnRegistry: ColumnRegistryEntry[]) => {
    updateConfig({ ...fieldConfig, columnRegistry });
  }, [fieldConfig, updateConfig]);

  const tabFields = useContactConfigTabFields({ fieldConfig, userRole });

  return {
    fieldConfig,
    setFieldConfigState: setFieldConfigState as Dispatch<SetStateAction<FieldConfig>>,
    formTabsReady,
    prefs,
    updateConfig,
    updateConfigAsync,
    updatePrefs,
    updatePrefsAsync,
    updateColumnRegistry,
    ...tabFields,
  };
}
