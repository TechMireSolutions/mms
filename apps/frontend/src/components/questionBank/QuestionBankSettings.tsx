import React, { useCallback, useState, useEffect } from 'react';
import { Library, Info, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  type QuestionBankSettings as QuestionBankSettingsData,
  type QuestionDifficultyRegistryEntry,
  type QuestionTypeRegistryEntry,
  type FieldDefinition,
  QUESTION_BANK_TAB_REGISTRY,
  INITIAL_QUESTION_BANK_FIELD_SEED,
} from '@mms/shared';
import useTranslation from '@/hooks/useTranslation';
import { useSettingsDraft } from '@/hooks/useSettingsDraft';
import { useQuestionBankConfig } from '@/hooks/useQuestionBankConfig';
import { useModuleFieldsEditor } from '@/hooks/useModuleFieldsEditor';
import { notify } from '@/lib/notify';
import CustomFieldsBuilder, { type CustomFieldConfig } from '../ui/CustomFieldsBuilder';
import CoreFieldEditorList from '../ui/CoreFieldEditorList';
import SettingsFormActions from '../ui/SettingsFormActions';
import { Switch } from '../ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '../ui/checkbox';
import { SettingsCallout, SettingsPanel } from '@/components/ui/SettingsShell';
import CategoryManager from './CategoryManager';
import { FORM_INPUT, FORM_LABEL } from '@/components/ui/formStyles';
import Modal from '../ui/Modal';

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

