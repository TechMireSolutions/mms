import React from "react";
import { motion } from "framer-motion";
import { Phone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeToE164, parsePhoneNumber, Contact, PhoneNumber } from "@mms/shared";
import { LABEL, Field, FormEmptyState, RequiredBanner, CustomFieldInput, CustomFieldConfig, EditableSelect, COLLECTION_CARD, COLLECTION_BODY, CardTypeLabel, CardRemoveButton, TYPE_SELECT_WIDTH } from "@/components/ui/FormPrimitives";
import { useVisibleContactFields } from "@/hooks/useVisibleContactFields";
import { useContactConfig, type ValidationError } from '@/lib/contexts/ContactConfigContext';
import { useTranslation } from "@/hooks/useTranslation";

type ContactPhone = PhoneNumber & Record<string, unknown>;

interface PhoneTabProps {
  data: Partial<Contact>;
  onChange: (updatedData: Partial<Contact>) => void;
  required?: boolean;
  defaultCountry: string;
  errors?: ValidationError[];
}

/**
 * PhoneTab component for managing contact phone numbers and country codes.
 * @param props Component properties.
 * @returns React element.
 */
export default function PhoneTab({
  data,
  onChange,
  required = false,
  defaultCountry,
  errors = [],
}: PhoneTabProps): React.JSX.Element {
  const fields = useVisibleContactFields("phones");
  const standardKeys = ["label", "number", "countryCode"];
  const sortedCustomFields = fields.filter((f) => !standardKeys.includes(f.key) && f.enabled !== false);
  const { phoneLabels, countryCodesMap, defaultPhoneCountryCode, updatePhoneLabels } = useContactConfig();
  const { t } = useTranslation();
  const defaultPhoneLabel = phoneLabels[0] || t('contacts.detail.mobileLabel');
  const phones = (data.phones || []) as ContactPhone[];

  const upd = (list: ContactPhone[]): void => {
    onChange({ ...data, phones: list });
  };

  const labelField = fields.find((f) => f.key === "label");
  const numberField = fields.find((f) => f.key === "number");

  const showLabel = labelField?.enabled !== false;
  const reqNumber = numberField?.required === true;
  const defaultCode = countryCodesMap[defaultCountry] || defaultPhoneCountryCode;

  const updatePhone = (i: number, patch: Partial<ContactPhone>): void => {
    upd(phones.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  };

  const handlePhoneBlur = (i: number): void => {
    const p = phones[i];
    if (!p.number) return;
    const e164 = normalizeToE164(p.countryCode || defaultCode, p.number);
    const parsed = parsePhoneNumber(e164, p.countryCode || defaultCode);
    updatePhone(i, { countryCode: parsed.countryCode, number: parsed.number });
  };

  return (
    <div className="space-y-3">
      {required && phones.length === 0 && <RequiredBanner message={t("contacts.form.atLeastOnePhoneRequired")} />}
      {phones.length === 0 && <FormEmptyState icon={Phone} text={t("contacts.form.noPhoneNumbersYet")} />}

      {phones.map((p, i) => {
        const numberError = errors?.find(
          (e) => e.tabId === "phones" && e.index === i && e.fieldId === "number"
        );
        const countryCodeError = errors?.find(
          (e) => e.tabId === "phones" && e.index === i && e.fieldId === "countryCode"
        );
        return (
          <motion.div
            key={i}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={COLLECTION_CARD}
          >
            <div className="flex items-center justify-between">
              {showLabel ? (
                <div className="flex items-center gap-2">
                  <CardTypeLabel>{t("contacts.form.type")}</CardTypeLabel>
                  <EditableSelect
                    options={phoneLabels || []}
                    value={p.label}
                    onChange={(val) => updatePhone(i, { label: val })}
                    onUpdateOptions={updatePhoneLabels}
                    placeholder={t("contacts.form.selectLabel")}
                    className={TYPE_SELECT_WIDTH}
                  />
                </div>
              ) : (
                <div />
              )}
              <CardRemoveButton
                onClick={() => upd(phones.filter((_, j) => j !== i))}
                label={t("contacts.form.removePhoneNumber", { index: i + 1 })}
              />
            </div>

            {reqNumber && (
              <span className={LABEL}>
                {t("contacts.form.phoneNumber")} <span className="text-destructive">*</span>
              </span>
            )}
            <div className="flex gap-2">
              <div className="w-20 flex-shrink-0">
                <Input
                  id={`phones-${i}-countryCode`}
                  value={p.countryCode || defaultCode}
                  onChange={(e) => updatePhone(i, { countryCode: e.target.value })}
                  onBlur={() => handlePhoneBlur(i)}
                  placeholder={t("contacts.form.countryCodePlaceholder")}
                  aria-label={`${t("contacts.form.countryCode")} ${i + 1}`}
                  className={countryCodeError ? "border-destructive focus-visible:ring-destructive" : ""}
                />
              </div>
              <Input
                id={`phones-${i}-number`}
                value={p.number}
                onChange={(e) => updatePhone(i, { number: e.target.value })}
                onBlur={() => handlePhoneBlur(i)}
                placeholder={t("contacts.form.phoneNumberPlaceholder")}
                aria-label={`${t("contacts.form.phoneNumber")} ${i + 1}`}
                className={numberError ? "border-destructive focus-visible:ring-destructive" : ""}
              />
            </div>
            {(numberError || countryCodeError) && (
              <p className="text-[10px] text-destructive mt-1 font-medium">
                {numberError?.message || countryCodeError?.message}
              </p>
            )}

            {sortedCustomFields.length > 0 && (
              <div className={COLLECTION_BODY}>
                {sortedCustomFields.map((field) => {
                  const fieldError = errors?.find(
                    (err) => err.tabId === "phones" && err.index === i && err.fieldId === field.key
                  );
                  return (
                    <Field key={field.key} id={`phones-${i}-${field.key}`} label={field.label} required={field.required} hint={field.description} error={fieldError?.message}>
                      <CustomFieldInput
                        field={field as unknown as CustomFieldConfig}
                        value={p[field.key]}
                        onChange={(val) => updatePhone(i, { [field.key]: val })}
                        error={!!fieldError}
                      />
                    </Field>
                  );
                })}
              </div>
            )}
          </motion.div>
        );
      })}

      <Button
        type="button"
        variant="ghost"
        onClick={() =>
          upd([
            ...phones,
            { label: phoneLabels[0] || defaultPhoneLabel, number: "", countryCode: defaultCode }
          ])
        }
        className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors p-0 justify-start"
      >
        <Plus className="w-4 h-4" />
        <span>{t("contacts.form.addPhoneNumber")}</span>
      </Button>
    </div>
  );
}
