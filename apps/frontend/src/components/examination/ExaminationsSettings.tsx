import React, { useState, useEffect } from "react";
import { Save, FileText, Info, Plus, Pencil, Trash2 } from "lucide-react";
import {
  type ExaminationsSettings as ExaminationsSettingsData,
  EXAMINATIONS_TAB_REGISTRY,
  INITIAL_EXAMINATIONS_FIELD_SEED,
  type TabDefinition,
  type FieldDefinition,
} from "@mms/shared";
import { useExaminationConfig } from "@/hooks/useExaminationConfig";
import { CustomFieldsBuilder, CustomFieldConfig } from "../ui/CustomFieldsBuilder";
import { CoreFieldEditorList } from "../ui/CoreFieldEditorList";
import { useModuleFieldsEditor } from "../../hooks/useModuleFieldsEditor";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { Switch } from "../ui/switch";
import { Checkbox } from "../ui/checkbox";
import { Modal } from "../ui/Modal";

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function Toggle({ label, description, value, onChange }: ToggleProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between py-1 text-left">
      <div>
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      </div>
      <Switch
        checked={value}
        onCheckedChange={onChange}
        aria-label={`${label}: ${description || ""}`}
      />
    </div>
  );
}

interface ExaminationsSettingsProps {
  mode?: "fields" | "preferences";
}

function getOrderedFields(fields: FieldDefinition[], savedOrder: string[] | undefined): FieldDefinition[] {
  if (!savedOrder || savedOrder.length === 0) return fields;
  const orderByFieldKey = Object.fromEntries(savedOrder.map((key, index) => [key, index]));
  return [...fields].sort((firstField, secondField) => (orderByFieldKey[firstField.key] ?? 9999) - (orderByFieldKey[secondField.key] ?? 9999)) as FieldDefinition[];
}

function syncOrder(prevOrder: string[], newFieldIds: string[]): string[] {
  const kept = prevOrder.filter((id) => newFieldIds.includes(id));
  const added = newFieldIds.filter((id) => !kept.includes(id));
  return [...kept, ...added];
}

