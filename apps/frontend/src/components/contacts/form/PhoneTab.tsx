import React from "react";
import { motion } from "framer-motion";
import { Phone, Plus } from "lucide-react";
import { normalizeToE164, parsePhoneNumber } from "@mms/shared";
import { INPUT, LABEL, Field, FormEmptyState, RequiredBanner, CustomFieldInput, CustomFieldConfig, EditableSelect, COLLECTION_CARD, CardTypeLabel, CardRemoveButton, TYPE_SELECT_WIDTH } from "./FormPrimitives";
import { useVisibleContactFields } from "../../../hooks/useVisibleContactFields";
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import useTranslation from "@/hooks/useTranslation";

interface ContactPhone {
  label: string;
  number: string;
  countryCode?: string;
}

interface ContactFormData {
  phones?: ContactPhone[];
  [key: string]: unknown;
}

interface PhoneTabProps {
  data: ContactFormData;
  onChange: (updatedData: ContactFormData) => void;
  required?: boolean;
  defaultCountry: string;
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
}: PhoneTabProps): React.JSX.Element {
  const fields = useVisibleContactFields("phones");
  const standardKeys = ["label", "number", "countryCode"];
  const sortedCustomFields = fields.filter((f) => !standardKeys.includes(f.key) && f.enabled !== false);
  const { phoneLabels, countryCodesMap, defaultPhoneCountryCode, updatePhoneLabels } = useContactConfig();
  const { t } = useTranslation();
  const defaultPhoneLabel = phoneLabels[0] || t('contacts.detail.mobileLabel');
  const phones = data.phones && data.phones.length > 0 ? data.phones : [{ label: defaultPhoneLabel, number: "", countryCode: countryCodesMap[defaultCountry] || defaultPhoneCountryCode }];

  const upd = (list: ContactPhone[]): void => {
    onChange({ ...data, phones: list });
  };

  const updField = (id: string, value: unknown): void => {
    onChange({ ...data, [id]: value });
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

      {phones.map((p, i) => (
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
              <input
                className={INPUT}
                value={p.countryCode || defaultCode}
                onChange={(e) => updatePhone(i, { countryCode: e.target.value })}
                onBlur={() => handlePhoneBlur(i)}
                placeholder={t("contacts.form.countryCodePlaceholder")}
                aria-label={`${t("contacts.form.countryCode")} ${i + 1}`}
              />
            </div>
            <input
              className={INPUT}
              value={p.number}
              onChange={(e) => updatePhone(i, { number: e.target.value })}
              onBlur={() => handlePhoneBlur(i)}
              placeholder={t("contacts.form.phoneNumberPlaceholder")}
              aria-label={`${t("contacts.form.phoneNumber")} ${i + 1}`}
            />
          </div>
        </motion.div>
      ))}

      <button
        type="button"
        onClick={() =>
          upd([
            ...phones,
            { label: phoneLabels[0] || defaultPhoneLabel, number: "", countryCode: defaultCode }
          ])
        }
        className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>{t("contacts.form.addPhoneNumber")}</span>
      </button>

      {sortedCustomFields.map((field) => {
        const label = field.label as string;
        const reqField = field.required as boolean | undefined;
        return (
          <Field key={field.key} label={label} required={reqField}>
            <CustomFieldInput
              field={field as unknown as CustomFieldConfig}
              value={data[field.key]}
              onChange={(val) => updField(field.key, val)}
            />
          </Field>
        );
      })}
    </div>
  );
}
