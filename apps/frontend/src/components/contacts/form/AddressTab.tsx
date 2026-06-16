import React from "react";
import { motion } from "framer-motion";
import { MapPin, Plus } from "lucide-react";

import { Field, FormEmptyState, RequiredBanner, CustomFieldInput, EditableSelect, COLLECTION_CARD, COLLECTION_BODY, CardTypeLabel, CardRemoveButton, TYPE_SELECT_WIDTH } from "./FormPrimitives";
import { useSortedFields } from "../../../hooks/useSortedFields";
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import useTranslation from "@/hooks/useTranslation";

interface ContactAddress {
  label?: string;
  line1?: string;
  city?: string;
  state?: string;
  country?: string;
  [key: string]: unknown;
}

interface ContactFormData {
  addresses?: ContactAddress[];
  [key: string]: unknown;
}

interface AddressTabProps {
  data: ContactFormData;
  onChange: (updatedData: ContactFormData) => void;
  required?: boolean;
  tabFieldCfg?: {
    enabled?: string[];
    required?: string[];
  };
  defaultCountry: string;
  defaultCity: string;
  defaultProvince: string;
  customFields?: unknown;
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
}: AddressTabProps): React.JSX.Element {
  const { addressLabels, updateAddressLabels, uiStrings } = useContactConfig();
  const { t } = useTranslation();
  const enabledFields = useSortedFields("addresses").filter((f) => f.enabled);

  const createNewAddress = (): ContactAddress => {
    const item: Record<string, unknown> = {};
    enabledFields.forEach((f) => {
      if (f.key === "label") {
        item[f.key] = addressLabels[0] || uiStrings.homeLabel;
      } else if (f.key === "city") {
        item[f.key] = defaultCity;
      } else if (f.key === "state") {
        item[f.key] = defaultProvince;
      } else if (f.key === "country") {
        item[f.key] = defaultCountry;
      } else {
        item[f.key] = f.defaultValue !== undefined ? f.defaultValue : "";
      }
    });
    return item as ContactAddress;
  };

  const addresses = data.addresses && data.addresses.length > 0 ? data.addresses : [createNewAddress()];

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
                  value={a.label || uiStrings.homeLabel}
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
              {bodyFields.map((field) => (
                <Field key={field.key} label={field.label} required={field.required} hint={field.description}>
                  <CustomFieldInput
                    field={field}
                    value={a[field.key]}
                    onChange={(val) => updateAddress(i, { [field.key]: val })}
                  />
                </Field>
              ))}
            </div>
          )}
        </motion.div>
      ))}

      <button
        type="button"
        onClick={() => upd([...addresses, createNewAddress()])}
        className="flex items-center min-h-[44px] gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors mt-1"
      >
        <Plus className="w-4 h-4" />
        <span>{t("contacts.form.addAddress")}</span>
      </button>
    </div>
  );
}

