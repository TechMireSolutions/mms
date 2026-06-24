import React, { useState } from "react";
import { Check, Save, Info, Users, Layout, GripVertical } from "lucide-react";
import {
  TAB_REGISTRY, DEFAULT_ENABLED_TABS, DEFAULT_REQUIRED_TABS,
  FieldConfig, ContactPreferences, TabDefinition,
  CONFIG_VERSION,
  FieldDefinition, toTitleCase as sharedToTitleCase,
  DEFAULT_COLUMN_REGISTRY,
  getContactFieldRemovalIssues,
} from "@mms/shared";
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import CustomFieldsBuilder, { CustomFieldConfig } from "../ui/CustomFieldsBuilder";
import CoreFieldEditorList from "../ui/CoreFieldEditorList";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import useTranslation from "@/hooks/useTranslation";
import { useContactMutations } from "@/hooks/useContacts";
import { apiJson } from "@/lib/apiClient";
import { CONTACTS_MODULE_CONTRACT } from "@mms/shared";
import { notify } from "@/lib/notify";

const toTitleCase = (str: string): string => sharedToTitleCase(str) as string;

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
        aria-label={ariaLabel || label}
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

interface ContactsSetupPanelProps {
  config: FieldConfig;
  onConfigChange: (config: FieldConfig) => void;
  mode?: "fields" | "preferences";
}

/**
 * ContactsSetupPanel component providing a full dynamic field configuration UI.
 * @param props Component properties.
 * @returns React element.
 */
export default function ContactsSetupPanel({ config, onConfigChange, mode }: ContactsSetupPanelProps): React.JSX.Element {
  const { updatePrefs, prefs: contextPrefs } = useContactConfig();
  const { logSetupAudit } = useContactMutations();
  const { t } = useTranslation();

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

  const [prefs, setPrefs] = useState<ContactPreferences>(() => contextPrefs);

  const [saved, setSaved] = useState<boolean>(false);
  const updPref = <K extends keyof ContactPreferences>(k: K, v: ContactPreferences[K]): void => {
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

  const handleDeleteField = async (tabId: string, fieldId: string) => {
    const issues = getContactFieldRemovalIssues({
      fieldKey: fieldId,
      columnRegistry: config.columnRegistry || DEFAULT_COLUMN_REGISTRY,
      prefs: contextPrefs,
    });
    if (issues.length > 0) {
      const issue = issues[0];
      notify.error(
        t(issue.messageKey as Parameters<typeof t>[0], issue.count !== undefined ? { count: issue.count } : undefined),
      );
      return;
    }

    try {
      const { count } = await apiJson<{ count: number }>(
        `${CONTACTS_MODULE_CONTRACT.restBasePath}/field-usage/${encodeURIComponent(fieldId)}`,
      );
      if (count > 0) {
        notify.error(t("contacts.setup.fieldHasContactData", { count }));
        return;
      }
    } catch {
      notify.error(t("contacts.saveFailed"));
      return;
    }
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
    const applyTitleCaseToTabs = (tabs: TabDefinition[]) => tabs.map((tab) => ({ ...tab, label: toTitleCase(tab.label) }));
    const cfg: FieldConfig = {
      version: CONFIG_VERSION,
      enabledTabs: Array.from(enabledTabs),
      requiredTabs: Array.from(requiredTabs),
      fields: buildFieldsMap(),
      pageTabs: applyTitleCaseToTabs(config.pageTabs || []),
      formTabs: applyTitleCaseToTabs(config.formTabs || []),
      detailTabs: applyTitleCaseToTabs(config.detailTabs || []),
      settingsSubTabs: applyTitleCaseToTabs(config.settingsSubTabs || []),
      columnRegistry: config.columnRegistry,
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
    const auditArea = showPrefs ? "preferences" : "fields";
    void logSetupAudit.mutateAsync({
      area: auditArea,
      summary: t("contacts.setup.auditSummary", { area: auditArea }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const isUniqueField = (tabId: string, fieldId: string): boolean =>
    tabFieldUnique[tabId]?.has(fieldId) || false;

  const showFields = mode === "fields";
  const showPrefs = mode === "preferences";

  return (
    <div className="space-y-6 max-w-3xl text-left">
      {showFields && (
        <>
          
          <div className="flex items-start gap-3 p-4 rounded-xl bg-info/10 border border-info/30 text-sm text-info">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-info" />
            <div>
              <h3 className="font-semibold">{t('contacts.setup.fieldsIntroTitle')}</h3>
              <p className="text-xs mt-0.5 text-info/90">
                {t('contacts.setup.fieldsIntroDescription')}
              </p>
            </div>
          </div>

          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Layout className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">{t('contacts.setup.fieldsByTab')}</h3>
              <span className="text-xs text-muted-foreground ml-1 flex items-center gap-1">
                <span>— {t('contacts.setup.dragToReorder')} </span>
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground/60 inline align-middle" />
                <span>{t('contacts.setup.toReorder')}</span>
              </span>
            </div>

            
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
                      aria-label={`${t('contacts.setup.enableTab')} ${tabLabel}`}
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
                        {isReq ? t('contacts.setup.fieldRequired') : t('contacts.setup.fieldOptional')}
                      </button>
                    )}
                  </div>

                  {isOn && (
                    <div className="p-3 space-y-3">
                      <CoreFieldEditorList
                        tabId={tabId}
                        fields={getOrderedFields(tabDefs, tabFieldOrder[tabId])}
                        enabledSet={enabledSet}
                        requiredSet={requiredSet}
                        onToggleEnabled={(fieldId: string) => toggleFieldEnabled(tabId, fieldId)}
                        onToggleRequired={(fieldId: string) => toggleFieldRequired(tabId, fieldId)}
                        onToggleUnique={(fieldId: string) => toggleFieldUnique(tabId, fieldId)}
                        onReorder={(reordered: FieldDefinition[]) => handleReorder(tabId, reordered)}
                        isUniqueField={isUniqueField}
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
        </>
      )}

      {showPrefs && (
        <>
          
          <section className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/30 border-b border-border">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">{t('contacts.setup.generalPreferences')}</span>
            </div>
            <div className="p-4 space-y-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={FORM_LABEL} htmlFor="defaultCountry">{t('contacts.setup.defaultCountry')}</label>
                  <input
                    id="defaultCountry"
                    className={FORM_INPUT}
                    value={prefs.defaultCountry || ""}
                    onChange={(e) => updPref("defaultCountry", e.target.value)}
                    placeholder={t('contacts.setup.defaultCountryPlaceholder')}
                  />
                </div>
                <div>
                  <label className={FORM_LABEL} htmlFor="defaultProvince">{t('contacts.setup.defaultProvince')}</label>
                  <input
                    id="defaultProvince"
                    className={FORM_INPUT}
                    value={prefs.defaultProvince || ""}
                    onChange={(e) => updPref("defaultProvince", e.target.value)}
                    placeholder={t('contacts.setup.defaultProvincePlaceholder')}
                  />
                </div>
                <div>
                  <label className={FORM_LABEL} htmlFor="defaultCity">{t('contacts.setup.defaultCity')}</label>
                  <input
                    id="defaultCity"
                    className={FORM_INPUT}
                    value={prefs.defaultCity || ""}
                    onChange={(e) => updPref("defaultCity", e.target.value)}
                    placeholder={t('contacts.setup.defaultCityPlaceholder')}
                  />
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-border sticky bottom-0 bg-background pb-2 flex-wrap">
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 px-5 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>{saved ? t('contacts.form.saved') : t('contacts.setup.saveAndApply')}</span>
        </button>
      </div>
    </div>
  );
}
