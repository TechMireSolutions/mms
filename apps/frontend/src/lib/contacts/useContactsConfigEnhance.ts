import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnRegistryEntry, FieldConfig, TabDefinition } from "@mms/shared";
import type { StandardModuleConfigCore } from "@/hooks/createStandardModuleConfigHook";
import { saveFieldConfigAsync, setFieldConfigMemory } from "@/lib/contactFieldsStore";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactConfigCollections } from "@/lib/contacts/useContactConfigCollections";
import { useContactConfigPrefs } from "@/lib/contacts/useContactConfigPrefs";
import { useContactConfigTabFields } from "@/lib/contacts/useContactConfigTabFields";
import { useContactColumnLayout } from "@/lib/contacts/useContactColumnLayout";
import { CONTACTS_FIELD_CONFIG_QUERY_KEY } from "@/tenant/hooks/collections/contacts";
import type {
  ContactConfigExtras,
  ContactsConfigSettings,
} from "./useContactConfigTypes";

/**
 * Contacts-specific slice layered on top of the standard-module config core.
 * Owns prefs state, custom-tab hydration, lookups, column layout, and tab/field
 * enablement — everything that distinguishes Contacts from the simpler modules.
 */
export function useContactsConfigEnhance(
  core: StandardModuleConfigCore<ContactsConfigSettings>,
): ContactConfigExtras {
  const { settings, updateSettings } = core;
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const viewerRole = user?.role ?? "";
  const userId = user?.id;

  const tabsAbortRef = useRef<AbortController | null>(null);
  const lastGoodFormTabsRef = useRef<TabDefinition[] | null>(null);
  const hasHydratedTabsOnceRef = useRef(false);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const [formTabsReady, setFormTabsReady] = useState(false);

  const rememberFormTabs = useCallback((tabs: TabDefinition[] | undefined) => {
    if (tabs && tabs.length > 0) {
      lastGoodFormTabsRef.current = tabs;
    }
  }, []);

  const tabFields = useContactConfigTabFields({ fieldConfig: settings, userRole: viewerRole });
  const collections = useContactConfigCollections({ settings, updateSettings });
  const prefsSlice = useContactConfigPrefs();
  const { reloadCollections } = collections;
  const { syncFromQueryCache } = prefsSlice;
  const columnLayout = useContactColumnLayout({
    fieldConfig: settings,
    fields: tabFields.fields,
    enabledTabIds: tabFields.enabledTabIds,
    isTabFieldEnabled: tabFields.isTabFieldEnabled,
    viewerRole,
  });

  // Form-tab readiness from documentConfig
  const reloadContactConfigFromDatabaseCache = useCallback(() => {
    const documentConfig = settingsRef.current;
    syncFromQueryCache();

    if (!isAuthenticated) {
      updateSettings(documentConfig);
      hasHydratedTabsOnceRef.current = true;
      setFormTabsReady(true);
      return;
    }

    reloadCollections();
    updateSettings(documentConfig);
    hasHydratedTabsOnceRef.current = true;
    setFormTabsReady(true);
  }, [
    isAuthenticated,
    updateSettings,
    reloadCollections,
    syncFromQueryCache,
  ]);

  useEffect(() => {
    reloadContactConfigFromDatabaseCache();
  }, [reloadContactConfigFromDatabaseCache, userId]);

  // Keep the memory store in sync when the composed settings (Query) change.
  useEffect(() => {
    setFieldConfigMemory(settings);
    const hasTabs = Array.isArray(settings.formTabs) && settings.formTabs.length > 0;
    const lastGoodTabs = lastGoodFormTabsRef.current;
    if (!hasTabs && lastGoodTabs && Array.isArray(lastGoodTabs) && lastGoodTabs.length > 0) {
      updateSettings({ ...settings, formTabs: lastGoodTabs });
    }
  }, [settings, updateSettings]);

  const updateConfig = useCallback(
    (nextConfig: FieldConfig) => {
      rememberFormTabs(nextConfig.formTabs);
      updateSettings(nextConfig);
    },
    [rememberFormTabs, updateSettings],
  );

  const updateConfigAsync = useCallback(
    async (nextConfig: FieldConfig): Promise<void> => {
      const saved = await saveFieldConfigAsync(nextConfig);
      const withTabs = { ...saved, formTabs: nextConfig.formTabs ?? saved.formTabs };
      // Drop in-flight tab hydrates that may still hold pre-save Query document fields.
      tabsAbortRef.current?.abort();
      tabsAbortRef.current = null;
      rememberFormTabs(withTabs.formTabs);
      setFieldConfigMemory(withTabs);
      queryClient.setQueryData(CONTACTS_FIELD_CONFIG_QUERY_KEY, withTabs);
    },
    [queryClient, rememberFormTabs],
  );

  const updateColumnRegistry = useCallback(
    (columnRegistry: ColumnRegistryEntry[]) => {
      updateConfig({ ...settings, columnRegistry });
    },
    [settings, updateConfig],
  );

  return {
    ...prefsSlice,
    formTabsReady,
    ...tabFields,
    ...collections,
    ...columnLayout,
    updateConfig,
    updateConfigAsync,
    updateColumnRegistry,
  };
}
