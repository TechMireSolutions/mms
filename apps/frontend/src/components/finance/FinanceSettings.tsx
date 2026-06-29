import React, { useState, useEffect } from "react";
import { Save, DollarSign, Info, Plus, Pencil, Trash2 } from "lucide-react";
import { useFinanceConfig } from "@/hooks/useFinanceConfig";
import {
  type FinanceSettings as FinanceSettingsData,
  FINANCE_TAB_REGISTRY,
  INITIAL_FINANCE_FIELD_SEED,
  type TabDefinition,
  type FieldDefinition,
} from "@mms/shared";
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

interface FinanceSettingsProps {
  mode?: "fields" | "preferences";
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

export function FinanceSettings({ mode }: FinanceSettingsProps): React.ReactElement {
  const { settings, updateSettings } = useFinanceConfig();
  const [saved, setSaved] = useState<boolean>(false);

  // Prefs state
  const [currency, setCurrency] = useState(settings.currency);
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoicePrefix);
  const [dueDays, setDueDays] = useState(settings.dueDays);
  const [lateFeePercent, setLateFeePercent] = useState(settings.lateFeePercent);
  const [taxRate, setTaxRate] = useState(settings.taxRate);
  const [paymentMethods, setPaymentMethods] = useState(settings.paymentMethods);
  const [autoGenerateInvoice, setAutoGenerateInvoice] = useState(settings.autoGenerateInvoice);
  const [sendInvoiceEmail, setSendInvoiceEmail] = useState(settings.sendInvoiceEmail);
  const [allowPartialPayment, setAllowPartialPayment] = useState(settings.allowPartialPayment);
  const [requireApproval, setRequireApproval] = useState(settings.requireApproval);
  const [overdueReminder, setOverdueReminder] = useState(settings.overdueReminder);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(settings.reminderDaysBefore);
  const [feeReminders, setFeeReminders] = useState(settings.feeReminders);
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
    initialTabs: FINANCE_TAB_REGISTRY,
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
    setCurrency(settings.currency);
    setInvoicePrefix(settings.invoicePrefix);
    setDueDays(settings.dueDays);
    setLateFeePercent(settings.lateFeePercent);
    setTaxRate(settings.taxRate);
    setPaymentMethods(settings.paymentMethods);
    setAutoGenerateInvoice(settings.autoGenerateInvoice);
    setSendInvoiceEmail(settings.sendInvoiceEmail);
    setAllowPartialPayment(settings.allowPartialPayment);
    setRequireApproval(settings.requireApproval);
    setOverdueReminder(settings.overdueReminder);
    setReminderDaysBefore(settings.reminderDaysBefore);
    setFeeReminders(settings.feeReminders);
    setDefaultViewLayout(settings.defaultViewLayout);

    setEnabledTabs(new Set(settings.enabledTabs || ["basic"]));
    setRequiredTabs(new Set(settings.requiredTabs || []));

    const coreTabKeys = new Set(FINANCE_TAB_REGISTRY.map((tabDefinition: any) => tabDefinition.key));
    const customTabs = (settings.formTabs || []).filter((tabDefinition: any) => !coreTabKeys.has(tabDefinition.key));
    setFormTabs([
      ...FINANCE_TAB_REGISTRY,
      ...customTabs
    ].map((tabDefinition: any) => ({
      ...tabDefinition,
      enabled: tabDefinition.key === "basic" ? true : (settings.enabledTabs || ["basic"]).includes(tabDefinition.key)
    })));

