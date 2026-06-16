import React, { useState } from "react";
import { Check, RotateCcw, Save, Info, Users, Layout, Star, List, Plus, Trash2, Search } from "lucide-react";
import {
  TAB_REGISTRY, DEFAULT_ENABLED_TABS, DEFAULT_REQUIRED_TABS,
  FieldConfig, ContactPreferences, TabDefinition,
  CONFIG_VERSION, COLOR_PALETTES, DEFAULT_UI_STRINGS,
  SETTINGS_LIST_OPTIONS, FieldDefinition, toTitleCase as sharedToTitleCase
} from "@mms/shared";
import { saveDefaultConfig, loadDefaultConfig } from "../../lib/contactFieldsStore";
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import CustomFieldsBuilder, { CustomFieldConfig } from "../ui/CustomFieldsBuilder";
import DraggableFieldList from "../ui/ContactDraggableFieldList";
import ColumnCustomizer from "./ColumnCustomizer";
import { FormSelect } from "./form/FormPrimitives";

const toTitleCase = (str: string): string => sharedToTitleCase(str) as string;

const INPUT = "w-full px-3 py-2 min-h-[44px] rounded-lg border border-border text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";
const LABEL = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (val: boolean) => void;
  ariaLabel?: string;
}

/**
 * A simple toggle switch component.
 * @param props Component properties.
 * @returns React element.
 */
