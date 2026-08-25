import { useState, useEffect, useCallback, useRef } from "react";

export interface ModuleSettingsShape {
  fields?: Record<string, unknown>;
  customFields?: unknown[];
  fieldOrder?: string[];
  formTabs?: unknown[];
  enabledTabs?: string[];
  requiredTabs?: string[];
}
import { useSavedFlash } from "./useSavedFlash";

interface UseModuleSettingsEditorOptions<T extends ModuleSettingsShape> {
  config: {
    settings: T;
    updateSettings: (settings: T) => void;
    updateSettingsAsync?: (settings: T) => Promise<void>;
  };
}

/**
 * A reusable hook to coordinate module settings configurations.
 * Manages draft state for preferences and coordinates saves.
 */
export function useModuleSettingsEditor<T extends ModuleSettingsShape>({
  config,
}: UseModuleSettingsEditorOptions<T>) {
  const { settings, updateSettings, updateSettingsAsync } = config;
  const { saved, flashSaved, clearSaved } = useSavedFlash();
  const [settingsDraft, setSettingsDraft] = useState<T>(settings);

  const setSaved = useCallback((val: boolean | ((curr: boolean) => boolean)) => {
    const resolved = typeof val === "function" ? val(saved) : val;
    if (resolved) {
      flashSaved();
    } else {
      clearSaved();
    }
  }, [saved, flashSaved, clearSaved]);

  // Sync settings draft when persisted content changes
  const prevSettingsRef = useRef<T | null>(null);
  const settingsDraftDirtyRef = useRef(false);
  useEffect(() => {
    if (!settings) return;
    // Simple identity check since Settings is typically from a Query Cache
    if (prevSettingsRef.current === settings) return;
    prevSettingsRef.current = settings;
    if (settingsDraftDirtyRef.current) return;
    setSettingsDraft(settings);
  }, [settings]);

  const upd = useCallback(<K extends keyof T>(field: K, value: T[K]): void => {
    settingsDraftDirtyRef.current = true;
    setSettingsDraft((curr) => ({ ...curr, [field]: value }));
    setSaved(false);
  }, [setSaved]);

  const saveSettingsAsync = useCallback(async (
    preferencesDraft?: Partial<T>,
    additionalFields?: Partial<T>,
    options: { markSaved?: boolean } = {},
  ) => {
    const nextSettings: T = {
      ...settings,
      ...settingsDraft,
      ...(preferencesDraft ?? {}),
      ...(additionalFields ?? {}),
    };

    if (updateSettingsAsync) {
      await updateSettingsAsync(nextSettings);
    } else {
      updateSettings(nextSettings);
    }
    
    settingsDraftDirtyRef.current = false;
    if (options.markSaved !== false) setSaved(true);
  }, [
    settings,
    settingsDraft,
    updateSettings,
    updateSettingsAsync,
    setSaved,
  ]);

  const saveSettings = useCallback((preferencesDraft?: Partial<T>, additionalFields?: Partial<T>) => {
    void saveSettingsAsync(preferencesDraft, additionalFields);
  }, [saveSettingsAsync]);

  /** Reset preferences drafts to last persisted settings (Setup dirty-tab discard). */
  const discardDrafts = useCallback(() => {
    settingsDraftDirtyRef.current = false;
    setSettingsDraft(settings);
  }, [settings]);

  return {
    settings,
    settingsDraft,
    saved,
    setSaved,
    upd,
    saveSettings,
    saveSettingsAsync,
    discardDrafts,
  };
}