    const newTabIds = Array.from(new Set([
      ...FINANCE_TAB_REGISTRY.map((tabDefinition: any) => tabDefinition.key),
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

    const nextSettings: FinanceSettingsData = {
      ...settings,
      currency,
      invoicePrefix,
      dueDays,
      lateFeePercent,
      taxRate,
      paymentMethods,
      autoGenerateInvoice,
      sendInvoiceEmail,
      allowPartialPayment,
      requireApproval,
      overdueReminder,
      reminderDaysBefore,
      feeReminders,
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

  const ALL_METHODS = ["cash", "bank_transfer", "cheque", "online", "card", "other"];
  const toggleMethod = (method: string) => {
    const nextMethods = paymentMethods.includes(method)
      ? paymentMethods.filter((selectedMethod) => selectedMethod !== method)
      : [...paymentMethods, method];
    setPaymentMethods(nextMethods);
    setSaved(false);
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-4" aria-labelledby="finance-settings-title">
      <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <DollarSign className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
        </div>
        <h3 id="finance-settings-title" className="text-[13px] font-bold text-foreground">Finance Module Settings</h3>
      </div>

      {showPrefs && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="finance-currency" className={FORM_LABEL}>Currency</label>
              <FormSelect
                id="finance-currency"
                value={currency}
                onChange={(value) => { setCurrency(value); setSaved(false); }}
                options={[
                  { value: "PKR", label: "PKR — Pakistani Rupee" },
                  { value: "USD", label: "USD — US Dollar" },
                  { value: "GBP", label: "GBP — British Pound" },
                  { value: "SAR", label: "SAR — Saudi Riyal" },
                  { value: "AED", label: "AED — UAE Dirham" },
                  { value: "EUR", label: "EUR — Euro" },
                ]}
              />
            </div>
            <div>
              <label htmlFor="inv-prefix" className={FORM_LABEL}>Invoice Prefix</label>
              <Input
                id="inv-prefix"
                className={FORM_INPUT}
                value={invoicePrefix}
                onChange={(event) => { setInvoicePrefix(event.target.value); setSaved(false); }}
                placeholder="INV"
              />
            </div>
            <div>
              <label htmlFor="due-days" className={FORM_LABEL}>Default Due Days</label>
              <Input
                id="due-days"
                type="number"
                className={FORM_INPUT}
                value={dueDays}
                onChange={(event) => { setDueDays(event.target.value); setSaved(false); }}
              />
            </div>
            <div>
              <label htmlFor="late-fee" className={FORM_LABEL}>Late Fee (%)</label>
              <Input
                id="late-fee"
                type="number"
                className={FORM_INPUT}
                value={lateFeePercent}
                onChange={(event) => { setLateFeePercent(event.target.value); setSaved(false); }}
              />
            </div>
            <div>
              <label htmlFor="tax-rate" className={FORM_LABEL}>Tax Rate (%)</label>
              <Input
                id="tax-rate"
                type="number"
                className={FORM_INPUT}
                value={taxRate}
                onChange={(event) => { setTaxRate(event.target.value); setSaved(false); }}
              />
            </div>
            <div>
              <label htmlFor="reminder-days" className={FORM_LABEL}>Reminder Days Before Due</label>
              <Input
                id="reminder-days"
                type="number"
                className={FORM_INPUT}
                value={reminderDaysBefore}
                onChange={(event) => { setReminderDaysBefore(event.target.value); setSaved(false); }}
              />
            </div>
          </div>

          <div>
            <span className={FORM_LABEL}>Accepted Payment Methods</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Select payment methods">
              {ALL_METHODS.map((method) => {
                const active = paymentMethods.includes(method);
                return (
                  <Button
                    key={method}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleMethod(method)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize ${
                      active ? "bg-primary/10 border-primary/30 text-primary font-bold" : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {method.replace("_", " ")}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-1" role="group" aria-label="Financial registry feature flags toggles">
            <Toggle label="Auto-generate Invoices" description="Automatically create invoices on enrollment" value={autoGenerateInvoice} onChange={(value) => { setAutoGenerateInvoice(value); setSaved(false); }} />
            <Toggle label="Send Invoice by Email" description="Email invoice to guardian on creation" value={sendInvoiceEmail} onChange={(value) => { setSendInvoiceEmail(value); setSaved(false); }} />
            <Toggle label="Allow Partial Payment" description="Accept payments less than the full amount" value={allowPartialPayment} onChange={(value) => { setAllowPartialPayment(value); setSaved(false); }} />
            <Toggle label="Require Approval for Discounts" description="Discounts need admin approval before applying" value={requireApproval} onChange={(value) => { setRequireApproval(value); setSaved(false); }} />
            <Toggle label="Overdue Reminders" description="Send reminders for overdue invoices" value={overdueReminder} onChange={(value) => { setOverdueReminder(value); setSaved(false); }} />
            <Toggle label="Fee Reminders" description="Send notifications when fees are due or overdue" value={feeReminders} onChange={(value) => { setFeeReminders(value); setSaved(false); }} />
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
                      isUniqueField={(tid: string, fid: string) => tabFieldUnique[tid]?.has(fid) || false}
                      isCoreField={(key: string) => INITIAL_FINANCE_FIELD_SEED[tabId]?.some((field: any) => field.key === key) ?? false}
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
