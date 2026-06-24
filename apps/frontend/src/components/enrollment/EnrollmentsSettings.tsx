import React, { useState, useEffect } from "react";
import { Save, ClipboardList, Info, Plus, Pencil, Trash2 } from "lucide-react";
import { useEnrollmentConfig } from "@/hooks/useEnrollmentConfig";
import {
  type EnrollmentsSettings as EnrollmentsSettingsData,
  ENROLLMENTS_TAB_REGISTRY,
  INITIAL_ENROLLMENTS_FIELD_SEED,
  type FieldDefinition,
} from "@mms/shared";
import CustomFieldsBuilder, { CustomFieldConfig } from "../ui/CustomFieldsBuilder";
import CoreFieldEditorList from "../ui/CoreFieldEditorList";
import { useModuleFieldsEditor } from "../../hooks/useModuleFieldsEditor";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { Checkbox } from "../ui/checkbox";
import Modal from "../ui/Modal";
import useTranslation from "@/hooks/useTranslation";

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

interface EnrollmentsSettingsProps {
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

export default function EnrollmentsSettings({ mode }: EnrollmentsSettingsProps): React.JSX.Element {
  const { t } = useTranslation();
  const { settings, updateSettings } = useEnrollmentConfig();
  const [saved, setSaved] = useState<boolean>(false);

  // Prefs state
  const [maxStudentsPerClass, setMaxStudentsPerClass] = useState(settings.maxStudentsPerClass);
  const [dropDeadlineDays, setDropDeadlineDays] = useState(settings.dropDeadlineDays);
  const [waitlistEnabled, setWaitlistEnabled] = useState(settings.waitlistEnabled);
  const [requireEligibilityCheck, setRequireEligibilityCheck] = useState(settings.requireEligibilityCheck);
  const [autoAssignClass, setAutoAssignClass] = useState(settings.autoAssignClass);
  const [enrollmentApproval, setEnrollmentApproval] = useState(settings.enrollmentApproval);
  const [allowTransfers, setAllowTransfers] = useState(settings.allowTransfers);
  const [reenrollmentReminder, setReenrollmentReminder] = useState(settings.reenrollmentReminder);

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
    initialTabs: ENROLLMENTS_TAB_REGISTRY,
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
    setMaxStudentsPerClass(settings.maxStudentsPerClass);
    setDropDeadlineDays(settings.dropDeadlineDays);
    setWaitlistEnabled(settings.waitlistEnabled);
    setRequireEligibilityCheck(settings.requireEligibilityCheck);
    setAutoAssignClass(settings.autoAssignClass);
    setEnrollmentApproval(settings.enrollmentApproval);
    setAllowTransfers(settings.allowTransfers);
    setReenrollmentReminder(settings.reenrollmentReminder);

    const coreKeys = new Set(ENROLLMENTS_TAB_REGISTRY.map((t: any) => t.key));
    const customTabs = (settings.formTabs || []).filter((t: any) => !coreKeys.has(t.key));
    const updatedTabs = [
      ...ENROLLMENTS_TAB_REGISTRY,
      ...customTabs
    ].map((t: any) => ({
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

    const cfg: EnrollmentsSettingsData = {
      ...settings,
      maxStudentsPerClass,
      dropDeadlineDays,
      waitlistEnabled,
      requireEligibilityCheck,
      autoAssignClass,
      enrollmentApproval,
      allowTransfers,
      reenrollmentReminder,
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
    <section className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <ClipboardList className="w-3.5 h-3.5 text-primary" />
        </div>
        <h3 className="text-[13px] font-bold text-foreground">Enrollments Module Settings</h3>
      </div>

      {showPrefs && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={FORM_LABEL} htmlFor="maxStudentsPerClass">Max Students Per Class</label>
              <Input
                id="maxStudentsPerClass"
                type="number"
                value={maxStudentsPerClass}
                onChange={(e) => { setMaxStudentsPerClass(e.target.value); setSaved(false); }}
              />
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="dropDeadlineDays">Drop Deadline (days after enroll)</label>
              <Input
                id="dropDeadlineDays"
                type="number"
                value={dropDeadlineDays}
                onChange={(e) => { setDropDeadlineDays(e.target.value); setSaved(false); }}
              />
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <Toggle
              label="Enable Waitlist"
              description="Allow students to join a waitlist when class is full"
              value={waitlistEnabled}
              onChange={(v) => { setWaitlistEnabled(v); setSaved(false); }}
            />
            <Toggle
              label="Require Eligibility Check"
              description="Run eligibility rules before confirming enrollment"
              value={requireEligibilityCheck}
              onChange={(v) => { setRequireEligibilityCheck(v); setSaved(false); }}
            />
            <Toggle
              label="Auto-assign to Class"
              description="System automatically places student in best available class"
              value={autoAssignClass}
              onChange={(v) => { setAutoAssignClass(v); setSaved(false); }}
            />
            <Toggle
              label="Enrollment Requires Approval"
              description="Admin must approve each enrollment"
              value={enrollmentApproval}
              onChange={(v) => { setEnrollmentApproval(v); setSaved(false); }}
            />
            <Toggle
              label="Allow Class Transfers"
              description="Students can be transferred between classes"
              value={allowTransfers}
              onChange={(v) => { setAllowTransfers(v); setSaved(false); }}
            />
            <Toggle
              label="Re-enrollment Reminder"
              description="Remind guardians when re-enrollment period opens"
              value={reenrollmentReminder}
              onChange={(v) => { setReenrollmentReminder(v); setSaved(false); }}
            />
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
                      isCoreField={(key: string) => INITIAL_ENROLLMENTS_FIELD_SEED[tabId]?.some((f: any) => f.key === key) ?? false}
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
                      onEditField={(f: FieldDefinition) => handleEditField(tabId, f)}
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
                        fields={(tabFields[tabId] || []).map(f => ({...f, id: f.key})) as unknown as CustomFieldConfig[]}
                        droppableId={`custom-fields-${tabId}`}
                        onChange={(f) => handleCustomFieldsChange(tabId, f)}
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
