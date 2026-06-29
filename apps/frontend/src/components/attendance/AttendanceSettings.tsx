import React, { useState, useEffect } from "react";
import { Save, QrCode, Bell, Clock, Shield, Scan, Info, Plus, Pencil, Trash2 } from "lucide-react";
import {
  type AttendanceModuleSettings as AttendanceSettingsData,
  type FieldDefinition,
  ATTENDANCE_TAB_REGISTRY,
  INITIAL_ATTENDANCE_FIELD_SEED,
  type TabDefinition,
} from "@mms/shared";
import { useAttendanceConfig } from "@/hooks/useAttendanceConfig";
import { CustomFieldsBuilder, CustomFieldConfig } from "../ui/CustomFieldsBuilder";
import { CoreFieldEditorList } from "../ui/CoreFieldEditorList";
import { useModuleFieldsEditor } from "../../hooks/useModuleFieldsEditor";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Modal } from "../ui/Modal";

interface AttendanceSettingsProps {
  role: string;
  mode?: "fields" | "preferences";
}

interface SettingRowProps {
  label: string;
  sub?: string;
  children: React.ReactNode;
}

function SettingRow({ label, sub, children }: SettingRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <Switch 
      checked={checked} 
      onCheckedChange={onChange} 
    />
  );
}

function getOrderedFields(fields: FieldDefinition[], savedOrder: string[] | undefined): FieldDefinition[] {
  if (!savedOrder || savedOrder.length === 0) return fields;
  const orderByFieldKey = Object.fromEntries(savedOrder.map((key, index) => [key, index]));
  return [...fields].sort((firstField, secondField) => (orderByFieldKey[firstField.key] ?? 9999) - (orderByFieldKey[secondField.key] ?? 9999)) as FieldDefinition[];
}

function syncOrder(previousOrder: string[], newFieldIds: string[]): string[] {
  const keptFieldIds = previousOrder.filter((fieldId) => newFieldIds.includes(fieldId));
  const addedFieldIds = newFieldIds.filter((fieldId) => !keptFieldIds.includes(fieldId));
  return [...keptFieldIds, ...addedFieldIds];
}

