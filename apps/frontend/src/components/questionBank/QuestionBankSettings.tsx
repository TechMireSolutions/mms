import React, { useCallback, useMemo, useState } from 'react';
import { Library } from 'lucide-react';
import {
  DEFAULT_QUESTION_BANK_FIELD_DEFS,
  DEFAULT_QUESTION_BANK_SETTINGS,
  QUESTION_BANK_FIELD_LABEL_KEYS,
  getQuestionBankFieldFormTab,
  getSortedFields,
  mergeQuestionBankFieldOrder,
  normalizeQuestionBankSettings,
  type ModuleCustomField,
  type ModuleFieldDef,
  type QuestionBankFormTabId,
  type QuestionBankSettings as QuestionBankSettingsData,
  type QuestionDifficultyRegistryEntry,
  type QuestionTypeRegistryEntry,
} from '@mms/shared';
import type { AppTranslationKey } from '@mms/shared';
import useTranslation from '@/hooks/useTranslation';
import { useSettingsDraft } from '@/hooks/useSettingsDraft';
import { getObject, saveObject } from '@/lib/db';
import { notify } from '@/lib/notify';
import CustomFieldsBuilder, { type CustomFieldConfig } from '../ui/CustomFieldsBuilder';
import DraggableFieldList from '../ui/DraggableFieldList';
import SubTabBar, { type SubTab } from '@/components/ui/SubTabBar';
import SettingsFormActions from '../ui/SettingsFormActions';
import { Switch } from '../ui/switch';
import { SettingsCallout, SettingsPanel } from '@/components/settings/SettingsShared';
import CategoryManager from './CategoryManager';

interface QuestionBankSettingsProps {
  mode?: 'fields' | 'preferences';
}

