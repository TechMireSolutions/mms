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
  contactDraft: Partial<Contact>;
  onChange: (updatedContactDraft: Partial<Contact>) => void;
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
  contactDraft,
  onChange,
  required = false,
  defaultCountry,
  errors = [],
}: PhoneTabProps): React.JSX.Element {
  const fields = useVisibleContactFields("phones");
  const standardKeys = ["label", "number", "countryCode"];
  const sortedCustomFields = fields.filter((field) => !standardKeys.includes(field.key) && field.enabled !== false);
  const { phoneLabels, countryCodesMap, defaultPhoneCountryCode, updatePhoneLabels } = useContactConfig();
  const { t } = useTranslation();
  const defaultPhoneLabel = phoneLabels[0] || t('contacts.detail.mobileLabel');
  const contactPhones = (contactDraft.phones || []) as ContactPhone[];

  const updateContactPhones = (phones: ContactPhone[]): void => {
    onChange({ ...contactDraft, phones });
  };

  const labelField = fields.find((field) => field.key === "label");
  const numberField = fields.find((field) => field.key === "number");

  const showLabel = labelField?.enabled !== false;
  const reqNumber = numberField?.required === true;
  const defaultCode = countryCodesMap[defaultCountry] || defaultPhoneCountryCode;

  const updatePhone = (phoneIndex: number, patch: Partial<ContactPhone>): void => {
    updateContactPhones(
      contactPhones.map((phone, index) => (index === phoneIndex ? { ...phone, ...patch } : phone)),
    );
  };

  const handlePhoneBlur = (phoneIndex: number): void => {
    const phone = contactPhones[phoneIndex];
    if (!phone.number) return;
    const e164PhoneNumber = normalizeToE164(phone.countryCode || defaultCode, phone.number);
    const parsedPhoneNumber = parsePhoneNumber(e164PhoneNumber, phone.countryCode || defaultCode);
    updatePhone(phoneIndex, { countryCode: parsedPhoneNumber.countryCode, number: parsedPhoneNumber.number });
  };

  return (
    <div className="space-y-3">
      {required && contactPhones.length === 0 && <RequiredBanner message={t("contacts.form.atLeastOnePhoneRequired")} />}
      {contactPhones.length === 0 && <FormEmptyState icon={Phone} text={t("contacts.form.noPhoneNumbersYet")} />}

      {contactPhones.map((phone, phoneIndex) => {
        const numberError = errors?.find(
          (error) => error.tabId === "phones" && error.index === phoneIndex && error.fieldId === "number"
        );
        const countryCodeError = errors?.find(
          (error) => error.tabId === "phones" && error.index === phoneIndex && error.fieldId === "countryCode"
        );
        return (
          <motion.div
            key={phoneIndex}
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
                    value={phone.label}
                    onChange={(value) => updatePhone(phoneIndex, { label: value })}
                    onUpdateOptions={updatePhoneLabels}
                    placeholder={t("contacts.form.selectLabel")}
                    className={TYPE_SELECT_WIDTH}
                  />
                </div>
              ) : (
                <div />
              )}
              <CardRemoveButton
                onClick={() => updateContactPhones(contactPhones.filter((_, index) => index !== phoneIndex))}
                label={t("contacts.form.removePhoneNumber", { index: phoneIndex + 1 })}
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
                  id={`phones-${phoneIndex}-countryCode`}
                  value={phone.countryCode || defaultCode}
                  onChange={(event) => updatePhone(phoneIndex, { countryCode: event.target.value })}
                  onBlur={() => handlePhoneBlur(phoneIndex)}
                  placeholder={t("contacts.form.countryCodePlaceholder")}
                  aria-label={`${t("contacts.form.countryCode")} ${phoneIndex + 1}`}
                  className={countryCodeError ? "border-destructive focus-visible:ring-destructive" : ""}
                />
              </div>
              <Input
                id={`phones-${phoneIndex}-number`}
                value={phone.number}
                onChange={(event) => updatePhone(phoneIndex, { number: event.target.value })}
                onBlur={() => handlePhoneBlur(phoneIndex)}
                placeholder={t("contacts.form.phoneNumberPlaceholder")}
                aria-label={`${t("contacts.form.phoneNumber")} ${phoneIndex + 1}`}
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
                    (error) => error.tabId === "phones" && error.index === phoneIndex && error.fieldId === field.key
                  );
                  return (
                    <Field key={field.key} id={`phones-${phoneIndex}-${field.key}`} label={field.label} required={field.required} hint={field.description} error={fieldError?.message}>
                      <CustomFieldInput
                        field={field as unknown as CustomFieldConfig}
                        value={phone[field.key]}
                        onChange={(value) => updatePhone(phoneIndex, { [field.key]: value })}
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
          updateContactPhones([
            ...contactPhones,
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
