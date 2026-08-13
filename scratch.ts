export function useQuestionBankBaseConfig() {
  const registry = STANDARD_MODULES_CONFIG_REGISTRY['question-bank'];
  const queryClient = useQueryClient();
  const { data: settings, updateAsync: updateSettingsAsync } = useComposedQuestionBankSettings();

  const defaultSettings = registry.defaultSettings as QuestionBankSettings;
  const defaultFieldDefs = registry.defaultFieldDefs as unknown as ModuleFieldDef[];

  const updateSettings = useCallback(
    (settingsDraft: QuestionBankSettings) => {
      // fire and forget mutation
      updateSettingsAsync(settingsDraft).catch(console.error);
    },
    [updateSettingsAsync],
  );

  const fields = useMemo(() => getFlatFieldsConfig(settings.fields), [settings.fields]);
  const customFields = useMemo(
    () => (settings.customFields || []) as ModuleCustomField[],
    [settings.customFields],
  );
  const fieldOrder = useMemo(
    () => settings.fieldOrder ?? defaultSettings.fieldOrder ?? [],
    [settings.fieldOrder, defaultSettings.fieldOrder],
  );

  const orderedFields = useMemo(
    () => getSortedFields(defaultFieldDefs, fieldOrder, fields, customFields),
    [defaultFieldDefs, fieldOrder, fields, customFields],
  );

  const isFieldEnabled = useCallback(
    (fieldId: string): boolean => fields[fieldId]?.enabled !== false,
    [fields],
  );

  const isFieldRequired = useCallback(
    (fieldId: string): boolean => !!fields[fieldId]?.required,
    [fields],
  );

  return {
    settings,
    orderedFields,
    fields,
    customFields,
    updateSettings,
    updateSettingsAsync,
    isFieldEnabled,
    isFieldRequired,
  };
}