export default function QuestionBankSettings({ mode }: QuestionBankSettingsProps): React.JSX.Element {
  const { t } = useTranslation();
  const [activeFieldTab, setActiveFieldTab] = useState<QuestionBankFormTabId>('categories');

  const load = useCallback((): QuestionBankSettingsData => {
    return normalizeQuestionBankSettings(
      getObject<QuestionBankSettingsData>('question_bank_settings', DEFAULT_QUESTION_BANK_SETTINGS),
    );
  }, []);

  const onSave = useCallback(
    async (draft: QuestionBankSettingsData) => {
      saveObject('question_bank_settings', normalizeQuestionBankSettings(draft));
      notify.success(t('questionBank.settingsSaved'), {
        description: t('questionBank.settingsSavedDesc'),
      });
    },
    [t],
  );

  const { data, dirty, saving, upd, handleSave, resetDraft } = useSettingsDraft({
    load,
    onPreview: () => {},
    onSave,
    syncOnDatabaseUpdate: true,
  });

  const showPrefs = !mode || mode === 'preferences';
  const showFields = !mode || mode === 'fields';

  const fields = data.fields || DEFAULT_QUESTION_BANK_SETTINGS.fields || {};
  const customFields = data.customFields || [];
  const fieldOrder = data.fieldOrder || DEFAULT_QUESTION_BANK_SETTINGS.fieldOrder || [];
  const orderedFields = getSortedFields(
    DEFAULT_QUESTION_BANK_FIELD_DEFS,
    fieldOrder,
    fields,
    customFields,
  );

  const localizedFields = useMemo(
    () =>
      orderedFields.map((field) => {
        const key = QUESTION_BANK_FIELD_LABEL_KEYS[field.id] as AppTranslationKey | undefined;
        return { ...field, label: key ? t(key) : field.label };
      }),
    [orderedFields, t],
  );

  const fieldsByTab = useMemo(() => {
    const buckets: Record<QuestionBankFormTabId, ModuleFieldDef[]> = {
      categories: [],
      question: [],
      sources: [],
    };
    for (const field of localizedFields) {
      buckets[getQuestionBankFieldFormTab(field.id)].push(field);
    }
    return buckets;
  }, [localizedFields]);

  const fieldTabs = useMemo(
    (): SubTab<QuestionBankFormTabId>[] => [
      {
        key: 'categories',
        label: t('questionBank.formTab.categories'),
        description: t('questionBank.formTab.categoriesHint'),
      },
      {
        key: 'question',
        label: t('questionBank.formTab.question'),
        description: t('questionBank.formTab.questionHint'),
      },
      {
        key: 'sources',
        label: t('questionBank.formTab.sources'),
        description: t('questionBank.formTab.sourceHint'),
      },
    ],
    [t],
  );

  const updateFieldConfig = (fieldKey: string, prop: 'enabled' | 'required', value: boolean): void => {
    const fieldObj = fields[fieldKey] || { enabled: true, required: false };
    const updatedFieldObj = { ...fieldObj, [prop]: value };
    if (prop === 'enabled' && !value) {
      updatedFieldObj.required = false;
    }
    upd('fields', { ...fields, [fieldKey]: updatedFieldObj });
  };

  const handleToggleEnabled = (id: string): void => {
    if (DEFAULT_QUESTION_BANK_FIELD_DEFS.some((f) => f.id === id)) {
      const cfg = fields[id] || { enabled: true, required: false };
      updateFieldConfig(id, 'enabled', !cfg.enabled);
    }
  };

  const handleToggleRequired = (id: string): void => {
    if (DEFAULT_QUESTION_BANK_FIELD_DEFS.some((f) => f.id === id)) {
      const cfg = fields[id] || { enabled: true, required: false };
      updateFieldConfig(id, 'required', !cfg.required);
    } else {
      const updated = customFields.map((f) => (f.id === id ? { ...f, required: !f.required } : f));
      upd('customFields', updated);
    }
  };

  const handleReorderTab = (tabId: QuestionBankFormTabId) => (reordered: ModuleFieldDef[]): void => {
    upd(
      'fieldOrder',
      mergeQuestionBankFieldOrder(fieldOrder, tabId, reordered.map((f) => f.id)),
    );
  };

  const handleCustomFieldsChange = (newFields: CustomFieldConfig[]): void => {
    const coreIds = DEFAULT_QUESTION_BANK_FIELD_DEFS.map((f) => f.id);
    const newIds = newFields.map((f) => f.key);
    const kept = fieldOrder.filter((id) => coreIds.includes(id) || newIds.includes(id));
    const added = newIds.filter((id) => !kept.includes(id));
    upd('customFields', newFields.map((f) => ({ ...f, id: f.key })) as unknown as ModuleCustomField[]);
    upd('fieldOrder', [...kept, ...added]);
  };

  const toggleQuestionType = (id: string): void => {
    upd(
      'questionTypes',
      (data.questionTypes ?? []).map((entry) =>
        entry.id === id ? { ...entry, enabled: !entry.enabled } : entry,
      ),
    );
  };

  const toggleDifficulty = (id: string): void => {
    upd(
      'difficultyLevels',
      (data.difficultyLevels ?? []).map((entry) =>
        entry.id === id ? { ...entry, enabled: !entry.enabled } : entry,
      ),
    );
  };

  const enabledSet = new Set(
    Object.entries(fields)
      .filter(([, cfg]) => cfg.enabled)
      .map(([id]) => id),
  );
  const requiredSet = new Set(
    Object.entries(fields)
      .filter(([, cfg]) => cfg.required)
      .map(([id]) => id),
  );

  return (
    <SettingsPanel
      width="medium"
      introKey="questionBank.settingsIntro"
      isDirty={dirty}
      footer={
        <SettingsFormActions
          resetLabel={t('questionBank.settingsReset')}
          saveLabel={t('questionBank.settingsSave')}
          onReset={() => {
            saveObject('question_bank_settings', normalizeQuestionBankSettings(DEFAULT_QUESTION_BANK_SETTINGS));
            resetDraft();
            notify.success(t('questionBank.settingsResetToast'));
          }}
          onSave={() => void handleSave()}
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
            <label className="mb-1 block text-xs font-semibold text-foreground" htmlFor="qb-default-duration">
              {t('questionBank.defaultDuration')}
            </label>
            <input
              id="qb-default-duration"
              type="number"
              min={5}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
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
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => toggleQuestionType(entry.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${entry.enabled ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
                >
                  {t(`questionBank.type.${entry.id}` as 'questionBank.type.mcq')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {t('questionBank.difficultiesTitle')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {(data.difficultyLevels ?? []).map((entry: QuestionDifficultyRegistryEntry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => toggleDifficulty(entry.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${entry.enabled ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
                >
                  {t(`questionBank.difficulty.${entry.id}` as 'questionBank.difficulty.easy')}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {showFields && (
        <section className="space-y-4 rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-bold text-foreground">{t('questionBank.settingsFieldsTitle')}</h3>
          <SubTabBar
            tabs={fieldTabs}
            value={activeFieldTab}
            onChange={setActiveFieldTab}
            panelIdPrefix="question-bank-settings-fields"
            className="mb-2"
          />

          {activeFieldTab === 'categories' && (
            <div className="space-y-4">
              {fields.categoryId?.enabled !== false ? (
                <div className="space-y-2 rounded-lg border border-border/70 bg-muted/10 p-3">
                  <p className="text-xs text-muted-foreground">{t('questionBank.categoriesFieldsHint')}</p>
                  <CategoryManager
                    categories={data.categories}
                    onChange={(categories) => upd('categories', categories)}
                  />
                </div>
              ) : null}
              <DraggableFieldList
                tabId="question-bank-fields-categories"
                fields={fieldsByTab.categories}
                enabledSet={enabledSet}
                requiredSet={requiredSet}
                onToggleEnabled={handleToggleEnabled}
                onToggleRequired={handleToggleRequired}
                onReorder={handleReorderTab('categories')}
              />
            </div>
          )}

          {activeFieldTab === 'question' && (
            <div className="space-y-4">
              <DraggableFieldList
                tabId="question-bank-fields-question"
                fields={fieldsByTab.question}
                enabledSet={enabledSet}
                requiredSet={requiredSet}
                onToggleEnabled={handleToggleEnabled}
                onToggleRequired={handleToggleRequired}
                onReorder={handleReorderTab('question')}
              />
              <CustomFieldsBuilder
                fields={customFields as unknown as CustomFieldConfig[]}
                droppableId="custom-fields-question-bank"
                onChange={handleCustomFieldsChange}
              />
            </div>
          )}

          {activeFieldTab === 'sources' && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">{t('questionBank.sourceFieldsHint')}</p>
              <DraggableFieldList
                tabId="question-bank-fields-sources"
                fields={fieldsByTab.sources}
                enabledSet={enabledSet}
                requiredSet={requiredSet}
                onToggleEnabled={handleToggleEnabled}
                onToggleRequired={handleToggleRequired}
                onReorder={handleReorderTab('sources')}
              />
            </div>
          )}
        </section>
      )}
    </SettingsPanel>
  );
}
