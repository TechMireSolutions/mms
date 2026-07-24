import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { type TabDefinition } from "@mms/shared";
import { type ModuleSettingsShape } from "@/hooks/useModuleConfig";
import { useModuleFieldsEditor } from "./useModuleFieldsEditor";
import { useSavedFlash } from "./useSavedFlash";

interface UseModuleSettingsEditorOptions<T extends ModuleSettingsShape> {
  config: {
    settings: T;
    updateSettings: (settings: T) => void;
  };
  tabRegistry: TabDefinition[];
  defaultEnabledTabs?: string[];
  defaultRequiredTabs?: string[];
}

/**
 * A reusable hook to coordinate module settings configurations and form field customization state.
 * Reduces duplication of state initialization, reactive resetting of fieldsEditor, and building the saved mapping.
 */
export function useModuleSettingsEditor<T extends ModuleSettingsShape>({
  config,
  tabRegistry,
  defaultEnabledTabs,
  defaultRequiredTabs = [],
}: UseModuleSettingsEditorOptions<T>) {
  const { settings, updateSettings } = config;
  const { saved, flashSaved, clearSaved } = useSavedFlash();
  const [settingsDraft, setSettingsDraft] = useState<T>(settings);

  const resolvedDefaultEnabledTabs = useMemo(() => {
    if (defaultEnabledTabs && defaultEnabledTabs.length > 0) return defaultEnabledTabs;
    const fromRegistry = tabRegistry.filter((t) => t.enabled !== false).map((t) => t.key);
    return fromRegistry.length > 0 ? fromRegistry : ["basic"];
  }, [defaultEnabledTabs, tabRegistry]);

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
    return settings.enabledTabs && settings.enabledTabs.length > 0
      ? settings.enabledTabs
      : resolvedDefaultEnabledTabs;
  }, [settings.enabledTabs, resolvedDefaultEnabledTabs]);

  const fieldsEditor = useModuleFieldsEditor({
    initialTabs: tabRegistry,
    initialFields: settings.fields || {},
    initialEnabledTabs: Array.from(new Set(activeEnabledTabs)),
    initialRequiredTabs: Array.from(new Set(settings.requiredTabs || defaultRequiredTabs)),
  });

  const resetRef = useRef(fieldsEditor.resetAllState);
  resetRef.current = fieldsEditor.resetAllState;

  // Keep fields state synced when settings load or change
  useEffect(() => {
    if (!settings) return;

    const coreTabKeys = new Set(tabRegistry.map((tab) => tab.key.toLowerCase()));
    const customTabs = (settings.formTabs || []).filter((tab: TabDefinition) => !coreTabKeys.has(tab.key.toLowerCase()));
    const currentActiveEnabledTabs = (settings.enabledTabs && settings.enabledTabs.length > 0
      ? settings.enabledTabs
      : resolvedDefaultEnabledTabs).map((t) => t.toLowerCase());

    const enabledSet = new Set(currentActiveEnabledTabs);

    const updatedTabs = [
      ...tabRegistry,
      ...customTabs,
    ].map((tab) => ({
      ...tab,
      enabled: tab.key.toLowerCase() === "basic" ? true : enabledSet.has(tab.key.toLowerCase()),
    }));

    // Perform structural checks to break potential infinite update loop
    const currentTabsStr = JSON.stringify(fieldsEditor.formTabs);
    const newTabsStr = JSON.stringify(updatedTabs);
    const currentFieldsStr = JSON.stringify(fieldsEditor.tabFields);
    const newFieldsStr = JSON.stringify(settings.fields || {});
    
    const currentEnabledStr = Array.from(fieldsEditor.enabledTabs).map((t) => t.toLowerCase()).sort().join(',');
    const newEnabledStr = Array.from(enabledSet).sort().join(',');
    
    const currentRequiredStr = Array.from(fieldsEditor.requiredTabs).map((t) => t.toLowerCase()).sort().join(',');
    const newRequiredStr = Array.from(new Set((settings.requiredTabs || defaultRequiredTabs).map((t) => t.toLowerCase()))).sort().join(',');

    if (
      currentTabsStr !== newTabsStr ||
      currentFieldsStr !== newFieldsStr ||
      currentEnabledStr !== newEnabledStr ||
      currentRequiredStr !== newRequiredStr
    ) {
      resetRef.current(
        updatedTabs,
        settings.fields || {},
        currentActiveEnabledTabs,
        (settings.requiredTabs || defaultRequiredTabs).map((t) => t.toLowerCase())
      );
    }
  }, [
    settings,
    tabRegistry,
    resolvedDefaultEnabledTabs,
    defaultRequiredTabs,
    fieldsEditor.formTabs,
    fieldsEditor.tabFields,
    fieldsEditor.enabledTabs,
    fieldsEditor.requiredTabs,
  ]);

  const saveSettings = useCallback((preferencesDraft?: Partial<T>, additionalFields?: Partial<T>) => {
    const enabledSet = new Set(Array.from(fieldsEditor.enabledTabs).map((t) => t.toLowerCase()));
    const updatedFormTabs = fieldsEditor.formTabs.map((tab) => ({
      ...tab,
      enabled: tab.key.toLowerCase() === "basic" ? true : enabledSet.has(tab.key.toLowerCase()),
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

    updateSettings(nextSettings);
    setSaved(true);
  }, [settings, settingsDraft, updateSettings, fieldsEditor, setSaved]);

  return {
    settings,
    settingsDraft,
    fieldsEditor,
    saved,
    setSaved,
    upd,
    saveSettings,
  };
}

