import React, { useState, useMemo } from "react";
import { BookOpen } from "lucide-react";
import { ACCOUNT_TYPES, ACCOUNT_SUBTYPES, ACCOUNT_TYPE_META, Account, AccountType } from '@/lib/data/accountingData';
import { getObject } from "../../lib/db";
import {
  DEFAULT_ACCOUNTING_SETTINGS,
  DEFAULT_ACCOUNT_FIELD_DEFS,
  getSortedFields,
} from "@mms/shared";
import { DatePicker } from "../ui/DatePicker";
import FormModal from "../ui/FormModal";
import useTranslation from "@/hooks/useTranslation";

interface AccountModalProps {
  initial: Account | null;
  onSave: (account: Account) => void;
  onClose: () => void;
  existingCodes: string[];
}

export default function AccountModal({ initial, onSave, onClose, existingCodes }: AccountModalProps) {
  const { t } = useTranslation();
  const isEdit = !!initial?.id;
  const [form, setForm] = useState<Partial<Account>>(initial || { code: "", name: "", type: "Asset", subtype: "", description: "", isActive: true });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const type = form.type as AccountType;
  const subtypes = type ? (ACCOUNT_SUBTYPES[type] || []) : [];

  const settings = getObject("accounting_settings", DEFAULT_ACCOUNTING_SETTINGS);
  const fields = settings.fields || DEFAULT_ACCOUNTING_SETTINGS.fields || {};
  const customFields = settings.customFields || [];
  const fieldOrder = settings.fieldOrder || DEFAULT_ACCOUNTING_SETTINGS.fieldOrder || [];

  const orderedFields = getSortedFields(
    DEFAULT_ACCOUNT_FIELD_DEFS,
    fieldOrder,
    fields,
    customFields
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.code?.trim()) e.code = "Code is required";
    else if (!isEdit && existingCodes.includes(form.code.trim())) e.code = "Code already exists";
    if (!form.name?.trim()) e.name = "Name is required";
    if (!form.type) e.type = "Type is required";
    return e;
  };

  const saveAccount = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    onSave({
      ...form,
      code: form.code!.trim(),
      name: form.name!.trim(),
      id: isEdit ? form.id : `a${Date.now()}`,
    } as Account);
  };

  const errorMessages = useMemo(
    () => Object.values(errors).filter(Boolean),
    [errors],
  );

  const inp = "mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <FormModal
      open
      onClose={onClose}
      title={isEdit ? "Edit Account" : "Add Account"}
      icon={BookOpen}
      size="md"
      cancelLabel={t("common.cancel")}
      saveLabel={t("common.save")}
      onSave={saveAccount}
      error={errorMessages}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {orderedFields.map((field) => {
          const isEnabled = fields[field.id]?.enabled !== false;
          if (!isEnabled) return null;

          if (field.id === "code") {
            return (
              <div key="code">
                <label htmlFor="account-code" className="text-xs font-semibold text-muted-foreground uppercase">Account Code *</label>
                <input id="account-code" value={form.code || ""} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. 1000" className={inp} required />
              </div>
            );
          }

          if (field.id === "type") {
            return (
              <div key="type">
                <label htmlFor="account-type" className="text-xs font-semibold text-muted-foreground uppercase">Type *</label>
                <select id="account-type" value={form.type || "Asset"} onChange={(e) => setForm({ ...form, type: e.target.value as AccountType, subtype: "" })} className={inp} required>
                  {ACCOUNT_TYPES.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            );
          }

          if (field.id === "name") {
            return (
              <div key="name" className="sm:col-span-2">
                <label htmlFor="account-name" className="text-xs font-semibold text-muted-foreground uppercase">Account Name *</label>
                <input id="account-name" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Cash in Hand" className={inp} required />
              </div>
            );
          }

          if (field.id === "subtype") {
            const isRequired = !!fields[field.id]?.required;
            return (
              <div key="subtype" className="sm:col-span-2">
                <label htmlFor="account-subtype" className="text-xs font-semibold text-muted-foreground uppercase">Sub-type {isRequired ? "*" : ""}</label>
                <select id="account-subtype" value={form.subtype || ""} onChange={(e) => setForm({ ...form, subtype: e.target.value })} className={inp} required={isRequired}>
                  <option value="">— None —</option>
                  {subtypes.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            );
          }

          if (field.id === "description") {
            const isRequired = !!fields[field.id]?.required;
            return (
              <div key="description" className="sm:col-span-2">
                <label htmlFor="account-description" className="text-xs font-semibold text-muted-foreground uppercase">Description {isRequired ? "*" : ""}</label>
                <input id="account-description" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description…" className={inp} required={isRequired} />
              </div>
            );
          }

          if (!["code", "type", "name", "subtype", "description"].includes(field.id)) {
            const value = (form as Record<string, unknown>)[field.id] ?? "";
            return (
              <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  {field.label} {field.required ? "*" : ""}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    className={inp + " min-h-[80px] py-2"}
                    value={value as string}
                    onChange={(e) => setForm((d) => ({ ...d, [field.id]: e.target.value }))}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}…`}
                    required={field.required}
                  />
                ) : field.type === "select" ? (
                  <select
                    className={inp + " cursor-pointer"}
                    value={value as string}
                    onChange={(e) => setForm((d) => ({ ...d, [field.id]: e.target.value }))}
                    required={field.required}
                  >
                    <option value="">Select option…</option>
                    {field.options?.map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === "boolean" ? (
                  <label className="flex items-center gap-2.5 py-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!value}
                      onChange={(e) => setForm((d) => ({ ...d, [field.id]: e.target.checked }))}
                      className="w-4 h-4 rounded border border-border accent-primary cursor-pointer"
                    />
                    <span className="text-xs font-medium text-foreground">{field.label}</span>
                  </label>
                ) : field.type === "number" ? (
                  <input
                    type="number"
                    className={inp}
                    value={value as number}
                    onChange={(e) => setForm((d) => ({ ...d, [field.id]: e.target.value }))}
                    placeholder={field.placeholder || "Enter number…"}
                    required={field.required}
                  />
                ) : field.type === "date" ? (
                  <DatePicker
                    value={value as string}
                    onChange={(val) => setForm((d) => ({ ...d, [field.id]: val }))}
                    required={field.required}
                  />
                ) : (
                  <input
                    type="text"
                    className={inp}
                    value={value as string}
                    onChange={(e) => setForm((d) => ({ ...d, [field.id]: e.target.value }))}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}…`}
                    required={field.required}
                  />
                )}
              </div>
            );
          }

          return null;
        })}
      </div>

      {type && ACCOUNT_TYPE_META[type] && (
        <div className={`mt-4 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border ${ACCOUNT_TYPE_META[type].color}`} aria-live="polite">
          <span aria-hidden="true">{ACCOUNT_TYPE_META[type].icon}</span>
          <span>{type} · Normal Balance: <strong>{ACCOUNT_TYPE_META[type].normalBalance.toUpperCase()}</strong> · {ACCOUNT_TYPE_META[type].group}</span>
        </div>
      )}
    </FormModal>
  );
}