function Toggle({ label, description, value, onChange, ariaLabel }: ToggleProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between py-1.5 text-left">
      <div>
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="relative flex items-center justify-center w-11 h-11 flex-shrink-0"
        aria-label={ariaLabel || `Toggle option ${label}`}
      >
        <div className="relative rounded-full transition-colors" style={{ width: 40, height: 22, backgroundColor: value ? "hsl(var(--primary))" : "hsl(var(--border))" }}>
          <span style={{ width: 17, height: 17, top: 2.5, left: value ? 19 : 3, position: "absolute", borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
        </div>
      </button>
    </div>
  );
}

/**
 * Returns core + custom fields for a tab in the saved order.
 */
function getOrderedFields(fields: FieldDefinition[], savedOrder: string[] | undefined): FieldDefinition[] {
  if (!savedOrder || savedOrder.length === 0) return fields;
  const map = Object.fromEntries(savedOrder.map((key, i) => [key, i]));
  return [...fields].sort((a, b) => (map[a.key] ?? 9999) - (map[b.key] ?? 9999)) as FieldDefinition[];
}

/**
 * Syncs the field order array when custom fields change.
 */
function syncOrder(prevOrder: string[], newFieldIds: string[]): string[] {
  const kept = prevOrder.filter((id) => newFieldIds.includes(id));
  const added = newFieldIds.filter((id) => !kept.includes(id));
  return [...kept, ...added];
}

interface ContactsSettingsPanelProps {
  config: FieldConfig;
  onConfigChange: (config: FieldConfig) => void;
  mode?: "fields" | "preferences" | "uistrings";
}

interface ContactPrefs extends ContactPreferences {
  autoMergeSuggestions?: boolean;
  showWhatsApp?: boolean;
}

/**
 * ContactsSettingsPanel component providing a full dynamic field configuration UI.
 * @param props Component properties.
 * @returns React element.
 */
export default function ContactsSettingsPanel({ config, onConfigChange, mode }: ContactsSettingsPanelProps): React.JSX.Element {
  const {
    updatePrefs,
    genders,
    socialPlatforms,
    relationships,
    lifecycleStages,
    lifecycleColors,
    whatsappTemplates,
    phoneLabels,
    emailLabels,
    addressLabels,
    countryCodes,
    updateGenders,
    updateSocialPlatforms,
    updateRelationships,
    updateLifecycleStages,
    updateLifecycleColors,
    updateWhatsappTemplates,
    updatePhoneLabels,
    updateEmailLabels,
    updateAddressLabels,
    updateCountryCodes,
  } = useContactConfig();

  const [listKey, setListKey] = useState<string>("genders");
  const [newItemText, setNewItemText] = useState<string>("");
  const [newCountryName, setNewCountryName] = useState<string>("");
  const [newCountryCode, setNewCountryCode] = useState<string>("");
  const [newTemplateLabel, setNewTemplateLabel] = useState<string>("");
  const [newTemplateBody, setNewTemplateBody] = useState<string>("");
  const [newStageColor, setNewStageColor] = useState<string>("blue");

  const handleAddItem = () => {
    const text = toTitleCase(newItemText.trim());
    if (!text) return;
    if (listKey === "genders") {
      if (!genders.includes(text)) updateGenders([...genders, text]);
    } else if (listKey === "socialPlatforms") {
      if (!socialPlatforms.includes(text)) updateSocialPlatforms([...socialPlatforms, text]);
    } else if (listKey === "relationships") {
      if (!relationships.includes(text)) updateRelationships([...relationships, text]);
    } else if (listKey === "lifecycleStages") {
      if (!lifecycleStages.includes(text)) {
        updateLifecycleStages([...lifecycleStages, text]);
        const updatedColors = {
          ...lifecycleColors,
          [text]: COLOR_PALETTES[newStageColor as keyof typeof COLOR_PALETTES] || COLOR_PALETTES.blue
        };
        updateLifecycleColors(updatedColors);
      }
    } else if (listKey === "phoneLabels") {
      if (!phoneLabels.includes(text)) updatePhoneLabels([...phoneLabels, text]);
    } else if (listKey === "emailLabels") {
      if (!emailLabels.includes(text)) updateEmailLabels([...emailLabels, text]);
    } else if (listKey === "addressLabels") {
      if (!addressLabels.includes(text)) updateAddressLabels([...addressLabels, text]);
    }
    setNewItemText("");
  };

  const handleAddCountry = () => {
    const country = toTitleCase(newCountryName.trim());
    const code = newCountryCode.trim();
    if (!country || !code) return;
    if (!countryCodes.some((c) => c.country.toLowerCase() === country.toLowerCase())) {
      updateCountryCodes([...countryCodes, { country, code }]);
    }
    setNewCountryName("");
    setNewCountryCode("");
  };

  const handleAddWhatsappTemplate = () => {
    const label = toTitleCase(newTemplateLabel.trim());
    const body = newTemplateBody.trim();
    if (!label || !body) return;
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    if (!whatsappTemplates.some((t) => t.id === id)) {
      updateWhatsappTemplates([...whatsappTemplates, { id, label, body }]);
    }
    setNewTemplateLabel("");
    setNewTemplateBody("");
  };

  const handleRemoveItem = (index: number) => {
    if (listKey === "genders") {
      updateGenders(genders.filter((_, i) => i !== index));
    } else if (listKey === "socialPlatforms") {
      updateSocialPlatforms(socialPlatforms.filter((_, i) => i !== index));
    } else if (listKey === "relationships") {
      updateRelationships(relationships.filter((_, i) => i !== index));
    } else if (listKey === "lifecycleStages") {
      const stageToRemove = lifecycleStages[index];
      updateLifecycleStages(lifecycleStages.filter((_, i) => i !== index));
      const nextColors = { ...lifecycleColors };
      delete nextColors[stageToRemove];
      updateLifecycleColors(nextColors);
    } else if (listKey === "phoneLabels") {
      updatePhoneLabels(phoneLabels.filter((_, i) => i !== index));
    } else if (listKey === "emailLabels") {
      updateEmailLabels(emailLabels.filter((_, i) => i !== index));
    } else if (listKey === "addressLabels") {
      updateAddressLabels(addressLabels.filter((_, i) => i !== index));
    }
  };

  const handleRemoveWhatsappTemplate = (id: string) => {
    updateWhatsappTemplates(whatsappTemplates.filter((t) => t.id !== id));
  };

  const handleRemoveCountry = (country: string) => {
    updateCountryCodes(countryCodes.filter((c) => c.country !== country));
  };


  const [enabledTabs, setEnabledTabs] = useState<Set<string>>(() => new Set(config.enabledTabs || DEFAULT_ENABLED_TABS));
  const [requiredTabs, setRequiredTabs] = useState<Set<string>>(() => new Set(config.requiredTabs || DEFAULT_REQUIRED_TABS));

  const ALL_TABS = TAB_REGISTRY.map(t => t.key);

  const [tabFields, setTabFields] = useState<Record<string, FieldDefinition[]>>(() => {
    return Object.fromEntries(ALL_TABS.map(tabId => [tabId, config.fields?.[tabId] || []]));
  });

  const [tabFieldEnabled, setTabFieldEnabled] = useState<Record<string, Set<string>>>(() => {
    return Object.fromEntries(ALL_TABS.map(tabId => [tabId, new Set((config.fields?.[tabId] || []).filter(f => f.enabled).map(f => f.key))]));
  });

  const [tabFieldRequired, setTabFieldRequired] = useState<Record<string, Set<string>>>(() => {
    return Object.fromEntries(ALL_TABS.map(tabId => [tabId, new Set((config.fields?.[tabId] || []).filter(f => f.required).map(f => f.key))]));
  });

  const [tabFieldUnique, setTabFieldUnique] = useState<Record<string, Set<string>>>(() => {
    return Object.fromEntries(ALL_TABS.map(tabId => [tabId, new Set((config.fields?.[tabId] || []).filter(f => f.unique).map(f => f.key))]));
  });

  const [tabFieldDefaultValues, setTabFieldDefaultValues] = useState<Record<string, Record<string, unknown>>>(() => {
    return Object.fromEntries(ALL_TABS.map(tabId => [
      tabId,
      Object.fromEntries((config.fields?.[tabId] || []).filter(f => f.defaultValue !== undefined).map(f => [f.key, f.defaultValue]))
    ]));
  });

  const [tabFieldPermissions, setTabFieldPermissions] = useState<Record<string, Record<string, string[]>>>(() => {
    return Object.fromEntries(ALL_TABS.map(tabId => [
      tabId,
      Object.fromEntries((config.fields?.[tabId] || []).filter(f => f.permissions).map(f => [f.key, f.permissions as string[]]))
    ]));
  });

  const [tabFieldOrder, setTabFieldOrder] = useState<Record<string, string[]>>(() => {
    return Object.fromEntries(ALL_TABS.map(tabId => {
      const orderArray = (config.fields?.[tabId] || []).map(f => f.key);
      return [tabId, orderArray];
    }));
  });

  const [prefs, setPrefs] = useState<ContactPrefs>(() => {
    try {
      const storedRaw = localStorage.getItem("mms_contact_prefs") ||
        localStorage.getItem("madrasa_contact_prefs");
      const stored = storedRaw ? (JSON.parse(storedRaw) as Partial<ContactPrefs>) : {};
      return { defaultCountry: "", defaultProvince: "", defaultCity: "", ...stored } as ContactPrefs;
    } catch {
      return { defaultCountry: "", defaultProvince: "", defaultCity: "" } as ContactPrefs;
    }
  });

  const [localPageTabs, setLocalPageTabs] = useState<TabDefinition[]>(() => config.pageTabs || []);
  const [localUiStrings, setLocalUiStrings] = useState<Record<string, string>>(() => ({
    ...DEFAULT_UI_STRINGS,
    ...(config.uiStrings || {}),
  }));
  const [uiStringsSearch, setUiStringsSearch] = useState<string>("");
  const [localFormTabs, setLocalFormTabs] = useState<TabDefinition[]>(() => config.formTabs || []);
  const [localDetailTabs, setLocalDetailTabs] = useState<TabDefinition[]>(() => config.detailTabs || []);
  const [localSettingsSubTabs, setLocalSettingsSubTabs] = useState<TabDefinition[]>(() => config.settingsSubTabs || []);

  const updateTabProperty = (
    tabType: "page" | "form" | "detail" | "settings",
    tabId: string,
    key: "label" | "enabled" | "order",
    value: string | boolean | number
  ) => {
    const updateFn = (prev: TabDefinition[]) =>
      prev.map((t) => (t.key === tabId ? { ...t, [key]: value } : t));
    
    if (tabType === "page") setLocalPageTabs(updateFn);
    else if (tabType === "form") setLocalFormTabs(updateFn);
    else if (tabType === "detail") setLocalDetailTabs(updateFn);
    else if (tabType === "settings") setLocalSettingsSubTabs(updateFn);
    setSaved(false);
  };

  const [saved, setSaved] = useState<boolean>(false);
  const [savedDefault, setSavedDefault] = useState<boolean>(false);

  const updPref = <K extends keyof ContactPrefs>(k: K, v: ContactPrefs[K]): void => {
    setPrefs((p) => ({ ...p, [k]: v }));
    setSaved(false);
  };

  const toggleTabEnabled = (id: string): void => {
    setEnabledTabs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setRequiredTabs((r) => {
          const nr = new Set(r);
          nr.delete(id);
          return nr;
        });
      } else {
        next.add(id);
      }
      return next;
    });
    setSaved(false);
  };

  const toggleTabRequired = (id: string): void => {
    setRequiredTabs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSaved(false);
  };

  const toggleFieldEnabled = (tabId: string, fieldId: string): void => {
    setTabFieldEnabled((prev) => {
      const updated = new Set(prev[tabId]);
      if (updated.has(fieldId)) {
        updated.delete(fieldId);
        setTabFieldRequired((r) => {
          const nr = new Set(r[tabId]);
          nr.delete(fieldId);
          return { ...r, [tabId]: nr };
        });
      } else {
        updated.add(fieldId);
      }
      return { ...prev, [tabId]: updated };
    });
    setSaved(false);
  };

  const toggleFieldRequired = (tabId: string, fieldId: string): void => {
    setTabFieldRequired((prev) => {
      const updated = new Set(prev[tabId]);
      if (updated.has(fieldId)) updated.delete(fieldId);
      else updated.add(fieldId);
      return { ...prev, [tabId]: updated };
    });
    setSaved(false);
  };

  const toggleFieldUnique = (tabId: string, fieldId: string): void => {
    setTabFieldUnique((prev) => {
      const updated = new Set(prev[tabId]);
      if (updated.has(fieldId)) updated.delete(fieldId);
      else updated.add(fieldId);
      return { ...prev, [tabId]: updated };
    });
    setSaved(false);
  };

  const handleReorder = (tabId: string, reorderedFields: FieldDefinition[]): void => {
    setTabFieldOrder((prev) => ({ ...prev, [tabId]: reorderedFields.map((f) => f.key) }));
    setSaved(false);
  };

  // When fields change via CustomFieldsBuilder (adding new field)
  const handleCustomFieldsChange = (tabId: string, newFields: CustomFieldConfig[]): void => {
    const newKeys = newFields.map((f) => f.key);
    setTabFieldOrder((prev) => ({
      ...prev,
      [tabId]: syncOrder(prev[tabId] || [], newKeys),
    }));
    setTabFields((prev) => ({ ...prev, [tabId]: newFields }));
    setSaved(false);
  };

  const handleEditField = (tabId: string, updatedField: FieldDefinition) => {
    setTabFields(prev => ({
      ...prev,
      [tabId]: (prev[tabId] || []).map(f => f.key === updatedField.key ? updatedField : f)
    }));
    setSaved(false);
  };

  const handleDeleteField = (tabId: string, fieldId: string) => {
    setTabFields(prev => ({
      ...prev,
      [tabId]: (prev[tabId] || []).filter(f => f.key !== fieldId)
    }));
    setTabFieldOrder(prev => ({
      ...prev,
      [tabId]: (prev[tabId] || []).filter(id => id !== fieldId)
    }));
    setSaved(false);
  };

  const buildFieldsMap = (): Record<string, FieldDefinition[]> => {
    const newFields: Record<string, FieldDefinition[]> = {};
    ALL_TABS.forEach(tabId => {
      const combined = (tabFields[tabId] || []).map(f => {
        const fieldKey = f.key || (f as { id?: string }).id || "";
        const enabled = tabFieldEnabled[tabId]?.has(fieldKey) ?? f.enabled ?? false;
        const required = tabFieldRequired[tabId]?.has(fieldKey) ?? f.required ?? false;
        const orderArray = tabFieldOrder[tabId] || [];
        const orderIdx = orderArray.indexOf(fieldKey);
        const order = orderIdx >= 0 ? orderIdx : (f.order ?? 999);
        const defaultValue = tabFieldDefaultValues[tabId]?.[fieldKey] ?? f.defaultValue;
        const permissions = tabFieldPermissions[tabId]?.[fieldKey] ?? f.permissions;
        const unique = tabFieldUnique[tabId]?.has(fieldKey) ?? f.unique ?? false;
        
        return {
          ...f,
          key: fieldKey,
          enabled,
          required,
          order,
          defaultValue,
          permissions,
          unique
        } as FieldDefinition;
      });

      newFields[tabId] = combined.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    });
    return newFields;
  };

  const handleSave = (): void => {
    const applyTitleCaseToTabs = (tabs: TabDefinition[]) => tabs.map(t => ({ ...t, label: toTitleCase(t.label) }));
    const cfg: FieldConfig = {
      version: CONFIG_VERSION,
      enabledTabs: Array.from(enabledTabs),
      requiredTabs: Array.from(requiredTabs),
      fields: buildFieldsMap(),
      pageTabs: applyTitleCaseToTabs(localPageTabs),
      formTabs: applyTitleCaseToTabs(localFormTabs),
      detailTabs: applyTitleCaseToTabs(localDetailTabs),
      settingsSubTabs: applyTitleCaseToTabs(localSettingsSubTabs),
      uiStrings: localUiStrings,
    };
    onConfigChange(cfg);
    const updatedPrefs = {
      ...prefs,
      defaultCountry: prefs.defaultCountry ? toTitleCase(prefs.defaultCountry.trim()) : "",
      defaultProvince: prefs.defaultProvince ? toTitleCase(prefs.defaultProvince.trim()) : "",
      defaultCity: prefs.defaultCity ? toTitleCase(prefs.defaultCity.trim()) : "",
    };
    setPrefs(updatedPrefs);
    updatePrefs(updatedPrefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = (): void => {
    setEnabledTabs(new Set(DEFAULT_ENABLED_TABS));
    setRequiredTabs(new Set(DEFAULT_REQUIRED_TABS));
    setTabFieldEnabled(
      Object.fromEntries(ALL_TABS.map((tabId) => [tabId, new Set((tabFields[tabId] || []).filter(f => f.enabled).map(f => f.key))]))
    );
    setTabFieldRequired(
      Object.fromEntries(ALL_TABS.map((tabId) => [tabId, new Set((tabFields[tabId] || []).filter(f => f.required).map(f => f.key))]))
    );
    setTabFieldDefaultValues(Object.fromEntries(ALL_TABS.map((tabId) => [tabId, {}])));
    setTabFieldPermissions(Object.fromEntries(ALL_TABS.map((tabId) => [tabId, {}])));
    setTabFieldOrder(
      Object.fromEntries(ALL_TABS.map((tabId) => [tabId, (tabFields[tabId] || []).map((f) => f.key)]))
    );
    const defaults = loadDefaultConfig();
    setLocalPageTabs(defaults.pageTabs || []);
    setLocalFormTabs(defaults.formTabs || []);
    setLocalDetailTabs(defaults.detailTabs || []);
    setLocalSettingsSubTabs(defaults.settingsSubTabs || []);
    setLocalUiStrings(DEFAULT_UI_STRINGS);
    setSaved(false);
  };

  const isUniqueField = (tabId: string, fieldId: string): boolean =>
    tabFieldUnique[tabId]?.has(fieldId) || false;

  const showFields = mode === "fields";
  const showPrefs = mode === "preferences";
  const showUiStrings = mode === "uistrings";

  const renderTabConfigList = (
    tabs: TabDefinition[],
    tabType: "page" | "form" | "detail" | "settings",
    title: string,
    description: string
  ) => {
    const sorted = [...tabs].sort((a, b) => a.order - b.order);
    return (
      <div className="space-y-3">
        <div>
          <p className="text-[13px] font-bold text-foreground">{title}</p>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>
        <div className="border border-border rounded-xl divide-y divide-border bg-card">
          {sorted.map((t) => (
            <div key={t.key} className="flex items-center gap-3 px-3 py-2 text-xs">
              <div className="w-24 font-mono font-semibold text-muted-foreground truncate" title={t.key}>
                {t.key}
              </div>
              <input
                type="text"
                value={t.label}
                onChange={(e) => updateTabProperty(tabType, t.key, "label", e.target.value)}
                className="flex-1 min-w-0 px-2 py-1 rounded border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Tab Label"
              />
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">{localUiStrings.tabOrderLabel}</span>
                <input
                  type="number"
                  value={t.order}
                  onChange={(e) => updateTabProperty(tabType, t.key, "order", parseInt(e.target.value) || 0)}
                  className="w-10 px-1 py-0.5 rounded border border-border bg-background text-foreground text-xs text-center focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => updateTabProperty(tabType, t.key, "enabled", !t.enabled)}
                className="relative flex items-center justify-center w-11 h-11 flex-shrink-0"
                aria-label={`${localUiStrings?.toggleTab || "Toggle tab"} ${t.key}`}
              >
                <div className="relative rounded-full transition-colors" style={{ width: 34, height: 18, backgroundColor: t.enabled ? "hsl(var(--primary))" : "hsl(var(--border))" }}>
                  <span style={{ width: 14, height: 14, top: 2, left: t.enabled ? 18 : 2, position: "absolute", borderRadius: "50%", background: "white", transition: "left 0.2s" }} />
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-3xl text-left">
      {showFields && (
        <>
          {/* Info */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-info/10 border border-info/30 text-sm text-info">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-info" />
            <div>
              <h3 className="font-semibold">{localUiStrings.dynamicFieldsHeading}</h3>
              <p className="text-xs mt-0.5 text-info/90">
                {localUiStrings.dynamicFieldsDescription}
              </p>
            </div>
          </div>

          {/* Contact Form Fields by Tab */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Layout className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">{localUiStrings.contactFormFieldsByTab}</h3>
              <span className="text-xs text-muted-foreground ml-1 flex items-center gap-1">
                <span>— {localUiStrings.dragToReorder} </span>
                <GripIcon />
                <span>{localUiStrings.toReorder}</span>
              </span>
            </div>

            {/* ── All tabs from registry ── */}
            {TAB_REGISTRY.map((tab) => {
              const tabId = tab.key;
              const tabLabel = tab.label.charAt(0).toUpperCase() + tab.label.slice(1);
              const tabDesc = tab.description;
              const tabDefs = tabFields[tabId] || [];
              const enabledSet = tabFieldEnabled[tabId] || new Set();
              const requiredSet = tabFieldRequired[tabId] || new Set();
              const isOn = tabId === "basic" ? true : enabledTabs.has(tabId);
              const isReq = requiredTabs.has(tabId);

              return (
                <section key={tabId} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/30 border-b border-border">
                    <button
                      type="button"
                      onClick={tabId !== "basic" ? () => toggleTabEnabled(tabId) : undefined}
                      className={`w-11 h-11 flex-shrink-0 flex items-center justify-center transition-all ${
                        tabId === "basic" ? "cursor-default" : "cursor-pointer"
                      }`}
                      aria-label={`${localUiStrings?.enableTab || "Enable"} ${tabLabel}`}
                      disabled={tabId === "basic"}
                    >
                      <div className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${
                        isOn ? "bg-primary border-primary" : "border-border bg-background"
                      }`}>
                        {isOn && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{tabLabel}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{tabDesc}</p>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                      {tabDefs.filter((f) => enabledSet.has(f.key)).length}/{tabDefs.length}
                    </span>
                    {tabId !== "basic" && isOn && (
                      <button
                        type="button"
                        onClick={() => toggleTabRequired(tabId)}
                        className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all
                          ${
                            isReq
                              ? "bg-destructive/10 border-destructive/30 text-destructive"
                              : "bg-muted border-border text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        {isReq ? localUiStrings.fieldRequired : localUiStrings.fieldOptional}
                      </button>
                    )}
                  </div>

                  {isOn && (
                    <div className="p-3 space-y-3">
                      <DraggableFieldList
                        tabId={tabId}
                        fields={getOrderedFields(tabDefs, tabFieldOrder[tabId])}
                        enabledSet={enabledSet}
                        requiredSet={requiredSet}
                        onToggleEnabled={(fieldId) => toggleFieldEnabled(tabId, fieldId)}
                        onToggleRequired={(fieldId) => toggleFieldRequired(tabId, fieldId)}
                        onToggleUnique={(fieldId) => toggleFieldUnique(tabId, fieldId)}
                        onReorder={(reordered) => handleReorder(tabId, reordered)}
                        isUniqueField={isUniqueField}
                        defaultValues={tabFieldDefaultValues[tabId]}
                        permissions={tabFieldPermissions[tabId]}
                        onChangeDefaults={(fieldId, val) => {
                          setTabFieldDefaultValues(prev => ({ ...prev, [tabId]: { ...prev[tabId], [fieldId]: val } }));
                          setSaved(false);
                        }}
                        onChangePermissions={(fieldId, roles) => {
                          setTabFieldPermissions(prev => ({ ...prev, [tabId]: { ...prev[tabId], [fieldId]: roles } }));
                          setSaved(false);
                        }}
                        onEditField={(f) => handleEditField(tabId, f)}
                        onDeleteField={(id) => handleDeleteField(tabId, id)}
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
          </div>
          {/* Table Column Customization */}
          <section className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
              <div className="flex items-center gap-2.5">
                <List className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">{localUiStrings.tableColumnsRegistry}</span>
              </div>
              <ColumnCustomizer />
            </div>
            <div className="p-4">
              <p className="text-xs text-muted-foreground">
                {localUiStrings.tableColumnsDescription}
              </p>
            </div>
          </section>

          {/* Option Lists Management */}
          <section className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/30 border-b border-border">
              <List className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">{localUiStrings.predefinedOptionsManagement}</span>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                {localUiStrings.predefinedOptionsDescription}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="w-full sm:w-1/3 text-left">
                  <label className={LABEL} htmlFor="list-selector">{localUiStrings.selectListToConfigure}</label>
                  <FormSelect
                    id="list-selector"
                    value={listKey}
                    onChange={(val) => {
                      setListKey(val);
                      setNewItemText("");
                      setNewCountryName("");
                      setNewCountryCode("");
                      setNewTemplateLabel("");
                      setNewTemplateBody("");
                    }}
                    options={SETTINGS_LIST_OPTIONS}
                  />
                </div>

                <div className="flex-1 space-y-3 text-left">
                  {listKey === "countryCodes" ? (
                    <div className="flex gap-2 items-end">
                      <div className="flex-1 text-left">
                        <label className={LABEL} htmlFor="new-country-name">{localUiStrings.countryNameLabel}</label>
                        <input
                          id="new-country-name"
                          className={INPUT}
                          value={newCountryName}
                          onChange={(e) => setNewCountryName(e.target.value)}
                          placeholder={localUiStrings.countryNamePlaceholder}
                        />
                      </div>
                      <div className="w-24 text-left">
                        <label className={LABEL} htmlFor="new-country-code">{localUiStrings.dialCodeLabel}</label>
                        <input
                          id="new-country-code"
                          className={INPUT}
                          value={newCountryCode}
                          onChange={(e) => setNewCountryCode(e.target.value)}
                          placeholder={localUiStrings.dialCodePlaceholder}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCountry}
                        className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center min-h-[44px] min-w-[44px]"
                        title={localUiStrings.addCountryTitle}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : listKey === "whatsappTemplates" ? (
                    <div className="flex flex-col gap-2 w-full text-left">
                      <div className="flex gap-2 items-end">
                        <div className="flex-1 text-left">
                          <label className={LABEL} htmlFor="new-template-label">{localUiStrings.templateLabelLabel}</label>
                          <input
                            id="new-template-label"
                            className={INPUT}
                            value={newTemplateLabel}
                            onChange={(e) => setNewTemplateLabel(e.target.value)}
                            placeholder={localUiStrings.templateLabelPlaceholder}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1 text-left">
                          <label className={LABEL} htmlFor="new-template-body">{localUiStrings.templateBodyLabel}</label>
                          <textarea
                            id="new-template-body"
                            className={INPUT + " min-h-[60px] resize-none"}
                            value={newTemplateBody}
                            onChange={(e) => setNewTemplateBody(e.target.value)}
                            placeholder={localUiStrings.templateBodyPlaceholder}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddWhatsappTemplate}
                          className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center min-h-[44px] min-w-[44px] mb-1"
                          title={localUiStrings.addTemplateTitle}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : listKey === "lifecycleStages" ? (
                    <div className="flex gap-2 items-end">
                      <div className="flex-1 text-left">
                        <label className={LABEL} htmlFor="new-item-text">{localUiStrings.addNewStageLabel}</label>
                        <input
                          id="new-item-text"
                          className={INPUT}
                          value={newItemText}
                          onChange={(e) => setNewItemText(e.target.value)}
                          placeholder={localUiStrings.newStagePlaceholder}
                        />
                      </div>
                      <div className="w-32 text-left">
                        <label className={LABEL} htmlFor="new-stage-color">{localUiStrings.stageColorLabel}</label>
                        <FormSelect
                          id="new-stage-color"
                          value={newStageColor}
                          onChange={(val) => setNewStageColor(val)}
                          options={Object.keys(COLOR_PALETTES).map((k) => ({
                            value: k,
                            label: k.charAt(0).toUpperCase() + k.slice(1),
                          }))}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center min-h-[44px] min-w-[44px]"
                        title={localUiStrings.addOptionTitle}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 items-end">
                      <div className="flex-1 text-left">
                        <label className={LABEL} htmlFor="new-item-text">{localUiStrings.addNewOptionLabel}</label>
                        <input
                          id="new-item-text"
                          className={INPUT}
                          value={newItemText}
                          onChange={(e) => setNewItemText(e.target.value)}
                          placeholder={localUiStrings.newOptionPlaceholder}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center min-h-[44px] min-w-[44px]"
                        title={localUiStrings.addOptionTitle}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Items Display */}
                  <div className="border border-border rounded-lg max-h-[200px] overflow-y-auto divide-y divide-border bg-card">
                    {listKey === "countryCodes" ? (
                      countryCodes.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">{localUiStrings.noCountriesConfigured}</p>
                      ) : (
                        countryCodes.map((c) => (
                          <div key={c.country} className="flex items-center justify-between px-3 py-2 text-xs">
                            <span className="font-semibold text-foreground">{c.country}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-muted-foreground">{c.code}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCountry(c.country)}
                                className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded transition-colors ${localUiStrings?.deleteActionClass || "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"}`}
                                title={`${localUiStrings.removeTitle} ${c.country}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )
                    ) : listKey === "whatsappTemplates" ? (
                      whatsappTemplates.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">{localUiStrings.noWhatsappTemplatesConfigured}</p>
                      ) : (
                whatsappTemplates.map((t) => (
                          <div key={t.id} className="flex items-start justify-between px-3 py-2 text-xs">
                            <div className="flex-1 min-w-0 pr-2">
                              <span className="font-semibold text-foreground block">{t.label}</span>
                              <span className="text-[11px] text-muted-foreground block truncate">{t.body}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveWhatsappTemplate(t.id)}
                              className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded transition-colors ${localUiStrings?.deleteActionClass || "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"} self-center`}
                              title={`${localUiStrings.removeTitle} ${t.label}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )
                    ) : (
                      (() => {
                        const items =
                          listKey === "genders" ? genders :
                          listKey === "lifecycleStages" ? lifecycleStages :
                          listKey === "socialPlatforms" ? socialPlatforms :
                          listKey === "relationships" ? relationships :
                          listKey === "phoneLabels" ? phoneLabels :
                          listKey === "emailLabels" ? emailLabels :
                          addressLabels;
                        return items.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">{localUiStrings.noOptionsConfigured}</p>
                        ) : (
                          items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between px-3 py-2 text-xs font-semibold">
                              <span className="text-foreground">{item}</span>
                              <div className="flex items-center gap-2">
                                {listKey === "lifecycleStages" && (
                                  <FormSelect
                                    className="w-32"
                                    aria-label={localUiStrings.stageColorThemeTitle}
                                    value={Object.keys(COLOR_PALETTES).find(k => {
                                      const palette = COLOR_PALETTES[k as keyof typeof COLOR_PALETTES];
                                      const stageColor = lifecycleColors[item];
                                      return palette && stageColor && palette.bg === stageColor.bg;
                                    }) || "blue"}
                                    onChange={(chosenColor) => {
                                      const updatedColors = {
                                        ...lifecycleColors,
                                        [item]: COLOR_PALETTES[chosenColor as keyof typeof COLOR_PALETTES] || COLOR_PALETTES.blue
                                      };
                                      updateLifecycleColors(updatedColors);
                                    }}
                                    options={Object.keys(COLOR_PALETTES).map((k) => ({ value: k, label: k.charAt(0).toUpperCase() + k.slice(1) }))}
                                  />
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded transition-colors ${localUiStrings?.deleteActionClass || "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"}`}
                                  title={`${localUiStrings.removeTitle} ${item}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        );
                      })()
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {showPrefs && (
        <>
          {/* General prefs */}
          <section className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/30 border-b border-border">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">{localUiStrings.generalPreferences}</span>
            </div>
            <div className="p-4 space-y-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={LABEL} htmlFor="defaultCountry">{localUiStrings.defaultCountryLabel}</label>
                  <input
                    id="defaultCountry"
                    className={INPUT}
                    value={prefs.defaultCountry || ""}
                    onChange={(e) => updPref("defaultCountry", e.target.value)}
                    placeholder={localUiStrings.defaultCountryPlaceholder}
                  />
                </div>
                <div>
                  <label className={LABEL} htmlFor="defaultProvince">{localUiStrings.defaultProvinceLabel}</label>
                  <input
                    id="defaultProvince"
                    className={INPUT}
                    value={prefs.defaultProvince || ""}
                    onChange={(e) => updPref("defaultProvince", e.target.value)}
                    placeholder={localUiStrings.defaultProvincePlaceholder}
                  />
                </div>
                <div>
                  <label className={LABEL} htmlFor="defaultCity">{localUiStrings.defaultCityLabel}</label>
                  <input
                    id="defaultCity"
                    className={INPUT}
                    value={prefs.defaultCity || ""}
                    onChange={(e) => updPref("defaultCity", e.target.value)}
                    placeholder={localUiStrings.defaultCityPlaceholder}
                  />
                </div>
              </div>
              <Toggle
                label={localUiStrings.autoSuggestMergesLabel}
                description={localUiStrings.autoSuggestMergesDescription}
                value={prefs.autoMergeSuggestions !== false}
                onChange={(v) => updPref("autoMergeSuggestions", v)}
                ariaLabel={`${localUiStrings.toggleOption} ${localUiStrings.autoSuggestMergesLabel}`}
              />
              <Toggle
                label={localUiStrings.showWhatsAppActionsLabel}
                description={localUiStrings.showWhatsAppActionsDescription}
                value={prefs.showWhatsApp !== false}
                onChange={(v) => updPref("showWhatsApp", v)}
                ariaLabel={`${localUiStrings.toggleOption} ${localUiStrings.showWhatsAppActionsLabel}`}
              />
              <div className="py-3 border-t border-border mt-3 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-foreground">{localUiStrings.defaultViewLayout}</p>
                  <p className="text-[11px] text-muted-foreground">{localUiStrings.defaultViewLayoutDescription}</p>
                </div>
                <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => updPref("defaultViewLayout", "list")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      (prefs.defaultViewLayout || "list") === "list"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {localUiStrings.listViewLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => updPref("defaultViewLayout", "kanban")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      prefs.defaultViewLayout === "kanban"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {localUiStrings.kanbanBoardLabel}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Module Layout & Tabs */}
          <section className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/30 border-b border-border">
              <Layout className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">{localUiStrings.moduleLayoutAndTabs}</span>
            </div>
            <div className="p-4 space-y-6">
              <p className="text-xs text-muted-foreground">
                {localUiStrings.moduleLayoutDescription}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderTabConfigList(localPageTabs, "page", localUiStrings.pageTabsTitle, localUiStrings.pageTabsDescription)}
                {renderTabConfigList(localFormTabs, "form", localUiStrings.formTabsTitle, localUiStrings.formTabsDescription)}
                {renderTabConfigList(localDetailTabs, "detail", localUiStrings.detailTabsTitle, localUiStrings.detailTabsDescription)}
                {renderTabConfigList(localSettingsSubTabs, "settings", localUiStrings.settingsSubTabsTitle, localUiStrings.settingsSubTabsDescription)}
              </div>
            </div>
          </section>
        </>
      )}
      {showUiStrings && (
        <section className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-info/10 border border-info/30 text-sm text-info">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-info" />
            <div>
              <h3 className="font-semibold">{localUiStrings.customizeModuleUiText}</h3>
              <p className="text-xs mt-0.5 text-info/90">
                {localUiStrings.customizeModuleUiDescription}
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={localUiStrings.searchUiStrings}
              value={uiStringsSearch}
              onChange={(e) => setUiStringsSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-border text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-1 border border-border rounded-xl p-4 bg-card">
            {Object.keys(DEFAULT_UI_STRINGS)
              .filter((key) => {
                const label = key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim();
                const currentVal = localUiStrings[key] || "";
                const defaultVal = DEFAULT_UI_STRINGS[key] || "";
                const search = uiStringsSearch.toLowerCase();
                return (
                  label.toLowerCase().includes(search) ||
                  key.toLowerCase().includes(search) ||
                  currentVal.toLowerCase().includes(search) ||
                  defaultVal.toLowerCase().includes(search)
                );
              })
              .map((key) => {
                const label = key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/_/g, " ")
                  .replace(/^\w/, (c) => c.toUpperCase())
                  .trim();
                return (
                  <div key={key} className="space-y-1 text-left">
                    <div className="flex justify-between items-baseline">
                      <label className="text-xs font-semibold text-foreground" htmlFor={`ui-string-${key}`}>{label}</label>
                      <span className="text-[9px] font-mono text-muted-foreground">{key}</span>
                    </div>
                    <input
                      id={`ui-string-${key}`}
                      type="text"
                      value={localUiStrings[key] ?? ""}
                      onChange={(e) => {
                        setLocalUiStrings((prev) => ({ ...prev, [key]: e.target.value }));
                        setSaved(false);
                      }}
                      className={INPUT}
                      placeholder={DEFAULT_UI_STRINGS[key]}
                    />
                    <p className="text-[10px] text-muted-foreground italic">
                      {localUiStrings.defaultPrefix} "{DEFAULT_UI_STRINGS[key]}"
                    </p>
                  </div>
                );
              })}
          </div>
        </section>
      )}


      {/* Save / reset */}
      <div className="flex items-center gap-3 pt-2 border-t border-border sticky bottom-0 bg-background pb-2 flex-wrap">
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 px-5 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>{saved ? localUiStrings.saved : localUiStrings.saveAndApply}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            saveDefaultConfig({
              version: CONFIG_VERSION,
              enabledTabs: Array.from(enabledTabs),
              requiredTabs: Array.from(requiredTabs),
              fields: buildFieldsMap(),
              pageTabs: localPageTabs,
              formTabs: localFormTabs,
              detailTabs: localDetailTabs,
              settingsSubTabs: localSettingsSubTabs,
              uiStrings: localUiStrings,
            });
            setSavedDefault(true);
            setTimeout(() => setSavedDefault(false), 2500);
          }}
          className="flex items-center gap-2 px-4 min-h-[44px] rounded-xl border border-warning/30 bg-warning/10 text-sm font-medium text-warning hover:bg-warning/20 transition-colors"
        >
          <Star className="w-4 h-4" />
          <span>{savedDefault ? localUiStrings.setAsDefaultConfirm : localUiStrings.setAsDefault}</span>
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-2 px-4 min-h-[44px] rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors bg-card"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{localUiStrings.resetToDefaults}</span>
        </button>
      </div>
    </div>
  );
}

/** Tiny inline icon to avoid import just for text */
function GripIcon(): React.JSX.Element {
  return <span className="inline-block align-middle opacity-60">⠿</span>;
}
