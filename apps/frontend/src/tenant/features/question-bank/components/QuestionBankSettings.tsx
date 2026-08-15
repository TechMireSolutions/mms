import React, { useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Library } from 'lucide-react';
import {
  type QuestionBankSettings as QuestionBankSettingsData,
  type QuestionDifficultyRegistryEntry,
  type QuestionTypeRegistryEntry,
  type AppTranslationKey,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettingsDraft } from '@/tenant/features/settings/hooks/useSettingsDraft';
import { useQuestionBankConfig } from '@/tenant/features/question-bank/hooks/useQuestionBankConfig';
import { notify } from '@/lib/notify';
import { SettingsFormActions } from '@/components/ui/SettingsFormActions';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { SettingsCallout, SettingsPanel } from '@/components/ui/SettingsShell';
import { CategoryManager } from "@/tenant/features/question-bank/components/CategoryManager";
import { FORM_INPUT, FORM_LABEL } from '@/components/ui/formStyles';

export function QuestionBankSettings(): React.JSX.Element {
  const { t } = useTranslation();
  const { settings, updateSettingsAsync } = useQuestionBankConfig();

  const load = useCallback((): QuestionBankSettingsData => {
    return settings;
  }, [settings]);

  const onSave = useCallback(
    async (draft: QuestionBankSettingsData) => {
      await updateSettingsAsync(draft);
      notify.success(t('questionBank.settingsSaved'), {
        description: t('questionBank.settingsSavedDesc'),
      });
    },
    [updateSettingsAsync, t],
  );

  const { data: questionBankSettings, dirty, saving, upd, handleSave } = useSettingsDraft({
    load,
    onPreview: () => {},
    onSave,
    syncOnDatabaseUpdate: true,
  });

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
          onSave={handleSave}
          dirty={dirty}
          saving={saving}
        />
      }
    >
      <SettingsCallout>{t('questionBank.settingsNote')}</SettingsCallout>

      <Card accentColor="primary" className="space-y-4 p-5">
        <div className="flex items-center gap-2 border-b border-border/40 pb-2 ps-1">
          <Library className="h-3.5 w-3.5 text-primary" aria-hidden />
          <h3 className="text-sm font-bold text-foreground">{t('questionBank.settingsPrefsTitle')}</h3>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
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
          <SectionLabel as="h4" weight="bold" tracking="wide">
            {t('questionBank.typesTitle')}
          </SectionLabel>
          <div className="flex flex-wrap gap-2">
            {(questionBankSettings.questionTypes ?? []).map((entry: QuestionTypeRegistryEntry) => (
              <Button
                key={entry.id}
                type="button"
                variant="outline"
                onClick={() => toggleQuestionType(entry.id)}
                className={`rounded-full border px-3 text-xs font-semibold transition-colors min-h-11 ${entry.enabled ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
              >
                {t(`questionBank.type.${entry.id}` as AppTranslationKey)}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <SectionLabel as="h4" weight="bold" tracking="wide">
            {t('questionBank.difficultiesTitle')}
          </SectionLabel>
          <div className="flex flex-wrap gap-2">
            {(questionBankSettings.difficultyLevels ?? []).map((entry: QuestionDifficultyRegistryEntry) => (
              <Button
                key={entry.id}
                type="button"
                variant="outline"
                onClick={() => toggleDifficulty(entry.id)}
                className={`rounded-full border px-3 text-xs font-semibold transition-colors min-h-11 ${entry.enabled ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
              >
                {t(`questionBank.difficulty.${entry.id}` as AppTranslationKey)}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </SettingsPanel>
  );
}

