import {
  getFlatFieldsConfig,
  getSortedFields,
  type ModuleCustomField,
  type ModuleFieldDef,
} from "@mms/shared";

export interface StandardModuleConfigSettingsLike {
  fields?: Record<string, unknown>;
  customFields?: ModuleCustomField[] | unknown[];
  fieldOrder?: string[];
  formTabs?: unknown[];
  enabledTabs?: string[];
  requiredTabs?: string[];
}

export interface StandardModuleConfigCore<
  TSettings extends StandardModuleConfigSettingsLike,
> {
  settings: TSettings;
  orderedFields: ModuleFieldDef[];
  fields: Record<string, { enabled: boolean; required: boolean }>;
  customFields: ModuleCustomField[];
  updateSettings: (draft: TSettings) => void;
  updateSettingsAsync: (draft: TSettings) => Promise<void>;
  reloadConfig: () => void;
  mergeSettings: (draft: Partial<TSettings> | null | undefined) => TSettings;
  loadSettings: () => TSettings;
  isFieldEnabled: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
}

export interface CreateStandardModuleConfigHookOptions<
  TSettings extends StandardModuleConfigSettingsLike,
  TExtra extends Record<string, unknown>,
> {
  defaultSettings: TSettings;
  defaultFieldDefs: ModuleFieldDef[];
  customFieldsFrom?: (settings: TSettings) => ModuleCustomField[];
  orderedFieldsFrom?: (ctx: { fieldOrder: string[]; settings: TSettings }) => ModuleFieldDef[];
  lookupsFrom?: () => TExtra;
  useEnhance?: (core: StandardModuleConfigCore<TSettings>) => TExtra;
}

export function createStandardModuleConfigHook<
  TSettings extends StandardModuleConfigSettingsLike,
  TExtra extends Record<string, unknown> = Record<string, never>,
>(options: CreateStandardModuleConfigHookOptions<TSettings, TExtra>) {
  const {
    defaultSettings,
    defaultFieldDefs,
    customFieldsFrom,
    orderedFieldsFrom,
    lookupsFrom,
    useEnhance,
  } = options;

  return function useStandardModuleConfigHook() {
    const settings = defaultSettings;

    const mergeSettings = ((settingsDraft: Partial<TSettings> | null | undefined): TSettings => {
        return {
          ...defaultSettings,
          ...(settingsDraft ?? {}),
        };
      });

    const updateSettings = ((settingsDraft: TSettings) => {});
    const updateSettingsAsync = (async (settingsDraft: TSettings) => {});

    const fields = (() => getFlatFieldsConfig(settings.fields))();

    const customFields = (() =>
        customFieldsFrom
          ? customFieldsFrom(settings)
          : ((settings.customFields ?? []) as ModuleCustomField[]))() as ModuleCustomField[];

    const fieldOrder = (() => settings.fieldOrder ?? defaultSettings.fieldOrder ?? [])();

    const orderedFields = (() =>
        orderedFieldsFrom
          ? orderedFieldsFrom({ fieldOrder, settings })
          : getSortedFields(defaultFieldDefs, fieldOrder, fields, customFields))();

    const reloadConfig = (() => {});
    const loadSettings = (() => settings);

    const isFieldEnabled = ((fieldId: string): boolean => fields[fieldId]?.enabled !== false);

    const isFieldRequired = ((fieldId: string): boolean => !!fields[fieldId]?.required);

    const extra = lookupsFrom ? lookupsFrom() : ({} as TExtra);
    const core: StandardModuleConfigCore<TSettings> = {
      settings,
      orderedFields,
      fields,
      customFields,
      updateSettings,
      updateSettingsAsync,
      reloadConfig,
      mergeSettings,
      loadSettings,
      isFieldEnabled,
      isFieldRequired,
    };
    
    const enhanceForCore = useEnhance ?? (() => ({} as TExtra));
    const enhanced = enhanceForCore(core);

    return {
      ...core,
      ...extra,
      ...enhanced,
    };
  };
}