export default function QuestionBankSettings({ mode }: QuestionBankSettingsProps): React.JSX.Element {
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

  const {
    formTabs,
    setFormTabs,
    tabFields,
    setTabFields,
    enabledTabs,
    setEnabledTabs,
    requiredTabs,
    setRequiredTabs,
    tabFieldEnabled,
    setTabFieldEnabled,
    tabFieldRequired,
    setTabFieldRequired,
    tabFieldUnique,
    setTabFieldUnique,
    tabFieldDefaultValues,
    setTabFieldDefaultValues,
    tabFieldPermissions,
    setTabFieldPermissions,
    tabFieldOrder,
    setTabFieldOrder,
    toggleTabEnabled,
    toggleTabRequired,
    toggleFieldEnabled,
    toggleFieldRequired,
    toggleFieldUnique,
    handleReorder,
    handleCustomFieldsChange,
    handleEditField,
    handleDeleteField,
    handleAddTab,
    handleDeleteTab,
    handleRenameTab,
    buildFieldsMap,
    resetAllState,
  } = useModuleFieldsEditor({
    initialTabs: QUESTION_BANK_TAB_REGISTRY,
    initialFields: settings.fields || {},
    initialEnabledTabs: Array.from(new Set(settings.enabledTabs || ['basic'])),
    initialRequiredTabs: Array.from(new Set(settings.requiredTabs || [])),
  });

  const [isAddTabModalOpen, setIsAddTabModalOpen] = useState(false);
  const [newTabLabel, setNewTabLabel] = useState('');
  const [renamingTabKey, setRenamingTabKey] = useState<string | null>(null);
  const [renameTabLabel, setRenameTabLabel] = useState('');

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

    resetAllState(
      updatedTabs,
      settings.fields || {},
      settings.enabledTabs || ["basic"],
      settings.requiredTabs || []
    );
  }, [settings]);

  const handleToggleTabEnabled = (id: string) => { toggleTabEnabled(id); upd('enabledTabs', Array.from(enabledTabs)); };
  const handleToggleTabRequired = (id: string) => { toggleTabRequired(id); upd('requiredTabs', Array.from(requiredTabs)); };
  const handleToggleFieldEnabled = (tabId: string, fieldId: string) => { toggleFieldEnabled(tabId, fieldId); };
  const handleToggleFieldRequired = (tabId: string, fieldId: string) => { toggleFieldRequired(tabId, fieldId); };
  const handleToggleFieldUnique = (tabId: string, fieldId: string) => { toggleFieldUnique(tabId, fieldId); };
  const handleReorderFields = (tabId: string, reorderedFields: FieldDefinition[]) => { handleReorder(tabId, reorderedFields); };

  const handleCustomFieldsChangeLocal = (tabId: string, newFields: CustomFieldConfig[]): void => {
    handleCustomFieldsChange(tabId, newFields);
  };

  const handleEditFieldLocal = (tabId: string, updatedField: FieldDefinition) => {
    handleEditField(tabId, updatedField);
  };

  const handleDeleteFieldLocal = (tabId: string, fieldId: string) => {
    handleDeleteField(tabId, fieldId);
  };

  const handleAddTabLocal = (label: string) => {
    handleAddTab(label);
  };

  const handleDeleteTabLocal = (key: string) => {
    handleDeleteTab(key);
  };

  const handleRenameTabLocal = (key: string, newLabel: string) => {
    handleRenameTab(key, newLabel);
  };

  const executeSave = () => {
    const updatedFormTabs = formTabs.map(t => ({
      ...t,
      enabled: enabledTabs.has(t.key)
    }));

    const nextData = {
      ...data,
      enabledTabs: Array.from(enabledTabs),
      requiredTabs: Array.from(requiredTabs),
      formTabs: updatedFormTabs,
      fields: buildFieldsMap(),
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
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-info/10 border border-info/30 text-sm text-info text-left">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-xs">Dynamic Fields Manager</h4>
              <p className="text-[11px] mt-0.5 text-info/90">
                Configure visible sections, reorder fields, and manage custom metadata definitions.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {formTabs.map((tab) => {
              const tabId = tab.key;
              const tabLabel = tab.label.charAt(0).toUpperCase() + tab.label.slice(1);
              const tabDesc = tab.description;
              const tabDefs = tabFields[tabId] || [];
              const enabledSet = tabFieldEnabled[tabId] || new Set();
              const requiredSet = tabFieldRequired[tabId] || new Set();
              const isOn = tabId === "basic" ? true : enabledTabs.has(tabId);
              const isReq = requiredTabs.has(tabId);

              return (
                <section key={tabId} className="rounded-xl border border-border bg-card overflow-hidden text-left">
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/30 border-b border-border">
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={isOn}
                        onCheckedChange={tabId !== "basic" ? () => handleToggleTabEnabled(tabId) : undefined}
                        aria-label={`Enable Tab ${tabLabel}`}
                        disabled={tabId === "basic"}
                      />
                    </div>
                    <div className="flex-1 min-w-0 ml-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{tabLabel}</span>
                        {!tab.isSystem && (
                          <div className="flex items-center gap-1.5 ml-2">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                setRenamingTabKey(tabId);
                                setRenameTabLabel(tab.label);
                              }}
                              className="p-1 h-6 w-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground shadow-none flex items-center justify-center"
                              title="Rename Tab"
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => handleDeleteTabLocal(tabId)}
                              className="p-1 h-6 w-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground shadow-none flex items-center justify-center"
                              title="Delete Tab"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{tabDesc}</p>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                      {tabDefs.filter((f) => enabledSet.has(f.key)).length}/{tabDefs.length}
                    </span>
                    {tabId !== "basic" && isOn && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleToggleTabRequired(tabId)}
                        className={`flex-shrink-0 px-2.5 py-1 h-auto text-[10px] font-bold border transition-all shadow-none ml-2
                          ${
                            isReq
                              ? 'bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20 hover:text-destructive'
                              : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        {isReq ? 'Required' : 'Optional'}
                      </Button>
                    )}
                  </div>

                  {isOn && (
                    <div className="p-3 space-y-3">
                      <CoreFieldEditorList
                        tabId={tabId}
                        fields={getOrderedFields(tabDefs, tabFieldOrder[tabId])}
                        enabledSet={enabledSet}
                        requiredSet={requiredSet}
                        onToggleEnabled={(fieldId: string) => handleToggleFieldEnabled(tabId, fieldId)}
                        onToggleRequired={(fieldId: string) => handleToggleFieldRequired(tabId, fieldId)}
                        onToggleUnique={(fieldId: string) => handleToggleFieldUnique(tabId, fieldId)}
                        onReorder={(reordered: FieldDefinition[]) => handleReorderFields(tabId, reordered)}
                        isUniqueField={(tid: string, fid: string) => tabFieldUnique[tid]?.has(fid) || false}
                        isCoreField={(key: string) => INITIAL_QUESTION_BANK_FIELD_SEED[tabId]?.some((f) => f.key === key) ?? false}
                        defaultValues={tabFieldDefaultValues[tabId]}
                        permissions={tabFieldPermissions[tabId]}
                        onChangeDefaults={(fieldId: string, val: unknown) => {
                          setTabFieldDefaultValues(prev => ({ ...prev, [tabId]: { ...prev[tabId], [fieldId]: val } }));
                        }}
                        onChangePermissions={(fieldId: string, roles: string[]) => {
                          setTabFieldPermissions(prev => ({ ...prev, [tabId]: { ...prev[tabId], [fieldId]: roles } }));
                        }}
                        onEditField={(f: FieldDefinition) => handleEditFieldLocal(tabId, f)}
                        onDeleteField={(id: string) => handleDeleteFieldLocal(tabId, id)}
                        labels={{
                          required: 'Required',
                          optional: 'Optional',
                          unique: 'Unique',
                          standard: 'Standard',
                        }}
                      />
                      <div className="border-t border-border pt-3">
                        <CustomFieldsBuilder
                          fields={(tabFields[tabId] || []).map(f => ({ ...f, id: f.key })) as unknown as CustomFieldConfig[]}
                          droppableId={`custom-fields-${tabId}`}
                          onChange={(f) => handleCustomFieldsChangeLocal(tabId, f)}
                        />
                      </div>
                    </div>
                  )}
                </section>
              );
            })}

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={() => setIsAddTabModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all shadow-none"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Tab</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={isAddTabModalOpen}
        onClose={() => {
          setIsAddTabModalOpen(false);
          setNewTabLabel('');
        }}
        title="Add Custom Tab"
        icon={Plus}
        footer={
          <div className="flex justify-end gap-2.5">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddTabModalOpen(false);
                setNewTabLabel('');
              }}
              type="button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleAddTabLocal(newTabLabel);
                setIsAddTabModalOpen(false);
                setNewTabLabel('');
              }}
              disabled={!newTabLabel.trim()}
              type="button"
            >
              Add Tab
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-left">
          <label htmlFor="newTabLabel" className="text-xs font-semibold text-foreground">Tab Name *</label>
          <Input
            id="newTabLabel"
            value={newTabLabel}
            onChange={(e) => setNewTabLabel(e.target.value)}
            placeholder="e.g. Extra Info"
            autoFocus
          />
        </div>
      </Modal>

      <Modal
        open={renamingTabKey !== null}
        onClose={() => {
          setRenamingTabKey(null);
          setRenameTabLabel('');
        }}
        title="Rename Custom Tab"
        icon={Pencil}
        footer={
          <div className="flex justify-end gap-2.5">
            <Button
              variant="outline"
              onClick={() => {
                setRenamingTabKey(null);
                setRenameTabLabel('');
              }}
              type="button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (renamingTabKey) {
                  handleRenameTabLocal(renamingTabKey, renameTabLabel);
                }
                setRenamingTabKey(null);
                setRenameTabLabel('');
              }}
              disabled={!renameTabLabel.trim()}
              type="button"
            >
              Rename Tab
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-left">
          <label htmlFor="renameTabLabel" className="text-xs font-semibold text-foreground">Tab Name *</label>
          <Input
            id="renameTabLabel"
            value={renameTabLabel}
            onChange={(e) => setRenameTabLabel(e.target.value)}
            placeholder="e.g. Custom Fields"
            autoFocus
          />
        </div>
      </Modal>
    </SettingsPanel>
  );
}
