import React, { useEffect, useState } from "react";
import { Save, GraduationCap, Plus, Trash2, Pencil, Info } from "lucide-react";
import {
  type StudentsSettings,
  type FieldDefinition,
  STUDENT_TAB_REGISTRY,
  DEFAULT_STUDENT_ENABLED_TABS,
  DEFAULT_STUDENT_REQUIRED_TABS,
  DEFAULT_STUDENT_COLUMN_REGISTRY,
  INITIAL_STUDENT_FIELD_SEED,
} from "@mms/shared";
import CustomFieldsBuilder, { CustomFieldConfig } from "../ui/CustomFieldsBuilder";
import CoreFieldEditorList from "../ui/CoreFieldEditorList";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { useStudentConfig } from "@/hooks/useStudentConfig";
import { useModuleFieldsEditor } from "../../hooks/useModuleFieldsEditor";
import Modal from "../ui/Modal";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { Checkbox } from "../ui/checkbox";

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (val: boolean) => void;
  ariaLabel?: string;
}

function Toggle({ label, description, value, onChange, ariaLabel }: ToggleProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between py-1.5 text-left">
      <div>
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      </div>
      <Switch
        checked={value}
        onCheckedChange={onChange}
        aria-label={ariaLabel || label}
      />
    </div>
  );
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