export function AttendanceSettings({ role, mode }: AttendanceSettingsProps) {
  const { t } = useTranslation();
  const { settings, updateSettings } = useAttendanceConfig();
  const [saved, setSaved] = useState(false);

  // Prefs state
  const [workingDays, setWorkingDays] = useState(settings.workingDays);
  const [cutoffTime, setCutoffTime] = useState(settings.cutoffTime);
  const [lateThresholdMins, setLateThresholdMins] = useState(settings.lateThresholdMins);
  const [autoAbsentAfterMins, setAutoAbsentAfterMins] = useState(settings.autoAbsentAfterMins);
  const [qrEnabled, setQrEnabled] = useState(settings.qrEnabled);
  const [lowAttendanceThreshold, setLowAttendanceThreshold] = useState(settings.lowAttendanceThreshold);
  const [notifyParents, setNotifyParents] = useState(settings.notifyParents);
  const [requireNoteForAbsent, setRequireNoteForAbsent] = useState(settings.requireNoteForAbsent);
  const [lockAfterSubmit, setLockAfterSubmit] = useState(settings.lockAfterSubmit);
  const [trackHalfDay, setTrackHalfDay] = useState(settings.trackHalfDay);
  const [weeklyReport, setWeeklyReport] = useState(settings.weeklyReport);
  const [attendanceAlerts, setAttendanceAlerts] = useState(settings.attendanceAlerts);
  const [allowManualOverride, setAllowManualOverride] = useState(settings.allowManualOverride);
  const [offlineEnabled, setOfflineEnabled] = useState(settings.offlineEnabled);
  const [geoTagging, setGeoTagging] = useState(settings.geoTagging);
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
    initialTabs: ATTENDANCE_TAB_REGISTRY,
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
    setWorkingDays(settings.workingDays);
    setCutoffTime(settings.cutoffTime);
    setLateThresholdMins(settings.lateThresholdMins);
    setAutoAbsentAfterMins(settings.autoAbsentAfterMins);
    setQrEnabled(settings.qrEnabled);
    setLowAttendanceThreshold(settings.lowAttendanceThreshold);
    setNotifyParents(settings.notifyParents);
    setRequireNoteForAbsent(settings.requireNoteForAbsent);
    setLockAfterSubmit(settings.lockAfterSubmit);
    setTrackHalfDay(settings.trackHalfDay);
    setWeeklyReport(settings.weeklyReport);
    setAttendanceAlerts(settings.attendanceAlerts);
    setAllowManualOverride(settings.allowManualOverride);
    setOfflineEnabled(settings.offlineEnabled);
    setGeoTagging(settings.geoTagging);
    setDefaultViewLayout(settings.defaultViewLayout);

    setEnabledTabs(new Set(settings.enabledTabs || ["basic"]));
    setRequiredTabs(new Set(settings.requiredTabs || []));

    const coreTabKeys = new Set(ATTENDANCE_TAB_REGISTRY.map((tabDefinition: any) => tabDefinition.key));
    const customTabs = (settings.formTabs || []).filter((tabDefinition: any) => !coreTabKeys.has(tabDefinition.key));
    setFormTabs([
      ...ATTENDANCE_TAB_REGISTRY,
      ...customTabs
    ].map((tabDefinition: any) => ({
      ...tabDefinition,
      enabled: tabDefinition.key === "basic" ? true : (settings.enabledTabs || ["basic"]).includes(tabDefinition.key)
    })));

    const newTabIds = Array.from(new Set([
      ...ATTENDANCE_TAB_REGISTRY.map((tabDefinition: any) => tabDefinition.key),
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

  if (role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="w-12 h-12 text-muted-foreground/40 mb-3" />
        <p className="text-base font-semibold text-foreground">Admin Access Required</p>
        <p className="text-sm text-muted-foreground mt-1">Only administrators can configure attendance settings.</p>
      </div>
    );
  }

  const handleToggleTabEnabled = (id: string) => { toggleTabEnabled(id); setSaved(false); };
  const handleToggleTabRequired = (id: string) => { toggleTabRequired(id); setSaved(false); };
  const handleToggleFieldEnabled = (tabId: string, fieldId: string) => { toggleFieldEnabled(tabId, fieldId); setSaved(false); };
  const handleToggleFieldRequired = (tabId: string, fieldId: string) => { toggleFieldRequired(tabId, fieldId); setSaved(false); };
  const handleToggleFieldUnique = (tabId: string, fieldId: string) => { toggleFieldUnique(tabId, fieldId); setSaved(false); };
  const handleReorderFields = (tabId: string, reorderedFields: FieldDefinition[]) => { handleReorder(tabId, reorderedFields); setSaved(false); };

  const handleCustomFieldsChange = (tabId: string, newFields: CustomFieldConfig[]): void => {
    const newFieldKeys = newFields.map((field) => field.key);
    setTabFieldOrder((previousOrder) => ({
      ...previousOrder,
      [tabId]: syncOrder(previousOrder[tabId] || [], newFieldKeys),
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
      [tabId]: (previousOrder[tabId] || []).filter((orderedFieldId) => orderedFieldId !== fieldId)
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
    setTabFieldDefaultValues((previousDefaults) => ({ ...previousDefaults, [key]: {} }));
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
    const newFields: Record<string, FieldDefinition[]> = {};
    formTabs.forEach((tabDefinition) => {
      const tabId = tabDefinition.key;
      const combinedFields = (tabFields[tabId] || []).map((field) => {
        const fieldKey = field.key || (field as { id?: string }).id || "";
        const enabled      = tabFieldEnabled[tabId]?.has(fieldKey)  ?? field.enabled  ?? false;
        const required     = tabFieldRequired[tabId]?.has(fieldKey) ?? field.required ?? false;
        const unique       = tabFieldUnique[tabId]?.has(fieldKey)   ?? field.unique   ?? false;
        const orderArray   = tabFieldOrder[tabId] || [];
        const orderIdx     = orderArray.indexOf(fieldKey);
        const order        = orderIdx >= 0 ? orderIdx : (field.order ?? 999);
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

      newFields[tabId] = combinedFields.sort((firstField, secondField) => (firstField.order ?? 999) - (secondField.order ?? 999));
    });
    return newFields;
  };

  const handleSave = () => {
    const updatedFormTabs = formTabs.map((tabDefinition) => ({
      ...tabDefinition,
      enabled: enabledTabs.has(tabDefinition.key)
    }));

    const nextSettings: AttendanceSettingsData = {
      ...settings,
      workingDays,
      cutoffTime,
      lateThresholdMins,
      autoAbsentAfterMins,
      qrEnabled,
      lowAttendanceThreshold,
      notifyParents,
      requireNoteForAbsent,
      lockAfterSubmit,
      trackHalfDay,
      weeklyReport,
      attendanceAlerts,
      allowManualOverride,
      offlineEnabled,
      geoTagging,
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
    <section className="max-w-2xl space-y-6">
      {showPrefs && (
        <>
          {/* Timing */}
          <article className="rounded-xl border border-border bg-card overflow-hidden">
            <header className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground m-0">Timing Rules</h2>
            </header>
            <div className="px-4">
              <SettingRow label="Late Threshold" sub="Students arriving after this many minutes are marked Late">
                <div className="flex items-center gap-2">
                  <label htmlFor="setting-late-threshold" className="sr-only">Late Threshold Minutes</label>
                  <input 
                    id="setting-late-threshold"
                    type="number" 
                    min={1} 
                    max={60} 
                    value={lateThresholdMins}
                    onChange={(event) => { setLateThresholdMins(Number(event.target.value)); setSaved(false); }}
                    className="w-16 text-sm text-center rounded-lg border border-border bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20" 
                  />
                  <span className="text-xs text-muted-foreground">min</span>
                </div>
              </SettingRow>
              <SettingRow label="Auto-Absent After" sub="Mark student absent if not arrived after this threshold">
                <div className="flex items-center gap-2">
                  <label htmlFor="setting-auto-absent" className="sr-only">Auto Absent Minutes</label>
                  <input 
                    id="setting-auto-absent"
                    type="number" 
                    min={10} 
                    max={120} 
                    value={autoAbsentAfterMins}
                    onChange={(event) => { setAutoAbsentAfterMins(Number(event.target.value)); setSaved(false); }}
                    className="w-16 text-sm text-center rounded-lg border border-border bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20" 
                  />
                  <span className="text-xs text-muted-foreground">min</span>
                </div>
              </SettingRow>
              <SettingRow label="Lock After Submit" sub="Prevent edits once attendance is submitted">
                <Toggle checked={lockAfterSubmit} onChange={(value) => { setLockAfterSubmit(value); setSaved(false); }} />
              </SettingRow>
            </div>
          </article>

          {/* QR */}
          <article className="rounded-xl border border-border bg-card overflow-hidden">
            <header className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground m-0">QR Attendance</h2>
            </header>
            <div className="px-4">
              <SettingRow label="Enable QR Attendance" sub="Allow teachers to scan student QR codes to mark attendance">
                <Toggle checked={qrEnabled} onChange={(value) => { setQrEnabled(value); setSaved(false); }} />
              </SettingRow>
            </div>
          </article>

          {/* Alerts */}
          <article className="rounded-xl border border-border bg-card overflow-hidden">
            <header className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground m-0">Alerts & Notifications</h2>
            </header>
            <div className="px-4">
              <SettingRow label="Low Attendance Threshold" sub="Trigger alert when student attendance drops below this %">
                <div className="flex items-center gap-2">
                  <label htmlFor="setting-low-attendance" className="sr-only">Low Attendance Threshold Percentage</label>
                  <input 
                    id="setting-low-attendance"
                    type="number" 
                    min={50} 
                    max={100} 
                    value={lowAttendanceThreshold}
                    onChange={(event) => { setLowAttendanceThreshold(Number(event.target.value)); setSaved(false); }}
                    className="w-16 text-sm text-center rounded-lg border border-border bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20" 
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </SettingRow>
              <SettingRow label="Notify Parents" sub="Send SMS/WhatsApp to parent on student absence">
                <Toggle checked={notifyParents} onChange={(value) => { setNotifyParents(value); setSaved(false); }} />
              </SettingRow>
              <SettingRow label="Require Note for Absent" sub="Teacher must add a note when marking a student absent">
                <Toggle checked={requireNoteForAbsent} onChange={(value) => { setRequireNoteForAbsent(value); setSaved(false); }} />
              </SettingRow>
            </div>
          </article>

          {/* Advanced Features */}
          <article className="rounded-xl border border-border bg-card overflow-hidden">
            <header className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
              <Scan className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground m-0">Advanced Features</h2>
            </header>
            <div className="px-4">
              <SettingRow label="Offline Mode" sub="Allow teachers to mark attendance without internet; syncs when reconnected">
                <Toggle checked={offlineEnabled} onChange={(value) => { setOfflineEnabled(value); setSaved(false); }} />
              </SettingRow>
              <SettingRow label="Geo-location Tagging" sub="Record teacher's GPS coordinates when submitting attendance">
                <Toggle checked={geoTagging} onChange={(value) => { setGeoTagging(value); setSaved(false); }} />
              </SettingRow>
              <SettingRow label="Default View Layout" sub="Select default layout format for attendance records in work view">
                <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
                  <Button
                    type="button"
                    variant={(defaultViewLayout || "list") === "list" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => { setDefaultViewLayout("list"); setSaved(false); }}
                    className="h-7 text-xs font-semibold rounded-lg px-3 shadow-none bg-transparent data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground"
                    data-state={(defaultViewLayout || "list") === "list" ? "active" : "inactive"}
                  >
                    List View
                  </Button>
                  <Button
                    type="button"
                    variant={defaultViewLayout === "cards" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => { setDefaultViewLayout("cards"); setSaved(false); }}
                    className="h-7 text-xs font-semibold rounded-lg px-3 shadow-none bg-transparent data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground"
                    data-state={defaultViewLayout === "cards" ? "active" : "inactive"}
                  >
                    Card Grid
                  </Button>
                </div>
              </SettingRow>
              <SettingRow label="Facial Recognition" sub="AI-powered face scan for attendance (coming soon)">
                <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full border", SEMANTIC_BADGE.warningStrong)}>{t("attendance.settings.comingSoon")}</span>
              </SettingRow>
              <SettingRow label="Daily Auto-Lock" sub="Automatically lock attendance after end-of-day submission">
                <Toggle checked={lockAfterSubmit} onChange={(value) => { setLockAfterSubmit(value); setSaved(false); }} />
              </SettingRow>
              <SettingRow label="Audit Logging" sub="Record all edits and submissions in an audit trail (always on)">
                <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full border", SEMANTIC_BADGE.successStrong)}>{t("attendance.settings.active")}</span>
              </SettingRow>
            </div>
          </article>
        </>
      )}

      {showFields && (
        <div className="space-y-4 text-left">
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
                      isCoreField={(key: string) => INITIAL_ATTENDANCE_FIELD_SEED[tabId]?.some((field: any) => field.key === key) ?? false}
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
                        fields={tabDefinitions.map((field) => ({ ...field, id: field.key })) as unknown as CustomFieldConfig[]}
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

      {/* Actions */}
      <footer className="flex w-full items-center justify-end gap-3 border-t border-border/40 mt-6 pt-4">
        <Button
          onClick={handleSave}
          className={cn("ml-auto", saved && "bg-success hover:bg-success/90 text-success-foreground")}
        >
          <Save className="w-3.5 h-3.5" />
          {saved ? "Saved!" : "Save Settings"}
        </Button>
      </footer>
    </section>
  );
}