export function ExaminationsSettings({ mode }: ExaminationsSettingsProps): React.ReactElement {
  const { settings, updateSettings } = useExaminationConfig();
  const [saved, setSaved] = useState<boolean>(false);

  // Prefs state
  const [passMark, setPassMark] = useState(settings.passMark);
  const [maxMark, setMaxMark] = useState(settings.maxMark);
  const [gradingSystem, setGradingSystem] = useState(settings.gradingSystem);
  const [showRankings, setShowRankings] = useState(settings.showRankings);
  const [allowRetake, setAllowRetake] = useState(settings.allowRetake);
  const [autoPublishResults, setAutoPublishResults] = useState(settings.autoPublishResults);
  const [notifyOnResult, setNotifyOnResult] = useState(settings.notifyOnResult);
  const [certificateTemplate, setCertificateTemplate] = useState(settings.certificateTemplate);
  const [aiGrading, setAiGrading] = useState(settings.aiGrading);
  const [distinguishHonours, setDistinguishHonours] = useState(settings.distinguishHonours);
  const [examReminders, setExamReminders] = useState(settings.examReminders);
  const [defaultViewLayout, setDefaultViewLayout] = useState(settings.defaultViewLayout);

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
  } = useModuleFieldsEditor({
    initialTabs: EXAMINATIONS_TAB_REGISTRY,
    initialFields: settings.fields || {},
    initialEnabledTabs: Array.from(new Set(settings.enabledTabs || ["basic"])),
    initialRequiredTabs: Array.from(new Set(settings.requiredTabs || [])),
  });

  const [isAddTabModalOpen, setIsAddTabModalOpen] = useState(false);
  const [newTabLabel, setNewTabLabel] = useState("");
  const [renamingTabKey, setRenamingTabKey] = useState<string | null>(null);
  const [renameTabLabel, setRenameTabLabel] = useState("");

  useEffect(() => {
    if (!settings) return;
    setPassMark(settings.passMark);
    setMaxMark(settings.maxMark);
    setGradingSystem(settings.gradingSystem);
    setShowRankings(settings.showRankings);
    setAllowRetake(settings.allowRetake);
    setAutoPublishResults(settings.autoPublishResults);
    setNotifyOnResult(settings.notifyOnResult);
    setCertificateTemplate(settings.certificateTemplate);
    setAiGrading(settings.aiGrading);
    setDistinguishHonours(settings.distinguishHonours);
    setExamReminders(settings.examReminders);
    setDefaultViewLayout(settings.defaultViewLayout);

    setEnabledTabs(new Set(settings.enabledTabs || ["basic"]));
    setRequiredTabs(new Set(settings.requiredTabs || []));

    const coreTabKeys = new Set(EXAMINATIONS_TAB_REGISTRY.map((tabDefinition: any) => tabDefinition.key));
    const customTabs = (settings.formTabs || []).filter((tabDefinition: any) => !coreTabKeys.has(tabDefinition.key));
    setFormTabs([
      ...EXAMINATIONS_TAB_REGISTRY,
      ...customTabs
    ].map((tabDefinition: any) => ({
      ...tabDefinition,
      enabled: tabDefinition.key === "basic" ? true : (settings.enabledTabs || ["basic"]).includes(tabDefinition.key)
    })));

    const newTabIds = Array.from(new Set([
      ...EXAMINATIONS_TAB_REGISTRY.map((tabDefinition: any) => tabDefinition.key),
      ...(settings.formTabs || []).map((tabDefinition: any) => tabDefinition.key)
    ]));
    const currentFields = settings.fields || {};
    setTabFields(Object.fromEntries(newTabIds.map((tabId) => [tabId, currentFields[tabId] || []])));
    setTabFieldEnabled(Object.fromEntries(newTabIds.map((tabId) => [tabId, new Set((currentFields[tabId] || []).filter((field: any) => field.enabled).map((field: any) => field.key))])));
    setTabFieldRequired(Object.fromEntries(newTabIds.map((tabId) => [tabId, new Set((currentFields[tabId] || []).filter((field: any) => field.required).map((field: any) => field.key))])));
    setTabFieldUnique(Object.fromEntries(newTabIds.map((tabId) => [tabId, new Set((currentFields[tabId] || []).filter((field: any) => field.unique).map((field: any) => field.key))])));
    setTabFieldDefaultValues(Object.fromEntries(newTabIds.map((tabId) => [
      tabId,
      Object.fromEntries((currentFields[tabId] || []).filter((field: any) => field.defaultValue !== undefined).map((field: any) => [field.key, field.defaultValue]))
    ])));
    setTabFieldPermissions(Object.fromEntries(newTabIds.map((tabId) => [
      tabId,
      Object.fromEntries((currentFields[tabId] || []).filter((field: any) => field.permissions).map((field: any) => [field.key, field.permissions as string[]]))
    ])));
    setTabFieldOrder(Object.fromEntries(newTabIds.map((tabId) => [tabId, (currentFields[tabId] || []).map((field: any) => field.key)])));
  }, [settings]);

  const handleToggleTabEnabled = (id: string) => { toggleTabEnabled(id); setSaved(false); };
  const handleToggleTabRequired = (id: string) => { toggleTabRequired(id); setSaved(false); };
  const handleToggleFieldEnabled = (tabId: string, fieldId: string) => { toggleFieldEnabled(tabId, fieldId); setSaved(false); };
  const handleToggleFieldRequired = (tabId: string, fieldId: string) => { toggleFieldRequired(tabId, fieldId); setSaved(false); };
  const handleToggleFieldUnique = (tabId: string, fieldId: string) => { toggleFieldUnique(tabId, fieldId); setSaved(false); };
  const handleReorderFields = (tabId: string, reorderedFields: FieldDefinition[]) => { handleReorder(tabId, reorderedFields); setSaved(false); };

  const handleCustomFieldsChange = (tabId: string, newFields: CustomFieldConfig[]): void => {
    const newKeys = newFields.map((field) => field.key);
    setTabFieldOrder((previousOrder) => ({
      ...previousOrder,
      [tabId]: syncOrder(previousOrder[tabId] || [], newKeys),
    }));
    setTabFields((previousFields) => ({ ...previousFields, [tabId]: newFields as unknown as FieldDefinition[] }));
    setSaved(false);
  };

  const handleEditField = (tabId: string, updatedField: FieldDefinition) => {
    setTabFields((previousFields) => ({
      ...previousFields,
      [tabId]: (previousFields[tabId] || []).map((field) => field.key === updatedField.key ? updatedField : field)
    }));
    setSaved(false);
  };

  const handleDeleteField = async (tabId: string, fieldId: string) => {
    setTabFields((previousFields) => ({
      ...previousFields,
      [tabId]: (previousFields[tabId] || []).filter((field) => field.key !== fieldId)
    }));
    setTabFieldOrder((previousOrder) => ({
      ...previousOrder,
      [tabId]: (previousOrder[tabId] || []).filter((currentFieldId) => currentFieldId !== fieldId)
    }));
    setSaved(false);
  };

  const handleAddTab = (label: string) => {
    if (!label.trim()) return;
    const key = `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
    const newTab: TabDefinition = {
      key,
      label: label.trim(),
      description: "Custom user-defined tab",
      enabled: true,
      order: formTabs.length,
      isSystem: false,
    };

    setFormTabs((previousTabs) => [...previousTabs, newTab]);
    setEnabledTabs((previousTabs) => {
      const nextTabs = new Set(previousTabs);
      nextTabs.add(key);
      return nextTabs;
    });

    setTabFields((previousFields) => ({ ...previousFields, [key]: [] }));
    setTabFieldEnabled((previousEnabled) => ({ ...previousEnabled, [key]: new Set() }));
    setTabFieldRequired((previousRequired) => ({ ...previousRequired, [key]: new Set() }));
    setTabFieldUnique((previousUnique) => ({ ...previousUnique, [key]: new Set() }));
    setTabFieldDefaultValues((previousValues) => ({ ...previousValues, [key]: {} }));
    setTabFieldPermissions((previousPermissions) => ({ ...previousPermissions, [key]: {} }));
    setTabFieldOrder((previousOrder) => ({ ...previousOrder, [key]: [] }));
    setSaved(false);
  };

  const handleDeleteTab = (key: string) => {
    setFormTabs((previousTabs) => previousTabs.filter((tabDefinition) => tabDefinition.key !== key));
    setEnabledTabs((previousTabs) => {
      const nextTabs = new Set(previousTabs);
      nextTabs.delete(key);
      return nextTabs;
    });
    setRequiredTabs((previousTabs) => {
      const nextTabs = new Set(previousTabs);
      nextTabs.delete(key);
      return nextTabs;
    });
    setSaved(false);
  };

  const handleRenameTab = (key: string, newLabel: string) => {
    if (!newLabel.trim()) return;
    setFormTabs((previousTabs) => previousTabs.map((tabDefinition) => tabDefinition.key === key ? { ...tabDefinition, label: newLabel.trim() } : tabDefinition));
    setSaved(false);
  };

  const buildFieldsMap = (): Record<string, FieldDefinition[]> => {
    const nextFields: Record<string, FieldDefinition[]> = {};
    formTabs.forEach((tab) => {
      const tabId = tab.key;
      const combined = (tabFields[tabId] || []).map((field) => {
        const fieldKey = field.key || (field as { id?: string }).id || "";
        const enabled      = tabFieldEnabled[tabId]?.has(fieldKey)  ?? field.enabled  ?? false;
        const required     = tabFieldRequired[tabId]?.has(fieldKey) ?? field.required ?? false;
        const unique       = tabFieldUnique[tabId]?.has(fieldKey)   ?? field.unique   ?? false;
        const orderArray   = tabFieldOrder[tabId] || [];
        const orderIndex   = orderArray.indexOf(fieldKey);
        const order        = orderIndex >= 0 ? orderIndex : (field.order ?? 999);
        const defaultValue = tabFieldDefaultValues[tabId]?.[fieldKey] ?? field.defaultValue;
        const permissions  = tabFieldPermissions[tabId]?.[fieldKey]  ?? field.permissions;

        return {
          ...field,
          key: fieldKey,
          enabled,
          required,
          unique,
          order,
          defaultValue,
          permissions,
        } as FieldDefinition;
      });

      nextFields[tabId] = combined.sort((firstField, secondField) => (firstField.order ?? 999) - (secondField.order ?? 999));
    });
    return nextFields;
  };

  const handleSave = () => {
    const updatedFormTabs = formTabs.map((tabDefinition) => ({
      ...tabDefinition,
      enabled: enabledTabs.has(tabDefinition.key)
    }));

    const nextSettings: ExaminationsSettingsData = {
      ...settings,
      passMark,
      maxMark,
      gradingSystem,
      showRankings,
      allowRetake,
      autoPublishResults,
      notifyOnResult,
      certificateTemplate,
      aiGrading,
      distinguishHonours,
      examReminders,
      defaultViewLayout,
      enabledTabs: Array.from(enabledTabs),
      requiredTabs: Array.from(requiredTabs),
      formTabs: updatedFormTabs,
      fields: buildFieldsMap(),
    };

    updateSettings(nextSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const showPrefs = mode === "preferences";
  const showFields = mode === "fields";

  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-4" aria-labelledby="exams-settings-title">
      <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
        </div>
        <h3 id="exams-settings-title" className="text-[13px] font-bold text-foreground">Examinations Module Settings</h3>
      </div>

      {showPrefs && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="exams-grading-system" className={FORM_LABEL}>Grading System</label>
              <FormSelect
                id="exams-grading-system"
                value={gradingSystem}
                onChange={(value) => { setGradingSystem(value); setSaved(false); }}
                options={[
                  { value: "percentage", label: "Percentage (%)" },
                  { value: "letter", label: "Letter Grade (A, B, C...)" },
                  { value: "gpa", label: "GPA (4.0 Scale)" },
                ]}
              />
            </div>
            <div>
              <label htmlFor="exams-cert-template" className={FORM_LABEL}>Certificate Template</label>
              <FormSelect
                id="exams-cert-template"
                value={certificateTemplate}
                onChange={(value) => { setCertificateTemplate(value); setSaved(false); }}
                options={[
                  { value: "default", label: "Standard Classical" },
                  { value: "modern", label: "Modern Clean" },
                  { value: "minimal", label: "Minimalist Document" },
                ]}
              />
            </div>
            <div>
              <label htmlFor="exams-pass-mark" className={FORM_LABEL}>Pass Mark</label>
              <Input
                id="exams-pass-mark"
                className={FORM_INPUT}
                value={passMark}
                onChange={(event) => { setPassMark(event.target.value); setSaved(false); }}
              />
            </div>
            <div>
              <label htmlFor="exams-max-mark" className={FORM_LABEL}>Max Mark</label>
              <Input
                id="exams-max-mark"
                className={FORM_INPUT}
                value={maxMark}
                onChange={(event) => { setMaxMark(event.target.value); setSaved(false); }}
              />
            </div>
          </div>

          <div className="space-y-2 pt-1" role="group" aria-label="Examinations registry feature flags toggles">
            <Toggle label="Show Rankings" description="Show student class rank on result cards" value={showRankings} onChange={(value) => { setShowRankings(value); setSaved(false); }} />
            <Toggle label="Allow Retakes" description="Enable student retakes for failed exams" value={allowRetake} onChange={(value) => { setAllowRetake(value); setSaved(false); }} />
            <Toggle label="Auto-publish Results" description="Automatically publish results once grading is finished" value={autoPublishResults} onChange={(value) => { setAutoPublishResults(value); setSaved(false); }} />
            <Toggle label="Notify on Publish" description="Send push notification when results are published" value={notifyOnResult} onChange={(value) => { setNotifyOnResult(value); setSaved(false); }} />
            <Toggle label="AI Grading Assistant" description="Leverage AI models to analyze and grade open-text answers" value={aiGrading} onChange={(value) => { setAiGrading(value); setSaved(false); }} />
            <Toggle label="Distinguish Honours" description="Highlight distinctions/honours on profiles and result sheets" value={distinguishHonours} onChange={(value) => { setDistinguishHonours(value); setSaved(false); }} />
            <Toggle label="Exam Schedule Reminders" description="Auto-send date reminders to guardians prior to exam start" value={examReminders} onChange={(value) => { setExamReminders(value); setSaved(false); }} />
          </div>
        </>
      )}

      {showFields && (
        <div className="space-y-4">
          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-info/10 border border-info/30 text-sm text-info text-left">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-xs">Dynamic Fields Manager</h4>
              <p className="text-[11px] mt-0.5 text-info/90">
                Configure visible sections, reorder fields, and manage custom metadata definitions.
              </p>
            </div>
          </div>

          {formTabs.map((tab) => {
            const tabId = tab.key;
            const tabLabel = tab.label.charAt(0).toUpperCase() + tab.label.slice(1);
            const tabDesc = tab.description;
            const tabDefinitions = Array.isArray(tabFields[tabId]) ? tabFields[tabId] : [];
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
                            onClick={() => handleDeleteTab(tabId)}
                            className="p-1 h-6 w-6 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive shadow-none flex items-center justify-center"
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
                    {tabDefinitions.filter((field) => enabledSet.has(field.key)).length}/{tabDefinitions.length}
                  </span>
                  {tabId !== "basic" && isOn && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleToggleTabRequired(tabId)}
                      className={`flex-shrink-0 px-2.5 py-1 h-auto text-[10px] font-bold border transition-all shadow-none ml-2
                        ${
                          isReq
                            ? "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20 hover:text-destructive"
                            : "bg-muted border-border text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      {isReq ? "Required" : "Optional"}
                    </Button>
                  )}
                </div>

                {isOn && (
                  <div className="p-3 space-y-3">
                    <CoreFieldEditorList
                      tabId={tabId}
                      fields={getOrderedFields(tabDefinitions, tabFieldOrder[tabId])}
                      enabledSet={enabledSet}
                      requiredSet={requiredSet}
                      onToggleEnabled={(fieldId: string) => handleToggleFieldEnabled(tabId, fieldId)}
                      onToggleRequired={(fieldId: string) => handleToggleFieldRequired(tabId, fieldId)}
                      onToggleUnique={(fieldId: string) => handleToggleFieldUnique(tabId, fieldId)}
                      onReorder={(reordered: FieldDefinition[]) => handleReorderFields(tabId, reordered)}
                      isUniqueField={(targetTabId: string, fieldId: string) => tabFieldUnique[targetTabId]?.has(fieldId) || false}
                      isCoreField={(key: string) => INITIAL_EXAMINATIONS_FIELD_SEED[tabId]?.some((field: any) => field.key === key) ?? false}
                      defaultValues={tabFieldDefaultValues[tabId]}
                      permissions={tabFieldPermissions[tabId]}
                      onChangeDefaults={(fieldId: string, value: unknown) => {
                        setTabFieldDefaultValues((previousValues) => ({ ...previousValues, [tabId]: { ...previousValues[tabId], [fieldId]: value } }));
                        setSaved(false);
                      }}
                      onChangePermissions={(fieldId: string, roles: string[]) => {
                        setTabFieldPermissions((previousPermissions) => ({ ...previousPermissions, [tabId]: { ...previousPermissions[tabId], [fieldId]: roles } }));
                        setSaved(false);
                      }}
                      onEditField={(field: FieldDefinition) => handleEditField(tabId, field)}
                      onDeleteField={(id: string) => handleDeleteField(tabId, id)}
                      labels={{
                        required: "Required",
                        optional: "Optional",
                        unique: "Unique",
                        standard: "Standard",
                      }}
                    />
                    <div className="border-t border-border pt-3">
                      <CustomFieldsBuilder
                        fields={(tabFields[tabId] || []).map((field) => ({...field, id: field.key})) as unknown as CustomFieldConfig[]}
                        droppableId={`custom-fields-${tabId}`}
                        onChange={(fields) => handleCustomFieldsChange(tabId, fields)}
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
      )}

      {/* Add Tab Modal */}
      <Modal
        open={isAddTabModalOpen}
        onClose={() => {
          setIsAddTabModalOpen(false);
          setNewTabLabel("");
        }}
        title="Add Custom Tab"
        icon={Plus}
        footer={
          <div className="flex justify-end gap-2.5">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddTabModalOpen(false);
                setNewTabLabel("");
              }}
              type="button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleAddTab(newTabLabel);
                setIsAddTabModalOpen(false);
                setNewTabLabel("");
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
            onChange={(event) => setNewTabLabel(event.target.value)}
            placeholder="e.g. Extra Info"
            autoFocus
          />
        </div>
      </Modal>

      {/* Rename Tab Modal */}
      <Modal
        open={renamingTabKey !== null}
        onClose={() => {
          setRenamingTabKey(null);
          setRenameTabLabel("");
        }}
        title="Rename Custom Tab"
        icon={Pencil}
        footer={
          <div className="flex justify-end gap-2.5">
            <Button
              variant="outline"
              onClick={() => {
                setRenamingTabKey(null);
                setRenameTabLabel("");
              }}
              type="button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (renamingTabKey) {
                  handleRenameTab(renamingTabKey, renameTabLabel);
                }
                setRenamingTabKey(null);
                setRenameTabLabel("");
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
            onChange={(event) => setRenameTabLabel(event.target.value)}
            placeholder="e.g. Custom Fields"
            autoFocus
          />
        </div>
      </Modal>

      <footer className="flex w-full items-center justify-end gap-3 border-t border-border/40 mt-6 pt-4">
        <Button
          type="button"
          onClick={handleSave}
          className={saved ? "bg-success hover:bg-success/90 text-success-foreground ml-auto" : "ml-auto"}
        >
          <Save className="w-3.5 h-3.5" aria-hidden="true" /> {saved ? "Saved!" : "Save Settings"}
        </Button>
      </footer>
    </section>
  );
}