export default function StudentsSettings({ mode }: { mode?: "fields" | "preferences" }): React.ReactElement {
  const { settings, updateSettings } = useStudentConfig();
  const [saved, setSaved] = useState<boolean>(false);

  const settingsFields = (settings.fields as Record<string, FieldDefinition[]>) || {};

  // General Preferences state
  const [idPrefix, setIdPrefix] = useState(settings.idPrefix);
  const [autoGenerateId, setAutoGenerateId] = useState(settings.autoGenerateId);
  const [requireGuardian, setRequireGuardian] = useState(settings.requireGuardian);
  const [requirePhoto, setRequirePhoto] = useState(settings.requirePhoto);
  const [defaultGender, setDefaultGender] = useState(settings.defaultGender);
  const [maxAge, setMaxAge] = useState(settings.maxAge);
  const [minAge, setMinAge] = useState(settings.minAge);
  const [allowSiblingDiscount, setAllowSiblingDiscount] = useState(settings.allowSiblingDiscount);
  const [trackHealthRecords, setTrackHealthRecords] = useState(settings.trackHealthRecords);
  const [grNumberTemplate, setGrNumberTemplate] = useState(settings.grNumberTemplate);
  const [grNumberDigits, setGrNumberDigits] = useState(settings.grNumberDigits);
  const [grNumberRestartAnnually, setGrNumberRestartAnnually] = useState(settings.grNumberRestartAnnually);
  const [defaultViewLayout, setDefaultViewLayout] = useState(settings.defaultViewLayout);

  // Fields and Tabs state managed by DRY hook
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
    initialTabs: STUDENT_TAB_REGISTRY,
    initialFields: settingsFields,
    initialEnabledTabs: Array.from(new Set(settings.enabledTabs || DEFAULT_STUDENT_ENABLED_TABS)),
    initialRequiredTabs: Array.from(new Set(settings.requiredTabs || DEFAULT_STUDENT_REQUIRED_TABS)),
  });

  // Custom tabs modal state
  const [isAddTabModalOpen, setIsAddTabModalOpen] = useState(false);
  const [newTabLabel, setNewTabLabel] = useState("");
  const [renamingTabKey, setRenamingTabKey] = useState<string | null>(null);
  const [renameTabLabel, setRenameTabLabel] = useState("");

  useEffect(() => {
    if (!settings) return;
    // Keep internal state updated when context settings reload/change
    setIdPrefix(settings.idPrefix);
    setAutoGenerateId(settings.autoGenerateId);
    setRequireGuardian(settings.requireGuardian);
    setRequirePhoto(settings.requirePhoto);
    setDefaultGender(settings.defaultGender);
    setMaxAge(settings.maxAge);
    setMinAge(settings.minAge);
    setAllowSiblingDiscount(settings.allowSiblingDiscount);
    setTrackHealthRecords(settings.trackHealthRecords);
    setGrNumberTemplate(settings.grNumberTemplate);
    setGrNumberDigits(settings.grNumberDigits);
    setGrNumberRestartAnnually(settings.grNumberRestartAnnually);
    setDefaultViewLayout(settings.defaultViewLayout);

    const coreKeys = new Set(STUDENT_TAB_REGISTRY.map(t => t.key));
    const customTabs = (settings.formTabs || []).filter(t => !coreKeys.has(t.key));
    const updatedTabs = [
      ...STUDENT_TAB_REGISTRY,
      ...customTabs
    ].map(t => ({
      ...t,
      enabled: t.key === "basic" ? true : (settings.enabledTabs || DEFAULT_STUDENT_ENABLED_TABS).includes(t.key)
    }));

    resetAllState(
      updatedTabs,
      (settings.fields as Record<string, FieldDefinition[]>) || {},
      settings.enabledTabs || DEFAULT_STUDENT_ENABLED_TABS,
      settings.requiredTabs || DEFAULT_STUDENT_REQUIRED_TABS
    );
  }, [settings]);

  const handleToggleTabEnabled = (id: string) => { toggleTabEnabled(id); setSaved(false); };
  const handleToggleTabRequired = (id: string) => { toggleTabRequired(id); setSaved(false); };
  const handleToggleFieldEnabled = (tabId: string, fieldId: string) => { toggleFieldEnabled(tabId, fieldId); setSaved(false); };
  const handleToggleFieldRequired = (tabId: string, fieldId: string) => { toggleFieldRequired(tabId, fieldId); setSaved(false); };
  const handleToggleFieldUnique = (tabId: string, fieldId: string) => { toggleFieldUnique(tabId, fieldId); setSaved(false); };
  const handleReorderFields = (tabId: string, reorderedFields: FieldDefinition[]) => { handleReorder(tabId, reorderedFields); setSaved(false); };

  const handleCustomFieldsChangeLocal = (tabId: string, newFields: CustomFieldConfig[]): void => {
    handleCustomFieldsChange(tabId, newFields);
    setSaved(false);
  };

  const handleEditFieldLocal = (tabId: string, updatedField: FieldDefinition) => {
    handleEditField(tabId, updatedField);
    setSaved(false);
  };

  const handleDeleteFieldLocal = (tabId: string, fieldId: string) => {
    handleDeleteField(tabId, fieldId);
    setSaved(false);
  };

  const handleAddTabLocal = (label: string) => {
    handleAddTab(label);
    setSaved(false);
  };

  const handleDeleteTabLocal = (key: string) => {
    handleDeleteTab(key);
    setSaved(false);
  };

  const handleRenameTabLocal = (key: string, newLabel: string) => {
    handleRenameTab(key, newLabel);
    setSaved(false);
  };

  const handleSave = (): void => {
    const updatedFormTabs = formTabs.map(t => ({
      ...t,
      enabled: enabledTabs.has(t.key)
    }));

    const cfg: StudentsSettings = {
      ...settings,
      idPrefix,
      autoGenerateId,
      requireGuardian,
      requirePhoto,
      defaultGender,
      maxAge,
      minAge,
      allowSiblingDiscount,
      trackHealthRecords,
      grNumberTemplate,
      grNumberDigits,
      grNumberRestartAnnually,
      defaultViewLayout,
      version: 2,
      enabledTabs: Array.from(enabledTabs),
      requiredTabs: Array.from(requiredTabs),
      fields: buildFieldsMap(),
      formTabs: updatedFormTabs,
      columnRegistry: settings.columnRegistry || DEFAULT_STUDENT_COLUMN_REGISTRY,
    };

    updateSettings(cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const showFields = mode === "fields";
  const showPrefs = mode === "preferences";

  return (
    <section className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 space-y-5 shadow-sm" aria-labelledby="students-settings-title">
      <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <GraduationCap className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
        </div>
        <h3 id="students-settings-title" className="text-[13px] font-bold text-foreground">Students Module Settings</h3>
      </div>

      {showPrefs && (
        <div className="space-y-4">
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider">General Register (GR) Number Settings</h4>
            <div className="grid grid-cols-2 gap-3 text-left">
              <div>
                <label htmlFor="gr-template" className={FORM_LABEL}>GR Number Template</label>
                <Input
                  id="gr-template"
                  className={FORM_INPUT}
                  value={grNumberTemplate || ""}
                  onChange={(e) => { setGrNumberTemplate(e.target.value); setSaved(false); }}
                  placeholder="e.g. {seq}-{year}"
                />
                <span className="text-[9px] text-muted-foreground mt-1 block">Use placeholders: <code>{`{seq}`}</code>, <code>{`{year}`}</code></span>
              </div>
              <div>
                <label htmlFor="gr-digits" className={FORM_LABEL}>Sequence Digits</label>
                <Input
                  id="gr-digits"
                  type="number"
                  min="1"
                  max="8"
                  className={FORM_INPUT}
                  value={grNumberDigits || 4}
                  onChange={(e) => { setGrNumberDigits(Number(e.target.value)); setSaved(false); }}
                />
                <span className="text-[9px] text-muted-foreground mt-1 block">e.g., 4 is "0001", 3 is "001"</span>
              </div>
            </div>
            <Toggle
              label="Restart Sequence Annually"
              description="Reset GR number sequence to 0001 at the beginning of each calendar year"
              value={grNumberRestartAnnually ?? true}
              onChange={(v) => { setGrNumberRestartAnnually(v); setSaved(false); }}
            />
          </div>

          <div className="space-y-2 pt-1 border-t border-border/40" role="group" aria-label="Student registry feature flags toggles">
            <Toggle label="Auto-generate Student ID" description="System assigns unique ID on registration" value={autoGenerateId} onChange={(v) => { setAutoGenerateId(v); setSaved(false); }} />
            <Toggle label="Require Guardian Contact" description="Student must have at least one guardian linked" value={requireGuardian} onChange={(v) => { setRequireGuardian(v); setSaved(false); }} />
            <Toggle label="Require Photo" description="Student profile photo is mandatory" value={requirePhoto} onChange={(v) => { setRequirePhoto(v); setSaved(false); }} />
          </div>

          <div className="py-3 border-t border-border mt-3 flex items-center justify-between">
            <div className="text-left">
              <p className="text-[13px] font-semibold text-foreground">Default View Layout</p>
              <p className="text-[11px] text-muted-foreground">Select how students are displayed in work view</p>
            </div>
            <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setDefaultViewLayout("list"); setSaved(false); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all h-auto ${
                  (defaultViewLayout || "list") === "list"
                    ? "bg-card text-foreground shadow-sm hover:bg-card"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                List View
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setDefaultViewLayout("cards"); setSaved(false); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all h-auto ${
                  defaultViewLayout === "cards"
                    ? "bg-card text-foreground shadow-sm hover:bg-card"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Card Grid
              </Button>
            </div>
          </div>
        </div>
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
                      fields={getOrderedFields(tabDefs, tabFieldOrder[tabId])}
                      enabledSet={enabledSet}
                      requiredSet={requiredSet}
                      onToggleEnabled={(fieldId: string) => handleToggleFieldEnabled(tabId, fieldId)}
                      onToggleRequired={(fieldId: string) => handleToggleFieldRequired(tabId, fieldId)}
                      onToggleUnique={(fieldId: string) => handleToggleFieldUnique(tabId, fieldId)}
                      onReorder={(reordered: FieldDefinition[]) => handleReorderFields(tabId, reordered)}
                      isUniqueField={(tid: string, fid: string) => tabFieldUnique[tid]?.has(fid) || false}
                      isCoreField={(key: string) => INITIAL_STUDENT_FIELD_SEED[tabId]?.some((f) => f.key === key) ?? false}
                      defaultValues={tabFieldDefaultValues[tabId]}
                      permissions={tabFieldPermissions[tabId]}
                      onChangeDefaults={(fieldId: string, val: unknown) => {
                        setTabFieldDefaultValues(prev => ({ ...prev, [tabId]: { ...prev[tabId], [fieldId]: val } }));
                        setSaved(false);
                      }}
                      onChangePermissions={(fieldId: string, roles: string[]) => {
                        setTabFieldPermissions(prev => ({ ...prev, [tabId]: { ...prev[tabId], [fieldId]: roles } }));
                        setSaved(false);
                      }}
                      onEditField={(f: FieldDefinition) => handleEditFieldLocal(tabId, f)}
                      onDeleteField={(id: string) => handleDeleteFieldLocal(tabId, id)}
                      labels={{
                        required: "Required",
                        optional: "Optional",
                        unique: "Unique",
                        standard: "Standard",
                      }}
                    />
                    <div className="border-t border-border pt-3">
                      <CustomFieldsBuilder
                        fields={(tabFields[tabId] || []).map(f => ({...f, id: f.key})) as unknown as CustomFieldConfig[]}
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
                handleAddTabLocal(newTabLabel);
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
            onChange={(e) => setNewTabLabel(e.target.value)}
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
                  handleRenameTabLocal(renamingTabKey, renameTabLabel);
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
            onChange={(e) => setRenameTabLabel(e.target.value)}
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
