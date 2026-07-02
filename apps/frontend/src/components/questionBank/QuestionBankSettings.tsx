import React, { useCallback, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Library } from 'lucide-react';
import {
  type QuestionBankSettings as QuestionBankSettingsData,
  type QuestionDifficultyRegistryEntry,
  type QuestionTypeRegistryEntry,
  QUESTION_BANK_TAB_REGISTRY,
  INITIAL_QUESTION_BANK_FIELD_SEED,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettingsDraft } from '@/hooks/useSettingsDraft';
import { useQuestionBankConfig } from '@/hooks/useQuestionBankConfig';
import { useModuleFieldsEditor } from '@/hooks/useModuleFieldsEditor';
import { notify } from '@/lib/notify';
import { SettingsFormActions } from '../ui/SettingsFormActions';
import { Switch } from '../ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SettingsCallout, SettingsPanel } from '@/components/ui/SettingsShell';
import { CategoryManager } from "./CategoryManager";
import { FORM_INPUT, FORM_LABEL } from '@/components/ui/formStyles';
import { ModuleFieldsSetup } from "../ui/ModuleFieldsSetup";

interface QuestionBankSettingsProps {
  mode?: 'fields' | 'preferences';
}

export function QuestionBankSettings({ mode }: QuestionBankSettingsProps): React.JSX.Element {
  const { t } = useTranslation();
  const { settings, updateSettings } = useQuestionBankConfig();

  const load = useCallback((): QuestionBankSettingsData => {
    return settings;
  }, [settings]);

  const onSave = useCallback(
    async (draft: QuestionBankSettingsData) => {
      updateSettings(draft);
      notify.success(t('questionBank.settingsSaved'), {
        description: t('questionBank.settingsSavedDesc'),
      });
    },
    [updateSettings, t],
  );

  const { data: questionBankSettings, dirty, saving, upd, handleSave } = useSettingsDraft({
    load,
    onPreview: () => {},
    onSave,
    syncOnDatabaseUpdate: true,
  });

  const showPrefs = mode === 'preferences';
  const showFields = mode === 'fields';

  const fieldsEditor = useModuleFieldsEditor({
    initialTabs: QUESTION_BANK_TAB_REGISTRY,
    initialFields: settings.fields || {},
    initialEnabledTabs: Array.from(new Set(settings.enabledTabs || ['basic'])),
    initialRequiredTabs: Array.from(new Set(settings.requiredTabs || [])),
  });

  useEffect(() => {
    if (!settings) return;
    const coreKeys = new Set(QUESTION_BANK_TAB_REGISTRY.map((tabDefinition) => tabDefinition.key));
    const customTabs = (settings.formTabs || []).filter((tabDefinition) => !coreKeys.has(tabDefinition.key));
    const updatedTabs = [
      ...QUESTION_BANK_TAB_REGISTRY,
      ...customTabs
    ].map((tabDefinition) => ({
      ...tabDefinition,
      enabled: tabDefinition.key === "basic" ? true : (settings.enabledTabs || ["basic"]).includes(tabDefinition.key)
    }));

    fieldsEditor.resetAllState(
      updatedTabs,
      settings.fields || {},
      settings.enabledTabs || ["basic"],
      settings.requiredTabs || []
    );
  }, [settings]);

  const executeSave = () => {
    const updatedFormTabs = fieldsEditor.formTabs.map((tabDefinition) => ({
      ...tabDefinition,
      enabled: fieldsEditor.enabledTabs.has(tabDefinition.key)
    }));

    const nextQuestionBankSettings = {
      ...questionBankSettings,
      enabledTabs: Array.from(fieldsEditor.enabledTabs),
      requiredTabs: Array.from(fieldsEditor.requiredTabs),
      formTabs: updatedFormTabs,
      fields: fieldsEditor.buildFieldsMap(),
    };
    
    onSave(nextQuestionBankSettings);
  };

  const toggleQuestionType = (questionTypeId: string): void => {
    const types = questionBankSettings.questionTypes ?? [];
    const updated = types.map((entry) =>
      entry.id === questionTypeId ? { ...entry, enabled: !entry.enabled } : entry,
    );
    upd('questionTypes', updated);
  };

  const toggleDifficulty = (difficultyId: string): void => {
    const diffs = questionBankSettings.difficultyLevels ?? [];
    const updated = diffs.map((entry) =>
      entry.id === difficultyId ? { ...entry, enabled: !entry.enabled } : entry,
    );
    upd('difficultyLevels', updated);
  };

  return (
    <SettingsPanel
      width="medium"
      introKey="questionBank.settingsIntro"
      isDirty={dirty}
      footer={
        <SettingsFormActions
          saveLabel={t('questionBank.settingsSave')}
          onSave={executeSave}
          dirty={dirty}
          saving={saving}
        />
      }
    >
      <SettingsCallout>{t('questionBank.settingsNote')}</SettingsCallout>

      {showPrefs && (
        <Card accentColor="primary" className="space-y-4 rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5 shadow-sm hover:shadow-md">
          <div className="flex items-center gap-2 border-b border-border/40 pb-2 pl-1">
            <Library className="h-3.5 w-3.5 text-primary" aria-hidden />
            <h3 className="text-sm font-bold text-foreground">{t('questionBank.settingsPrefsTitle')}</h3>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{t('questionBank.aiGrading')}</p>
              <p className="text-xs text-muted-foreground">{t('questionBank.aiGradingDesc')}</p>
            </div>
            <Switch
              checked={questionBankSettings.aiGrading}
              onCheckedChange={(v) => upd('aiGrading', v)}
              aria-label={t('questionBank.aiGrading')}
            />
          </div>

          <div>
            <label className={FORM_LABEL} htmlFor="qb-default-duration">
              {t('questionBank.defaultDuration')}
            </label>
            <Input
              id="qb-default-duration"
              type="number"
              min={5}
              className={FORM_INPUT}
              value={questionBankSettings.defaultTestDuration}
              onChange={(event) => upd('defaultTestDuration', Number(event.target.value) || 30)}
            />
          </div>

          <CategoryManager
            categories={questionBankSettings.categories}
            onChange={(categories) => upd('categories', categories)}
          />

          <div className="space-y-2 border-t border-border/60 pt-3">
            <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {t('questionBank.typesTitle')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {(questionBankSettings.questionTypes ?? []).map((entry: QuestionTypeRegistryEntry) => (
                <Button
                  key={entry.id}
                  type="button"
                  variant="outline"
                  onClick={() => toggleQuestionType(entry.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors h-auto ${entry.enabled ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                >
                  {t(`questionBank.type.${entry.id}` as any)}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {t('questionBank.difficultiesTitle')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {(questionBankSettings.difficultyLevels ?? []).map((entry: QuestionDifficultyRegistryEntry) => (
                <Button
                  key={entry.id}
                  type="button"
                  variant="outline"
                  onClick={() => toggleDifficulty(entry.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors h-auto ${entry.enabled ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                >
                  {t(`questionBank.difficulty.${entry.id}` as any)}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {showFields && (
        <ModuleFieldsSetup
          editor={fieldsEditor}
          isCoreField={(tabId, key) => INITIAL_QUESTION_BANK_FIELD_SEED[tabId]?.some((field) => field.key === key) ?? false}
          onStateChange={() => executeSave()}
        />
      )}
    </SettingsPanel>
  );
}
