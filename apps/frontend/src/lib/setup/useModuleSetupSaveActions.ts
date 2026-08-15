import { useCallback, useMemo, useState } from "react";
import type {
  AppTranslationKey,
  ColumnRegistryEntry,
  FieldDefinition,
  TabDefinition,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { safeAudit } from "@/lib/safeAudit";
import { runModuleFieldsSetupSave } from "@/lib/setup/runModuleFieldsSetupSave";

export type ModuleSetupFieldsEditorLike = {
  formTabs: TabDefinition[];
  enabledTabs: Set<string>;
  requiredTabs: Set<string>;
  tabFields: Record<string, FieldDefinition[]>;
  buildFieldsMap: () => Record<string, FieldDefinition[]>;
  markDraftPristine: () => void;
  handleDeleteField: (tabId: string, fieldId: string) => void;
};

export interface ModuleSetupSaveActionsOptions<TSettings> {
  settings: TSettings;
  settingsDraft: TSettings;
  fieldsEditor: ModuleSetupFieldsEditorLike;
  mode?: "fields" | "preferences";
  setSaved: (value: boolean | ((curr: boolean) => boolean)) => void;

  fieldsSnapshot: (input: {
    fields: Record<string, FieldDefinition[]> | undefined;
    enabledTabs: Iterable<string>;
    requiredTabs: Iterable<string>;
    formTabs: TabDefinition[];
  }) => string;
  resolvePersistedEnabledTabs: (settings: TSettings) => string[];
  defaultRequiredTabs: readonly string[];
  defaultTabRegistry: TabDefinition[];
  lockedTabPredicate: (tabKey: string) => boolean;
  defaultColumnRegistry: ColumnRegistryEntry[];
  registrySyncFn: (
    registry: ColumnRegistryEntry[] | undefined,
    fields: Record<string, FieldDefinition[]>,
    enabledTabIds: Iterable<string>,
  ) => ColumnRegistryEntry[];
  syncCustomTabs?: (formTabs: TabDefinition[]) => Promise<void>;
  prefsKeys: readonly string[];
  normalizePrefs: (settingsDraft: TSettings) => unknown;
  buildFieldConfigPayload: (ctx: {
    settingsWithoutFormTabs: Record<string, unknown>;
    enabledTabs: string[];
    requiredTabs: string[];
    fieldsMap: Record<string, FieldDefinition[]>;
    syncedRegistry: ColumnRegistryEntry[];
  }) => Record<string, unknown>;

  fieldConfigMutation: { mutateAsync: (payload: unknown) => Promise<unknown> };
  preferencesMutation: { mutateAsync: (prefs: unknown) => Promise<unknown> };
  logSetupAudit: {
    mutateAsync: (payload: { area: "fields" | "preferences"; summary: string }) => Promise<unknown>;
  };
  handleDeleteFieldWithGuard: (tabId: string, fieldId: string) => Promise<boolean>;

  keys: {
    auditSummary: AppTranslationKey;
    preferencesSaved: AppTranslationKey;
    fieldsSaved: AppTranslationKey;
    saveFailed: AppTranslationKey;
    auditChannel: string;
  };
}

export type ModuleSetupSettingsLike = {
  fields?: unknown;
  formTabs?: TabDefinition[];
  requiredTabs?: string[];
  columnRegistry?: ColumnRegistryEntry[];
};

/**
 * Shared module Setup save choreography: fields/preferences dirty checks, locked-tab
 * form-tab rebuild, registry sync, then `runModuleFieldsSetupSave`. Module adapters
 * pass mutations, snapshot fn, registry/locked-tab tokens, and payload builder.
 */
export function useModuleSetupSaveActions<TSettings extends ModuleSetupSettingsLike>({
  settings,
  settingsDraft,
  fieldsEditor,
  mode,
  setSaved,
  fieldsSnapshot,
  resolvePersistedEnabledTabs,
  defaultRequiredTabs,
  defaultTabRegistry,
  lockedTabPredicate,
  defaultColumnRegistry,
  registrySyncFn,
  syncCustomTabs,
  prefsKeys,
  normalizePrefs,
  buildFieldConfigPayload,
  fieldConfigMutation,
  preferencesMutation,
  logSetupAudit,
  handleDeleteFieldWithGuard,
  keys,
}: ModuleSetupSaveActionsOptions<TSettings>) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const showPrefs = mode === "preferences";

  const isFieldsDirty = useMemo(() => {
    const persistedEnabled = resolvePersistedEnabledTabs(settings);
    return (
      fieldsSnapshot({
        fields: fieldsEditor.buildFieldsMap(),
        enabledTabs: fieldsEditor.enabledTabs,
        requiredTabs: fieldsEditor.requiredTabs,
        formTabs: fieldsEditor.formTabs,
      }) !==
      fieldsSnapshot({
        fields: settings.fields as Record<string, FieldDefinition[]> | undefined,
        enabledTabs: persistedEnabled,
        requiredTabs: settings.requiredTabs || defaultRequiredTabs,
        formTabs: settings.formTabs || defaultTabRegistry,
      })
    );
  }, [
    fieldsEditor,
    settings,
    fieldsSnapshot,
    resolvePersistedEnabledTabs,
    defaultRequiredTabs,
    defaultTabRegistry,
  ]);

  const isPrefsDirty = useMemo(() => {
    const draft = settingsDraft as unknown as Record<string, unknown>;
    const savedSettings = settings as unknown as Record<string, unknown>;
    return prefsKeys.some(
      (key) => JSON.stringify(draft[key]) !== JSON.stringify(savedSettings[key]),
    );
  }, [settings, settingsDraft, prefsKeys]);

  const isDirty = showPrefs ? isPrefsDirty : isFieldsDirty;

  const handleSave = useCallback(async (): Promise<void> => {
    if (!isDirty || saving) return;
    setSaving(true);
    try {
      if (showPrefs) {
        await preferencesMutation.mutateAsync(normalizePrefs(settingsDraft));
        safeAudit(
          logSetupAudit.mutateAsync({
            area: "preferences",
            summary: t(keys.auditSummary, { area: "preferences" }),
          }),
          keys.auditChannel,
        );
        notify.success(t(keys.preferencesSaved));
        setSaved(true);
        return;
      }

      const fieldsMap = fieldsEditor.buildFieldsMap();
      const enabledSet = new Set(
        [...fieldsEditor.enabledTabs].map((tab) => tab.toLowerCase()),
      );
      const updatedFormTabs = fieldsEditor.formTabs.map((tab) => ({
        ...tab,
        enabled: lockedTabPredicate(tab.key)
          ? true
          : enabledSet.has(tab.key.toLowerCase()),
      }));
      const syncedRegistry = registrySyncFn(
        settings.columnRegistry || defaultColumnRegistry,
        fieldsMap,
        fieldsEditor.enabledTabs,
      );

      const { formTabs: _formTabs, ...settingsWithoutFormTabs } = settings;
      await runModuleFieldsSetupSave({
        formTabs: updatedFormTabs,
        syncCustomTabs,
        persistFieldConfig: async () => {
          await fieldConfigMutation.mutateAsync(
            buildFieldConfigPayload({
              settingsWithoutFormTabs: settingsWithoutFormTabs as unknown as Record<string, unknown>,
              enabledTabs: Array.from(fieldsEditor.enabledTabs),
              requiredTabs: Array.from(fieldsEditor.requiredTabs).map((tab) => tab.toLowerCase()),
              fieldsMap,
              syncedRegistry,
            }),
          );
        },
        markDraftPristine: fieldsEditor.markDraftPristine,
        auditPromise: logSetupAudit.mutateAsync({
          area: "fields",
          summary: t(keys.auditSummary, { area: "fields" }),
        }),
        auditChannel: keys.auditChannel,
        t,
        successKey: keys.fieldsSaved,
        failureKey: keys.saveFailed,
        setSaved,
      });
    } catch {
      if (showPrefs) {
        setSaved(false);
        notify.error(t(keys.saveFailed));
      }
    } finally {
      setSaving(false);
    }
  }, [
    isDirty,
    saving,
    showPrefs,
    preferencesMutation,
    settingsDraft,
    fieldsEditor,
    settings,
    fieldConfigMutation,
    logSetupAudit,
    setSaved,
    t,
    normalizePrefs,
    keys,
    lockedTabPredicate,
    defaultColumnRegistry,
    registrySyncFn,
    syncCustomTabs,
    buildFieldConfigPayload,
  ]);

  return {
    saving,
    isDirty,
    isFieldsDirty,
    isPrefsDirty,
    handleSave,
    handleDeleteFieldWithGuard,
  };
}
