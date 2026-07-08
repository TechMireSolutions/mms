import React, { useState, useMemo } from "react";
import { BookOpen } from "lucide-react";
import { ACCOUNT_TYPES, ACCOUNT_SUBTYPES, ACCOUNT_TYPE_META, Account, AccountType } from '@/lib/data/accountingData';
import { useAccountingConfig } from "@/tenant/features/accounting/hooks/useAccountingConfig";
import { DatePicker } from "@/components/ui/DatePicker";
import { FormModal } from "@/components/ui/FormModal";
import { useTranslation } from "@/hooks/useTranslation";
import { type AppTranslationKey } from "@mms/shared";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FORM_LABEL } from "@/components/ui/formStyles";

interface AccountModalProps {
  initial: Account | null;
  onSave: (account: Account) => void;
  onClose: () => void;
  existingCodes: string[];
}

export function AccountModal({ initial, onSave, onClose, existingCodes }: AccountModalProps) {
  const { t } = useTranslation();
  const isEdit = !!initial?.id;
  const [form, setForm] = useState<Partial<Account>>(initial || { code: "", name: "", type: "Asset", subtype: "", description: "", isActive: true });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const type = form.type as AccountType;
  const subtypes = type ? (ACCOUNT_SUBTYPES[type] || []) : [];

  const { fields, orderedFields } = useAccountingConfig();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.code?.trim()) e.code = t("accounting.coa.validation.codeRequired");
    else if (!isEdit && existingCodes.includes(form.code.trim())) e.code = t("accounting.coa.validation.codeExists");
    if (!form.name?.trim()) e.name = t("accounting.coa.validation.nameRequired");
    if (!form.type) e.type = t("accounting.coa.validation.typeRequired");
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

  return (
    <FormModal
      open
      onClose={onClose}
      title={isEdit ? t("accounting.coa.editAccount") : t("accounting.coa.addAccount")}
      icon={BookOpen}
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
                <label htmlFor="account-code" className={FORM_LABEL}>{t("accounting.coa.fields.code")}</label>
                <Input id="account-code" name="code" value={form.code || ""} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder={t("accounting.coa.fields.codePlaceholder")} required />
              </div>
            );
          }

          if (field.id === "type") {
            return (
              <div key="type">
                <label htmlFor="account-type" className={FORM_LABEL}>{t("accounting.coa.fields.type")}</label>
                <FormSelect
                  id="account-type"
                  name="type"
                  value={form.type || "Asset"}
                  onChange={(val) => setForm({ ...form, type: val as AccountType, subtype: "" })}
                  options={ACCOUNT_TYPES.map((accType) => ({ value: accType, label: t(`accounting.type.${accType}` as AppTranslationKey) }))}
                />
              </div>
            );
          }

          if (field.id === "name") {
            return (
              <div key="name" className="sm:col-span-2">
                <label htmlFor="account-name" className={FORM_LABEL}>{t("accounting.coa.fields.name")}</label>
                <Input id="account-name" name="name" value={form.name || ""} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder={t("accounting.coa.fields.namePlaceholder")} required />
              </div>
            );
          }

          if (field.id === "subtype") {
            const isRequired = !!fields[field.id]?.required;
            return (
              <div key="subtype" className="sm:col-span-2">
                <label htmlFor="account-subtype" className={FORM_LABEL}>{t("accounting.coa.fields.subtype")} {isRequired ? "*" : ""}</label>
                <FormSelect
                  id="account-subtype"
                  name="subtype"
                  value={form.subtype || ""}
                  onChange={(val) => setForm({ ...form, subtype: val })}
                  options={subtypes}
                  placeholder={t("accounting.journal.form.none")}
                />
              </div>
            );
          }

          if (field.id === "description") {
            const isRequired = !!fields[field.id]?.required;
            return (
              <div key="description" className="sm:col-span-2">
                <label htmlFor="account-description" className={FORM_LABEL}>{t("accounting.coa.fields.description")} {isRequired ? "*" : ""}</label>
                <Input id="account-description" name="description" value={form.description || ""} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder={t("accounting.coa.fields.descriptionPlaceholder")} required={isRequired} />
              </div>
            );
          }

          if (!["code", "type", "name", "subtype", "description"].includes(field.id)) {
            const value = (form as Record<string, unknown>)[field.id] ?? "";
            return (
              <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                <label className={FORM_LABEL}>
                  {field.label} {field.required ? "*" : ""}
                </label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={`account-${field.id}`}
                    name={field.id}
                    value={value as string}
                    onChange={(event) => setForm((previousForm) => ({ ...previousForm, [field.id]: event.target.value }))}
                    placeholder={field.placeholder || t("accounting.coa.fields.enterPlaceholder", { label: field.label })}
                    required={field.required}
                  />
                ) : field.type === "select" ? (
                  <FormSelect
                    id={`account-${field.id}`}
                    name={field.id}
                    value={value as string}
                    onChange={(val) => setForm((previousForm) => ({ ...previousForm, [field.id]: val }))}
                    options={field.options || []}
                    placeholder={t("accounting.journal.form.none")}
                  />
                ) : field.type === "boolean" ? (
                  <label className="flex items-center gap-2.5 py-2 cursor-pointer select-none">
                    <Checkbox
                      id={`account-${field.id}`}
                      name={field.id}
                      checked={!!value}
                      onCheckedChange={(checked) => setForm((previousForm) => ({ ...previousForm, [field.id]: !!checked }))}
                    />
                    <span className="text-xs font-medium text-foreground">{field.label}</span>
                  </label>
                ) : field.type === "number" ? (
                  <Input
                    id={`account-${field.id}`}
                    name={field.id}
                    type="number"
                    value={value as number}
                    onChange={(event) => setForm((previousForm) => ({ ...previousForm, [field.id]: event.target.value }))}
                    placeholder={field.placeholder || t("accounting.coa.fields.enterNumber")}
                    required={field.required}
                  />
                ) : field.type === "date" ? (
                  <DatePicker
                    id={`account-${field.id}`}
                    name={field.id}
                    value={value as string}
                    onChange={(dateValue) => setForm((previousForm) => ({ ...previousForm, [field.id]: dateValue }))}
                    required={field.required}
                  />
                ) : (
                  <Input
                    id={`account-${field.id}`}
                    name={field.id}
                    type="text"
                    value={value as string}
                    onChange={(event) => setForm((previousForm) => ({ ...previousForm, [field.id]: event.target.value }))}
                    placeholder={field.placeholder || t("accounting.coa.fields.enterPlaceholder", { label: field.label })}
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
          <span>
            {t(`accounting.type.${type}` as AppTranslationKey)} · {t("accounting.columns.account.normalBalance") || "Normal Balance"}: <strong>{ACCOUNT_TYPE_META[type].normalBalance === "debit" ? t("accounting.ledger.dr") : t("accounting.ledger.cr")}</strong> · {ACCOUNT_TYPE_META[type].group === "Balance Sheet" ? t("accounting.reports.views.balance") : ACCOUNT_TYPE_META[type].group === "Income Statement" ? t("accounting.reports.views.income") : ACCOUNT_TYPE_META[type].group}
          </span>
        </div>
      )}
    </FormModal>
  );
}
