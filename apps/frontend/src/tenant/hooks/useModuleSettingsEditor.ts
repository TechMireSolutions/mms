import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { type TabDefinition } from "@mms/shared";
import { type ModuleSettingsShape } from "@/hooks/useModuleConfig";
import { useModuleFieldsEditor } from "./useModuleFieldsEditor";
import { useSavedFlash } from "./useSavedFlash";

const EMPTY_REQUIRED_TABS: string[] = [];
const DEFAULT_LOCKED_ENABLED_TABS: string[] = ["basic"];

interface UseModuleSettingsEditorOptions<T extends ModuleSettingsShape> {
  config: {
    settings: T;
    updateSettings: (settings: T) => void;
    updateSettingsAsync?: (settings: T) => Promise<void>;
  };
  tabRegistry: TabDefinition[];
  defaultEnabledTabs?: string[];
  defaultRequiredTabs?: string[];
  /** Tab keys that stay enabled on sync/save (default: `basic`). */
  lockedEnabledTabs?: string[];
}

/**
 * A reusable hook to coordinate module settings configurations and form field customization state.
 * Reduces duplication of state initialization, reactive resetting of fieldsEditor, and building the saved mapping.
 */
export function useModuleSettingsEditor<T extends ModuleSettingsShape>({
  config,
  tabRegistry,
  defaultEnabledTabs,
  defaultRequiredTabs = EMPTY_REQUIRED_TABS,
  lockedEnabledTabs = DEFAULT_LOCKED_ENABLED_TABS,
}: UseModuleSettingsEditorOptions<T>) {
  const { settings, updateSettings, updateSettingsAsync } = config;
  const { saved, flashSaved, clearSaved } = useSavedFlash();
  const [settingsDraft, setSettingsDraft] = useState<T>(settings);

  const lockedTabKeys = useMemo(
    () => new Set(lockedEnabledTabs.map((key) => key.toLowerCase())),
    [lockedEnabledTabs],
  );

  const isLockedEnabledTab = useCallback(
    (tabKey: string): boolean => lockedTabKeys.has(tabKey.toLowerCase()),
    [lockedTabKeys],
  );

  const withLockedEnabledTabs = useCallback(
    (tabIds: Iterable<string>): string[] => {
      const next = new Set(
        [...tabIds].map((tabId) => tabId.trim().toLowerCase()).filter(Boolean),
      );
      for (const locked of lockedTabKeys) next.add(locked);
      return [...next];
    },
    [lockedTabKeys],
  );

  const resolvedDefaultEnabledTabs = useMemo(() => {
    if (defaultEnabledTabs && defaultEnabledTabs.length > 0) {
      return withLockedEnabledTabs(defaultEnabledTabs);
    }
    const fromRegistry = tabRegistry.filter((t) => t.enabled !== false).map((t) => t.key);
    return withLockedEnabledTabs(fromRegistry.length > 0 ? fromRegistry : ["basic"]);
  }, [defaultEnabledTabs, tabRegistry, withLockedEnabledTabs]);

  const setSaved = useCallback((val: boolean | ((curr: boolean) => boolean)) => {
    const resolved = typeof val === "function" ? val(saved) : val;
    if (resolved) {
      flashSaved();
    } else {
      clearSaved();
    }
  }, [saved, flashSaved, clearSaved]);

  // Sync draft whenever upstream settings change
  useEffect(() => {
    if (settings) {
      setSettingsDraft(settings);
    }
  }, [settings]);

  const upd = useCallback(<K extends keyof T>(field: K, value: T[K]): void => {
    setSettingsDraft((curr) => ({ ...curr, [field]: value }));
    setSaved(false);
  }, [setSaved]);

  const activeEnabledTabs = useMemo(() => {
    return withLockedEnabledTabs(
      settings.enabledTabs && settings.enabledTabs.length > 0
        ? settings.enabledTabs
        : resolvedDefaultEnabledTabs,
    );
  }, [settings.enabledTabs, resolvedDefaultEnabledTabs, withLockedEnabledTabs]);

  const fieldsEditor = useModuleFieldsEditor({
    initialTabs: tabRegistry,
    initialFields: settings.fields || {},
    initialEnabledTabs: Array.from(new Set(activeEnabledTabs)),
    initialRequiredTabs: Array.from(new Set(settings.requiredTabs || defaultRequiredTabs)),
  });

  const resetRef = useRef(fieldsEditor.resetAllState);
  resetRef.current = fieldsEditor.resetAllState;

  // Rehydrate fields editor only when persisted settings / registry change.
  // Do not depend on draft Sets — comparing draft vs settings snapped tab/field
  // checkboxes back on every toggle.
  useEffect(() => {
    if (!settings) return;

    const coreTabKeys = new Set(tabRegistry.map((tab) => tab.key.toLowerCase()));
    const customTabs = (settings.formTabs || []).filter(
      (tab: TabDefinition) => !coreTabKeys.has(tab.key.toLowerCase()),
    );
    const currentActiveEnabledTabs = withLockedEnabledTabs(
      settings.enabledTabs && settings.enabledTabs.length > 0
        ? settings.enabledTabs
        : resolvedDefaultEnabledTabs,
    );

    const enabledSet = new Set(currentActiveEnabledTabs);

    const updatedTabs = [...tabRegistry, ...customTabs].map((tab) => ({
      ...tab,
      enabled: isLockedEnabledTab(tab.key) ? true : enabledSet.has(tab.key.toLowerCase()),
    }));

    resetRef.current(
      updatedTabs,
      settings.fields || {},
      currentActiveEnabledTabs,
      (settings.requiredTabs || defaultRequiredTabs).map((t) => t.toLowerCase()),
    );
  }, [
    settings,
    tabRegistry,
    resolvedDefaultEnabledTabs,
    defaultRequiredTabs,
    withLockedEnabledTabs,
    isLockedEnabledTab,
  ]);

  const saveSettingsAsync = useCallback(async (
    preferencesDraft?: Partial<T>,
    additionalFields?: Partial<T>,
    options: { markSaved?: boolean } = {},
  ) => {
    const enabledSet = new Set(
      withLockedEnabledTabs(Array.from(fieldsEditor.enabledTabs)),
    );
    const updatedFormTabs = fieldsEditor.formTabs.map((tab) => ({
      ...tab,
      enabled: isLockedEnabledTab(tab.key) ? true : enabledSet.has(tab.key.toLowerCase()),
    }));

    const nextSettings: T = {
      ...settings,
      ...settingsDraft,
      ...(preferencesDraft ?? {}),
      enabledTabs: Array.from(enabledSet),
      requiredTabs: Array.from(fieldsEditor.requiredTabs).map((t) => t.toLowerCase()),
      formTabs: updatedFormTabs,
      fields: fieldsEditor.buildFieldsMap(),
      ...(additionalFields ?? {}),
    };

    if (updateSettingsAsync) {
      await updateSettingsAsync(nextSettings);
    } else {
      updateSettings(nextSettings);
    }
    if (options.markSaved !== false) setSaved(true);
  }, [
    settings,
    settingsDraft,
    updateSettings,
    updateSettingsAsync,
    fieldsEditor,
    setSaved,
    withLockedEnabledTabs,
    isLockedEnabledTab,
  ]);

  const saveSettings = useCallback((preferencesDraft?: Partial<T>, additionalFields?: Partial<T>) => {
    void saveSettingsAsync(preferencesDraft, additionalFields);
  }, [saveSettingsAsync]);

  return {
    settings,
    settingsDraft,
    fieldsEditor,
    saved,
    setSaved,
    upd,
    saveSettings,
    saveSettingsAsync,
  };
}

