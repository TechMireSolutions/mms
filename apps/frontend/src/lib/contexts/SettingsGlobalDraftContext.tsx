import React, { createContext, useContext } from 'react';
import {
  useGlobalSettingsDraft,
  type UseGlobalSettingsDraftResult,
} from '@/hooks/useGlobalSettingsDraft';

const SettingsGlobalDraftContext = createContext<UseGlobalSettingsDraftResult | null>(null);

/** Shared global_settings draft for General + System Modules tabs. */
export function SettingsGlobalDraftProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const draft = useGlobalSettingsDraft();
  return (
    <SettingsGlobalDraftContext.Provider value={draft}>{children}</SettingsGlobalDraftContext.Provider>
  );
}

export function useSettingsGlobalDraft(): UseGlobalSettingsDraftResult {
  const ctx = useContext(SettingsGlobalDraftContext);
  if (!ctx) {
    throw new Error('useSettingsGlobalDraft must be used within SettingsGlobalDraftProvider');
  }
  return ctx;
}
