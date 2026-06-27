import React from "react";
import { motion } from "framer-motion";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDefaultFieldValue, Contact, Address } from "@mms/shared";

import { Field, FormEmptyState, RequiredBanner, CustomFieldInput, EditableSelect, COLLECTION_CARD, COLLECTION_BODY, CardTypeLabel, CardRemoveButton, TYPE_SELECT_WIDTH } from "@/components/ui/FormPrimitives";
import { useVisibleContactFields } from "@/hooks/useVisibleContactFields";
import { useContactConfig, type ValidationError } from '@/lib/contexts/ContactConfigContext';
import { useTranslation } from "@/hooks/useTranslation";

type ContactAddress = Address & Record<string, unknown>;

interface AddressTabProps {
  data: Partial<Contact>;
  onChange: (updatedData: Partial<Contact>) => void;
  required?: boolean;
  defaultCountry: string;
  defaultCity: string;
  defaultProvince: string;
  errors?: ValidationError[];
}

/**
 * AddressTab component for managing contact address records dynamically.
 * @param props Component properties.
 * @returns React element.
 */
export default function AddressTab({
  data,
  onChange,
  required = false,
  defaultCountry,
  defaultCity,
  defaultProvince,
  errors = [],
}: AddressTabProps): React.JSX.Element {
  const { addressLabels, updateAddressLabels } = useContactConfig();
  const { t } = useTranslation();
  const defaultAddressLabel = addressLabels[0] || t('contacts.detail.homeLabel');
  const enabledFields = useVisibleContactFields("addresses");

  const createNewAddress = (): ContactAddress => {
    const item: Record<string, unknown> = {};
    enabledFields.forEach((f) => {
      if (f.key === "label") {
        item[f.key] = defaultAddressLabel;
      } else if (f.key === "city") {
        item[f.key] = defaultCity;
      } else if (f.key === "state") {
        item[f.key] = defaultProvince;
      } else if (f.key === "country") {
        item[f.key] = defaultCountry;
      } else {
        item[f.key] = getDefaultFieldValue(f);
      }
    });
    return item as ContactAddress;
  };

  const addresses = (data.addresses || []) as ContactAddress[];

  const upd = (list: ContactAddress[]): void => {
    onChange({ ...data, addresses: list });
  };

  const updateAddress = (i: number, patch: Partial<ContactAddress>): void => {
    upd(addresses.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  };

  const showLabelField = enabledFields.find((f) => f.key === "label");
  const bodyFields = enabledFields.filter((f) => f.key !== "label");

  return (
    <div className="space-y-3">
      {required && addresses.length === 0 && <RequiredBanner message={t("contacts.form.atLeastOneAddressRequired")} />}
      {addresses.length === 0 && <FormEmptyState icon={MapPin} text={t("contacts.form.noAddressesYet")} />}

      {addresses.map((a, i) => (
        <motion.div
          key={i}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={COLLECTION_CARD}
        >
          <div className="flex items-center justify-between">
            {showLabelField ? (
              <div className="flex items-center gap-2">
                <CardTypeLabel>{t("contacts.form.type")}</CardTypeLabel>
                <EditableSelect
                  options={addressLabels || []}
                  value={a.label || defaultAddressLabel}
                  onChange={(val) => updateAddress(i, { label: val })}
                  onUpdateOptions={updateAddressLabels}
                  placeholder={t("contacts.form.selectLabel")}
                  className={TYPE_SELECT_WIDTH}
                />
              </div>
            ) : (
              <div />
            )}
            <CardRemoveButton
              onClick={() => upd(addresses.filter((_, j) => j !== i))}
              label={t("contacts.form.removeAddress", { index: i + 1 })}
            />
          </div>

          {bodyFields.length > 0 && (
            <div className={COLLECTION_BODY}>
              {bodyFields.map((field) => {
                const fieldError = errors.find(
                  (err) => err.tabId === "addresses" && err.index === i && err.fieldId === field.key
                );
                return (
                  <Field key={field.key} id={`addresses-${i}-${field.key}`} label={field.label} required={field.required} hint={field.description} error={fieldError?.message}>
                    <CustomFieldInput
                      field={field}
                      value={a[field.key]}
                      onChange={(val) => updateAddress(i, { [field.key]: val })}
                      error={!!fieldError}
                    />
                  </Field>
                );
              })}
            </div>
          )}
        </motion.div>
      ))}

      <Button
        type="button"
        variant="ghost"
        onClick={() => upd([...addresses, createNewAddress()])}
        className="flex items-center min-h-[44px] gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors mt-1 p-0 justify-start"
      >
        <Plus className="w-4 h-4" />
        <span>{t("contacts.form.addAddress")}</span>
      </Button>
    </div>
  );
}

