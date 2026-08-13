type ModuleCustomField = any;
type TabDefinition = any;

export interface ModuleSettingsShape {
  fields?: Record<string, any>;
  customFields?: ModuleCustomField[] | any[];
  fieldOrder?: string[];
  formTabs?: TabDefinition[] | any[];
  enabledTabs?: string[];
  requiredTabs?: string[];
}

export interface UsersSettings {
  allowSelfRegistration: boolean;
  requireEmailVerification: boolean;
  fields?: Record<string, unknown>;
  customFields?: ModuleCustomField[];
  fieldOrder?: string[];
  formTabs?: TabDefinition[];
  enabledTabs?: string[];
  requiredTabs?: string[];
}

export function useModuleSettingsEditor<T extends ModuleSettingsShape>(
  config: { settings: T }
): { fieldsEditor: any } {
  return { fieldsEditor: null };
}

type UsersFieldsEditor = ReturnType<typeof useModuleSettingsEditor<UsersSettings>>["fieldsEditor"];
