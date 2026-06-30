import React, { useState } from "react";
import { Save, Info, Users, Layout, GripVertical, Plus, Trash2 } from "lucide-react";
import {
  DEFAULT_ENABLED_TABS, DEFAULT_REQUIRED_TABS,
  FieldConfig, ContactPreferences, TabDefinition,
  CONFIG_VERSION,
  FieldDefinition, toTitleCase as sharedToTitleCase,
  DEFAULT_COLUMN_REGISTRY,
  getContactFieldRemovalIssues,
  DEFAULT_FORM_TABS,
} from "@mms/shared";
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import { CustomFieldsBuilder, CustomFieldConfig } from "../ui/CustomFieldsBuilder";
import { CoreFieldEditorList } from "../ui/CoreFieldEditorList";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactMutations } from "@/hooks/useContacts";
import { apiJson } from "@/lib/apiClient";
import { CONTACTS_MODULE_CONTRACT } from "@mms/shared";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

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
      <Switch
        checked={value}
        onCheckedChange={onChange}
        aria-label={ariaLabel || label}
      />
    </div>
  );
}

/**
 * Returns core + custom fields for a tab in the saved order.
 */
function getOrderedFields(fields: FieldDefinition[], savedOrder: string[] | undefined): FieldDefinition[] {
  if (!savedOrder || savedOrder.length === 0) return fields;
  const orderByKey = Object.fromEntries(savedOrder.map((key, index) => [key, index]));
  return [...fields].sort((leftField, rightField) => (orderByKey[leftField.key] ?? 9999) - (orderByKey[rightField.key] ?? 9999)) as FieldDefinition[];
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

  const [formTabs, setFormTabs] = useState<TabDefinition[]>(() => {
    return config.formTabs && config.formTabs.length > 0
      ? config.formTabs
      : DEFAULT_FORM_TABS;
  });

  const [newTabName, setNewTabName] = useState("");

  const getInitialTabs = (): TabDefinition[] => {
    return config.formTabs && config.formTabs.length > 0 ? config.formTabs : DEFAULT_FORM_TABS;
  };

  const [tabFields, setTabFields] = useState<Record<string, FieldDefinition[]>>(() => {
    return Object.fromEntries(getInitialTabs().map(tab => [tab.key, config.fields?.[tab.key] || []]));
  });

  const [tabFieldEnabled, setTabFieldEnabled] = useState<Record<string, Set<string>>>(() => {
    return Object.fromEntries(getInitialTabs().map(tab => [
      tab.key,
      new Set((config.fields?.[tab.key] || []).filter((field) => field.enabled).map((field) => field.key))
    ]));
  });

  const [tabFieldRequired, setTabFieldRequired] = useState<Record<string, Set<string>>>(() => {
    return Object.fromEntries(getInitialTabs().map(tab => [
      tab.key,
      new Set((config.fields?.[tab.key] || []).filter((field) => field.required).map((field) => field.key))
    ]));
  });

  const [tabFieldUnique, setTabFieldUnique] = useState<Record<string, Set<string>>>(() => {
    return Object.fromEntries(getInitialTabs().map(tab => [
      tab.key,
      new Set((config.fields?.[tab.key] || []).filter((field) => field.unique).map((field) => field.key))
    ]));
  });

  const [tabFieldDefaultValues, setTabFieldDefaultValues] = useState<Record<string, Record<string, unknown>>>(() => {
    return Object.fromEntries(getInitialTabs().map(tab => [
      tab.key,
      Object.fromEntries((config.fields?.[tab.key] || []).filter((field) => field.defaultValue !== undefined).map((field) => [field.key, field.defaultValue]))
    ]));
  });

  const [tabFieldPermissions, setTabFieldPermissions] = useState<Record<string, Record<string, string[]>>>(() => {
    return Object.fromEntries(getInitialTabs().map(tab => [
      tab.key,
      Object.fromEntries((config.fields?.[tab.key] || []).filter((field) => field.permissions).map((field) => [field.key, field.permissions as string[]]))
    ]));
  });

  const [tabFieldOrder, setTabFieldOrder] = useState<Record<string, string[]>>(() => {
    return Object.fromEntries(getInitialTabs().map(tab => {
      const orderArray = (config.fields?.[tab.key] || []).map((field) => field.key);
      return [tab.key, orderArray];
    }));
  });

  const [prefs, setPrefs] = useState<ContactPreferences>(() => contextPrefs);

  const handleAddTab = () => {
    const name = newTabName.trim();
    if (!name) return;

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    
    const generatedId = `custom_${slug}`;
    
    if (!slug) {
      notify.error("Invalid tab name. Must contain alphanumeric characters.");
      return;
    }

    if (formTabs.some((t) => t.key === generatedId)) {
      notify.error("A tab with this name or ID already exists.");
      return;
    }

    const newTab: TabDefinition = {
      key: generatedId,
      label: name,
      enabled: true,
      order: formTabs.length,
      isSystem: false,
    };

    setFormTabs((prev) => [...prev, newTab]);
    setTabFields((prev) => ({ ...prev, [generatedId]: [] }));
    setTabFieldEnabled((prev) => ({ ...prev, [generatedId]: new Set() }));
    setTabFieldRequired((prev) => ({ ...prev, [generatedId]: new Set() }));
    setTabFieldUnique((prev) => ({ ...prev, [generatedId]: new Set() }));
    setTabFieldDefaultValues((prev) => ({ ...prev, [generatedId]: {} }));
    setTabFieldPermissions((prev) => ({ ...prev, [generatedId]: {} }));
    setTabFieldOrder((prev) => ({ ...prev, [generatedId]: [] }));
    setEnabledTabs((prev) => {
      const next = new Set(prev);
      next.add(generatedId);
      return next;
    });

    setNewTabName("");
    setSaved(false);
    notify.success(`Tab "${name}" created successfully.`);
  };

  const handleDeleteTab = (tabId: string) => {
    const tab = formTabs.find((t) => t.key === tabId);
    if (!tab) return;
    if (tab.isSystem) {
      notify.error("System tabs cannot be deleted.");
      return;
    }

    const tabDefs = tabFields[tabId] || [];
    if (tabDefs.length > 0) {
      notify.error(t("contacts.setup.removeTabFieldsFirst"));
      return;
    }

    if (!window.confirm(t("contacts.setup.deleteCustomTab", { tab: tab.label }))) {
      return;
    }

    setFormTabs((prev) => prev.filter((tab) => tab.key !== tabId));
    setTabFields((prev) => {
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
    setTabFieldEnabled((prev) => {
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
    setTabFieldRequired((prev) => {
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
    setTabFieldUnique((prev) => {
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
    setTabFieldDefaultValues((prev) => {
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
    setTabFieldPermissions((prev) => {
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
    setTabFieldOrder((prev) => {
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
    setEnabledTabs((prev) => {
      const next = new Set(prev);
      next.delete(tabId);
      return next;
    });
    setRequiredTabs((prev) => {
      const next = new Set(prev);
      next.delete(tabId);
      return next;
    });

    setSaved(false);
    notify.success(`Tab "${tab.label}" deleted.`);
  };

  const [saved, setSaved] = useState<boolean>(false);
  const updatePreference = <K extends keyof ContactPreferences>(key: K, value: ContactPreferences[K]): void => {
    setPrefs((currentPreferences) => ({ ...currentPreferences, [key]: value }));
    setSaved(false);
  };

  const toggleTabEnabled = (id: string): void => {
    setEnabledTabs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setRequiredTabs((currentRequiredTabs) => {
          const nextRequiredTabs = new Set(currentRequiredTabs);
          nextRequiredTabs.delete(id);
          return nextRequiredTabs;
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
        setTabFieldRequired((currentRequiredFields) => {
          const nextRequiredFields = new Set(currentRequiredFields[tabId]);
          nextRequiredFields.delete(fieldId);
          return { ...currentRequiredFields, [tabId]: nextRequiredFields };
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
    setTabFieldOrder((prev) => ({ ...prev, [tabId]: reorderedFields.map((field) => field.key) }));
    setSaved(false);
  };
  const handleCustomFieldsChange = (tabId: string, newFields: CustomFieldConfig[]): void => {
    const newKeys = newFields.map((field) => field.key);
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
      [tabId]: (prev[tabId] || []).map((field) => field.key === updatedField.key ? updatedField : field)
    }));
    setSaved(false);
  };

  const handleDeleteField = async (tabId: string, fieldId: string) => {
    const issues = getContactFieldRemovalIssues({
      fieldKey: fieldId,
      columnRegistry: config.columnRegistry || DEFAULT_COLUMN_REGISTRY,
      preferences: contextPrefs,
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
      [tabId]: (prev[tabId] || []).filter((field) => field.key !== fieldId)
    }));
    setTabFieldOrder(prev => ({
      ...prev,
      [tabId]: (prev[tabId] || []).filter(id => id !== fieldId)
    }));
    setSaved(false);
  };

  const buildFieldsMap = (): Record<string, FieldDefinition[]> => {
    const newFields: Record<string, FieldDefinition[]> = {};
    formTabs.forEach(tabDef => {
      const tabId = tabDef.key;
      const combined = (tabFields[tabId] || []).map((field) => {
        const fieldKey = field.key || (field as { id?: string }).id || "";
        const enabled = tabFieldEnabled[tabId]?.has(fieldKey) ?? field.enabled ?? false;
        const required = tabFieldRequired[tabId]?.has(fieldKey) ?? field.required ?? false;
        const orderArray = tabFieldOrder[tabId] || [];
        const orderIdx = orderArray.indexOf(fieldKey);
        const order = orderIdx >= 0 ? orderIdx : (field.order ?? 999);
        const defaultValue = tabFieldDefaultValues[tabId]?.[fieldKey] ?? field.defaultValue;
        const permissions = tabFieldPermissions[tabId]?.[fieldKey] ?? field.permissions;
        const unique = tabFieldUnique[tabId]?.has(fieldKey) ?? field.unique ?? false;
        
        return {
          ...field,
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
    const updatedConfig: FieldConfig = {
      version: CONFIG_VERSION,
      enabledTabs: Array.from(enabledTabs),
      requiredTabs: Array.from(requiredTabs),
      fields: buildFieldsMap(),
      pageTabs: applyTitleCaseToTabs(config.pageTabs || []),
      formTabs: applyTitleCaseToTabs(formTabs),
      detailTabs: applyTitleCaseToTabs(config.detailTabs || []),
      settingsSubTabs: applyTitleCaseToTabs(config.settingsSubTabs || []),
      columnRegistry: config.columnRegistry,
    };
    onConfigChange(updatedConfig);
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
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">{t('contacts.setup.fieldsByTab')}</h3>
                <span className="text-xs text-muted-foreground ml-1 flex items-center gap-1">
                  <span>— {t('contacts.setup.dragToReorder')} </span>
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground/60 inline align-middle" />
                  <span>{t('contacts.setup.toReorder')}</span>
                </span>
              </div>
            </div>


            {formTabs.map((tab) => {
              const tabId = tab.key;
              const tabLabel = tab.label.charAt(0).toUpperCase() + tab.label.slice(1);
              const tabDesc = tab.description || (tab.isSystem === false ? t("contacts.setup.customTabDescription") : "");
              const tabDefs = tabFields[tabId] || [];
              const enabledSet = tabFieldEnabled[tabId] || new Set();
              const requiredSet = tabFieldRequired[tabId] || new Set();
              const isOn = tabId === "basic" ? true : enabledTabs.has(tabId);
              const isReq = requiredTabs.has(tabId);

              return (
                <section key={tabId} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/30 border-b border-border">
                    <div className="flex-shrink-0 flex items-center justify-center w-11 h-11">
                      <Checkbox
                        checked={isOn}
                        onCheckedChange={tabId !== "basic" ? () => toggleTabEnabled(tabId) : undefined}
                        disabled={tabId === "basic"}
                        aria-label={`${t('contacts.setup.enableTab')} ${tabLabel}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{tabLabel}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{tabDesc}</p>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                      {tabDefs.filter((field) => enabledSet.has(field.key)).length}/{tabDefs.length}
                    </span>
                    {tabId !== "basic" && isOn && (
                      <Button
                        type="button"
                        variant={isReq ? "destructive" : "outline"}
                        onClick={() => toggleTabRequired(tabId)}
                        className="flex-shrink-0 h-7 px-2.5 rounded-lg text-[10px] font-bold"
                      >
                        {isReq ? t('contacts.setup.fieldRequired') : t('contacts.setup.fieldOptional')}
                      </Button>
                    )}
                    {tab.isSystem === false && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleDeleteTab(tabId)}
                        className="flex-shrink-0 h-7 w-7 p-0 text-destructive hover:bg-destructive/10 rounded-lg ml-1"
                        title={t("contacts.setup.deleteCustomTab", { tab: tabLabel })}
                        aria-label={`${t("contacts.setup.deleteCustomTab", { tab: tabLabel })}`}
                      >
                        <Trash2 className="w-4 h-4" />
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
                           fields={(tabFields[tabId] || []).map((field) => ({...field, id: field.key})) as unknown as CustomFieldConfig[]}
                           droppableId={`custom-fields-${tabId}`}
                           onChange={(f) => handleCustomFieldsChange(tabId, f)}
                        />
                      </div>
                    </div>
                  )}
                </section>
              );
            })}

            {/* Create Custom Tab Inline Form */}
            <div className="flex items-center gap-2 p-3 bg-muted/20 border border-border rounded-xl mt-4">
              <Input
                placeholder={t("contacts.setup.addCustomTabPlaceholder")}
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                className="h-9 max-w-xs text-sm bg-card"
                aria-label={t("contacts.setup.customTabName")}
              />
              <Button
                type="button"
                onClick={handleAddTab}
                className="flex items-center gap-1.5 h-9 text-xs font-bold uppercase tracking-wider"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t("common.add")}</span>
              </Button>
            </div>
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
                  <Input
                    id="defaultCountry"
                    value={prefs.defaultCountry || ""}
                    onChange={(e) => updatePreference("defaultCountry", e.target.value)}
                    placeholder={t('contacts.setup.defaultCountryPlaceholder')}
                  />
                </div>
                <div>
                  <label className={FORM_LABEL} htmlFor="defaultProvince">{t('contacts.setup.defaultProvince')}</label>
                  <Input
                    id="defaultProvince"
                    value={prefs.defaultProvince || ""}
                    onChange={(e) => updatePreference("defaultProvince", e.target.value)}
                    placeholder={t('contacts.setup.defaultProvincePlaceholder')}
                  />
                </div>
                <div>
                  <label className={FORM_LABEL} htmlFor="defaultCity">{t('contacts.setup.defaultCity')}</label>
                  <Input
                    id="defaultCity"
                    value={prefs.defaultCity || ""}
                    onChange={(e) => updatePreference("defaultCity", e.target.value)}
                    placeholder={t('contacts.setup.defaultCityPlaceholder')}
                  />
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-border sticky bottom-0 bg-background pb-2 flex-wrap">
        <Button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 px-5 min-h-[44px]"
        >
          <Save className="w-4 h-4" />
          <span>{saved ? t('contacts.form.saved') : t('contacts.setup.saveAndApply')}</span>
        </Button>
      </div>
    </div>
  );
}
