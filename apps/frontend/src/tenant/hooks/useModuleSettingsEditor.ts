import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { type TabDefinition } from "@mms/shared";

export interface ModuleSettingsShape {
  fields?: Record<string, any>;
  customFields?: any[];
  fieldOrder?: string[];
  formTabs?: any[];
  enabledTabs?: string[];
  requiredTabs?: string[];
}
import { moduleSettingsEditorFingerprint } from "./moduleSettingsEditorFingerprint";
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
  lockedEnabledTabs?: readonly string[];
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

  // Content fingerprint — ignore fieldConfig object identity churn from Query/context.
  const settingsRehydrateFingerprint = moduleSettingsEditorFingerprint({
    fields: settings.fields,
    enabledTabs: settings.enabledTabs,
    requiredTabs: settings.requiredTabs,
    formTabs: settings.formTabs as TabDefinition[] | undefined,
    tabRegistry,
    resolvedDefaultEnabledTabs,
    defaultRequiredTabs,
  });

  // Sync settings draft when persisted content changes (skip while draft dirty).
  const prevSettingsFingerprintRef = useRef<string | null>(null);
  const settingsDraftDirtyRef = useRef(false);
  useEffect(() => {
    if (!settings) return;
    if (prevSettingsFingerprintRef.current === settingsRehydrateFingerprint) return;
    prevSettingsFingerprintRef.current = settingsRehydrateFingerprint;
    if (settingsDraftDirtyRef.current) return;
    setSettingsDraft(settings);
  }, [settings, settingsRehydrateFingerprint]);

  const upd = useCallback(<K extends keyof T>(field: K, value: T[K]): void => {
    settingsDraftDirtyRef.current = true;
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

  const isDraftDirtyRef = useRef(fieldsEditor.isDraftDirty);
  isDraftDirtyRef.current = fieldsEditor.isDraftDirty;

  const rehydrateInputRef = useRef({
    settings,
    tabRegistry,
    resolvedDefaultEnabledTabs,
    defaultRequiredTabs,
  });
  rehydrateInputRef.current = {
    settings,
    tabRegistry,
    resolvedDefaultEnabledTabs,
    defaultRequiredTabs,
  };

  // Rehydrate fields editor on content change; skip while draft dirty.
  const prevFieldsFingerprintRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevFieldsFingerprintRef.current === settingsRehydrateFingerprint) return;
    prevFieldsFingerprintRef.current = settingsRehydrateFingerprint;
    if (isDraftDirtyRef.current()) return;
    const {
      settings: currentSettings,
      tabRegistry: currentTabRegistry,
      resolvedDefaultEnabledTabs: currentDefaultEnabled,
      defaultRequiredTabs: currentDefaultRequired,
    } = rehydrateInputRef.current;
    if (!currentSettings) return;

    const coreTabKeys = new Set(currentTabRegistry.map((tab) => tab.key.toLowerCase()));
    const customTabs = (currentSettings.formTabs || []).filter(
      (tab: TabDefinition) => !coreTabKeys.has(tab.key.toLowerCase()),
    );
    const currentActiveEnabledTabs = withLockedEnabledTabs(
      currentSettings.enabledTabs && currentSettings.enabledTabs.length > 0
        ? currentSettings.enabledTabs
        : currentDefaultEnabled,
    );

    const enabledSet = new Set(currentActiveEnabledTabs);

    const updatedTabs = [...currentTabRegistry, ...customTabs].map((tab) => ({
      ...tab,
      enabled: isLockedEnabledTab(tab.key) ? true : enabledSet.has(tab.key.toLowerCase()),
    }));

    resetRef.current(
      updatedTabs,
      currentSettings.fields || {},
      currentActiveEnabledTabs,
      (currentSettings.requiredTabs || currentDefaultRequired).map((t) => t.toLowerCase()),
    );
  }, [
    settingsRehydrateFingerprint,
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
    // Draft is now persisted — let the post-save reload rehydrate server truth.
    settingsDraftDirtyRef.current = false;
    fieldsEditor.markDraftPristine();
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

  /** Reset fields + preferences drafts to last persisted settings (Setup dirty-tab discard). */
  const discardDrafts = useCallback(() => {
    settingsDraftDirtyRef.current = false;
    setSettingsDraft(settings);

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
      (settings.requiredTabs || defaultRequiredTabs).map((tab) => tab.toLowerCase()),
    );
  }, [
    settings,
    tabRegistry,
    withLockedEnabledTabs,
    isLockedEnabledTab,
    resolvedDefaultEnabledTabs,
    defaultRequiredTabs,
  ]);

  return {
    settings,
    settingsDraft,
    fieldsEditor,
    saved,
    setSaved,
    upd,
    saveSettings,
    saveSettingsAsync,
    discardDrafts,
  };
}
