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
  contactDraft: Partial<Contact>;
  onChange: (updatedContactDraft: Partial<Contact>) => void;
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
  contactDraft,
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
    enabledFields.forEach((field) => {
      if (field.key === "label") {
        item[field.key] = defaultAddressLabel;
      } else if (field.key === "city") {
        item[field.key] = defaultCity;
      } else if (field.key === "state") {
        item[field.key] = defaultProvince;
      } else if (field.key === "country") {
        item[field.key] = defaultCountry;
      } else {
        item[field.key] = getDefaultFieldValue(field);
      }
    });
    return item as ContactAddress;
  };

  const contactAddresses = (contactDraft.addresses || []) as ContactAddress[];

  const updateContactAddresses = (addresses: ContactAddress[]): void => {
    onChange({ ...contactDraft, addresses });
  };

  const updateAddress = (addressIndex: number, patch: Partial<ContactAddress>): void => {
    updateContactAddresses(
      contactAddresses.map((address, index) =>
        index === addressIndex ? { ...address, ...patch } : address,
      ),
    );
  };

  const showLabelField = enabledFields.find((field) => field.key === "label");
  const bodyFields = enabledFields.filter((field) => field.key !== "label");

  return (
    <div className="space-y-3">
      {required && contactAddresses.length === 0 && <RequiredBanner message={t("contacts.form.atLeastOneAddressRequired")} />}
      {contactAddresses.length === 0 && <FormEmptyState icon={MapPin} text={t("contacts.form.noAddressesYet")} />}

      {contactAddresses.map((address, addressIndex) => (
        <motion.div
          key={addressIndex}
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
                  value={address.label || defaultAddressLabel}
                  onChange={(value) => updateAddress(addressIndex, { label: value })}
                  onUpdateOptions={updateAddressLabels}
                  placeholder={t("contacts.form.selectLabel")}
                  className={TYPE_SELECT_WIDTH}
                />
              </div>
            ) : (
              <div />
            )}
            <CardRemoveButton
              onClick={() => updateContactAddresses(contactAddresses.filter((_, index) => index !== addressIndex))}
              label={t("contacts.form.removeAddress", { index: addressIndex + 1 })}
            />
          </div>

          {bodyFields.length > 0 && (
            <div className={COLLECTION_BODY}>
              {bodyFields.map((field) => {
                const fieldError = errors.find(
                  (error) => error.tabId === "addresses" && error.index === addressIndex && error.fieldId === field.key
                );
                return (
                  <Field key={field.key} id={`addresses-${addressIndex}-${field.key}`} label={field.label} required={field.required} hint={field.description} error={fieldError?.message}>
                    <CustomFieldInput
                      field={field}
                      value={address[field.key]}
                      onChange={(value) => updateAddress(addressIndex, { [field.key]: value })}
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
        onClick={() => updateContactAddresses([...contactAddresses, createNewAddress()])}
        className="flex items-center min-h-[44px] gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors mt-1 p-0 justify-start"
      >
        <Plus className="w-4 h-4" />
        <span>{t("contacts.form.addAddress")}</span>
      </Button>
    </div>
  );
}
