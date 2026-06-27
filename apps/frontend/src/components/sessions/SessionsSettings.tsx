import React, { useState, useEffect } from "react";
import { Save, Calendar, Info, Plus, Pencil, Trash2 } from "lucide-react";
import {
  type SessionsSettings as SessionsSettingsType,
  SESSIONS_TAB_REGISTRY,
  INITIAL_SESSIONS_FIELD_SEED,
  type FieldDefinition,
} from "@mms/shared";
import { useSessionConfig } from "@/hooks/useSessionConfig";
import { SESSION_TYPES } from "../../lib/data/sessionsData";
import { CustomFieldsBuilder, CustomFieldConfig } from "../ui/CustomFieldsBuilder";
import { CoreFieldEditorList } from "../ui/CoreFieldEditorList";
import { useModuleFieldsEditor } from "../../hooks/useModuleFieldsEditor";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { FormSelect } from "../ui/FormSelect";
import { Switch } from "../ui/switch";
import { Modal } from "../ui/Modal";
import { useTranslation } from "@/hooks/useTranslation";
import { Checkbox } from "../ui/checkbox";

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (newValue: boolean) => void;
}

function Toggle({ label, description, value, onChange }: ToggleProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between py-1 text-left">
      <div>
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      </div>
      <Switch
        checked={value}
        onCheckedChange={onChange}
        aria-label={`Toggle ${label}`}
      />
    </div>
  );
}

