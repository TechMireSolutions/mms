import React, { useCallback, useEffect } from 'react';
import { Library } from 'lucide-react';
import {
  type QuestionBankSettings as QuestionBankSettingsData,
  type QuestionDifficultyRegistryEntry,
  type QuestionTypeRegistryEntry,
  type FieldDefinition,
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

function getOrderedFields(fields: FieldDefinition[], savedOrder: string[] | undefined): FieldDefinition[] {
  if (!savedOrder || savedOrder.length === 0) return fields;
  const map = Object.fromEntries(savedOrder.map((key, i) => [key, i]));
  return [...fields].sort((a, b) => (map[a.key] ?? 9999) - (map[b.key] ?? 9999)) as FieldDefinition[];
}

function syncOrder(prevOrder: string[], newFieldIds: string[]): string[] {
  const kept = prevOrder.filter((id) => newFieldIds.includes(id));
  const added = newFieldIds.filter((id) => !kept.includes(id));
  return [...kept, ...added];
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

  const { data, dirty, saving, upd, handleSave } = useSettingsDraft({
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
    const coreKeys = new Set(QUESTION_BANK_TAB_REGISTRY.map(t => t.key));
    const customTabs = (settings.formTabs || []).filter(t => !coreKeys.has(t.key));
    const updatedTabs = [
      ...QUESTION_BANK_TAB_REGISTRY,
      ...customTabs
    ].map(t => ({
      ...t,
      enabled: t.key === "basic" ? true : (settings.enabledTabs || ["basic"]).includes(t.key)
    }));

    fieldsEditor.resetAllState(
      updatedTabs,
      settings.fields || {},
      settings.enabledTabs || ["basic"],
      settings.requiredTabs || []
    );
  }, [settings]);

  const executeSave = () => {
    const updatedFormTabs = fieldsEditor.formTabs.map(t => ({
      ...t,
      enabled: fieldsEditor.enabledTabs.has(t.key)
    }));

    const nextData = {
      ...data,
      enabledTabs: Array.from(fieldsEditor.enabledTabs),
      requiredTabs: Array.from(fieldsEditor.requiredTabs),
      formTabs: updatedFormTabs,
      fields: fieldsEditor.buildFieldsMap(),
    };
    
    onSave(nextData);
  };

  const toggleQuestionType = (id: string): void => {
    const types = data.questionTypes ?? [];
    const updated = types.map((entry) =>
      entry.id === id ? { ...entry, enabled: !entry.enabled } : entry,
    );
    upd('questionTypes', updated);
  };

  const toggleDifficulty = (id: string): void => {
    const diffs = data.difficultyLevels ?? [];
    const updated = diffs.map((entry) =>
      entry.id === id ? { ...entry, enabled: !entry.enabled } : entry,
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
        <section className="space-y-4 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-2">
            <Library className="h-3.5 w-3.5 text-primary" aria-hidden />
            <h3 className="text-sm font-bold text-foreground">{t('questionBank.settingsPrefsTitle')}</h3>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{t('questionBank.aiGrading')}</p>
              <p className="text-xs text-muted-foreground">{t('questionBank.aiGradingDesc')}</p>
            </div>
            <Switch
              checked={data.aiGrading}
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
              value={data.defaultTestDuration}
              onChange={(e) => upd('defaultTestDuration', Number(e.target.value) || 30)}
            />
          </div>

          <CategoryManager
            categories={data.categories}
            onChange={(categories) => upd('categories', categories)}
          />

          <div className="space-y-2 border-t border-border/60 pt-3">
            <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {t('questionBank.typesTitle')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {(data.questionTypes ?? []).map((entry: QuestionTypeRegistryEntry) => (
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
              {(data.difficultyLevels ?? []).map((entry: QuestionDifficultyRegistryEntry) => (
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
        </section>
      )}

      {showFields && (
        <ModuleFieldsSetup
          editor={fieldsEditor}
          isCoreField={(tabId, key) => INITIAL_QUESTION_BANK_FIELD_SEED[tabId]?.some((f) => f.key === key) ?? false}
          onStateChange={() => executeSave()}
        />
      )}
    </SettingsPanel>
  );
}