interface SessionsSettingsProps {
  mode?: "fields" | "preferences";
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

export function SessionsSettings({ mode }: SessionsSettingsProps): React.JSX.Element {
  const { t } = useTranslation();
  const { settings, types, updateSettings } = useSessionConfig();
  const [saved, setSaved] = useState<boolean>(false);

  // Prefs state
  const [defaultDuration, setDefaultDuration] = useState(settings.defaultDuration);
  const [defaultSessionType, setDefaultSessionType] = useState(settings.defaultSessionType);
  const [academicYear, setAcademicYear] = useState(settings.academicYear);
  const [sessionStart, setSessionStart] = useState(settings.sessionStart);
  const [allowOverlap, setAllowOverlap] = useState(settings.allowOverlap);
  const [archiveOldSessions, setArchiveOldSessions] = useState(settings.archiveOldSessions);
  const [requireBudget, setRequireBudget] = useState(settings.requireBudget);
  const [timetableConflictCheck, setTimetableConflictCheck] = useState(settings.timetableConflictCheck);
  const [notifyOnSessionStart, setNotifyOnSessionStart] = useState(settings.notifyOnSessionStart);
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
    handleCustomFieldsChange,
    handleEditField,
    handleDeleteField,
    handleAddTab,
    handleDeleteTab,
    handleRenameTab,
    buildFieldsMap,
    resetAllState,
  } = useModuleFieldsEditor({
    initialTabs: SESSIONS_TAB_REGISTRY,
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
    setDefaultDuration(settings.defaultDuration);
    setDefaultSessionType(settings.defaultSessionType);
    setAcademicYear(settings.academicYear);
    setSessionStart(settings.sessionStart);
    setAllowOverlap(settings.allowOverlap);
    setArchiveOldSessions(settings.archiveOldSessions);
    setRequireBudget(settings.requireBudget);
    setTimetableConflictCheck(settings.timetableConflictCheck);
    setNotifyOnSessionStart(settings.notifyOnSessionStart);
    setDefaultViewLayout(settings.defaultViewLayout);

    const coreKeys = new Set(SESSIONS_TAB_REGISTRY.map(t => t.key));
    const customTabs = (settings.formTabs || []).filter(t => !coreKeys.has(t.key));
    const updatedTabs = [
      ...SESSIONS_TAB_REGISTRY,
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

  const typeOptions = types.length > 0 ? types : [...SESSION_TYPES];

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

    const cfg: SessionsSettingsType = {
      ...settings,
      defaultDuration,
      defaultSessionType,
      academicYear,
      sessionStart,
      allowOverlap,
      archiveOldSessions,
      requireBudget,
      timetableConflictCheck,
      notifyOnSessionStart,
      defaultViewLayout,
      enabledTabs: Array.from(enabledTabs),
      requiredTabs: Array.from(requiredTabs),
      formTabs: updatedFormTabs,
      fields: buildFieldsMap(),
    };

    updateSettings(cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const showPrefs = mode === "preferences";
  const showFields = mode === "fields";

  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Calendar className="w-3.5 h-3.5 text-primary" />
        </div>
        <h3 className="text-[13px] font-bold text-foreground">Sessions Module Settings</h3>
      </div>

      {showPrefs && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={FORM_LABEL} htmlFor="defaultDuration">Default Duration (months)</label>
              <Input
                id="defaultDuration"
                type="number"
                value={defaultDuration}
                onChange={(e) => { setDefaultDuration(e.target.value); setSaved(false); }}
              />
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="defaultSessionType">Default Session Type</label>
              <FormSelect
                id="defaultSessionType"
                value={defaultSessionType}
                onChange={(val) => { setDefaultSessionType(val); setSaved(false); }}
                options={typeOptions}
                className="w-full"
              />
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="academicYear">Academic Year</label>
              <Input
                id="academicYear"
                type="text"
                value={academicYear}
                onChange={(e) => { setAcademicYear(e.target.value); setSaved(false); }}
                placeholder="2025-2026"
              />
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="sessionStart">Session Starts (Month)</label>
              <FormSelect
                id="sessionStart"
                value={sessionStart}
                onChange={(val) => { setSessionStart(val); setSaved(false); }}
                options={["january", "february", "march", "april", "may", "june",
                  "july", "august", "september", "october", "november", "december"].map((m) => ({
                    value: m,
                    label: m.charAt(0).toUpperCase() + m.slice(1)
                  }))}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <Toggle
              label="Allow Overlapping Sessions"
              description="Multiple active sessions can run at the same time"
              value={allowOverlap}
              onChange={(v) => { setAllowOverlap(v); setSaved(false); }}
            />
            <Toggle
              label="Auto-archive Old Sessions"
              description="Completed sessions are automatically archived"
              value={archiveOldSessions}
              onChange={(v) => { setArchiveOldSessions(v); setSaved(false); }}
            />
            <Toggle
              label="Require Budget Plan"
              description="Session must have a budget before activation"
              value={requireBudget}
              onChange={(v) => { setRequireBudget(v); setSaved(false); }}
            />
            <Toggle
              label="Timetable Conflict Check"
              description="Warn when class schedules overlap"
              value={timetableConflictCheck}
              onChange={(v) => { setTimetableConflictCheck(v); setSaved(false); }}
            />
            <Toggle
              label="Notify on Session Start"
              description="Send notification when a new session begins"
              value={notifyOnSessionStart}
              onChange={(v) => { setNotifyOnSessionStart(v); setSaved(false); }}
            />

            <div className="py-3 border-t border-border mt-3 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-foreground">Default View Layout</p>
                <p className="text-[11px] text-muted-foreground">Select how sessions are displayed in work view</p>
              </div>
              <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
                <Button
                  variant="ghost"
                  onClick={() => { setDefaultViewLayout("list"); setSaved(false); }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all h-auto ${
                    (defaultViewLayout || "cards") === "list"
                      ? "bg-card text-foreground shadow-sm hover:bg-card hover:text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                  }`}
                >
                  List View
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { setDefaultViewLayout("cards"); setSaved(false); }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all h-auto ${
                    (defaultViewLayout || "cards") === "cards"
                      ? "bg-card text-foreground shadow-sm hover:bg-card hover:text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                  }`}
                >
                  Card Grid
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {showFields && (
        <div className="space-y-4 text-left">
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
                            <Pencil className="w-3.5 h-3.5" />
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
                      isCoreField={(key: string) => INITIAL_SESSIONS_FIELD_SEED[tabId]?.some((f) => f.key === key) ?? false}
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
          <Save className="w-3.5 h-3.5" />
          <span>{saved ? "Saved!" : "Save Settings"}</span>
        </Button>
      </footer>
    </section>
  );
}
