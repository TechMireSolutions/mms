import React from "react";
import { MapPin } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { EditableSelect, FieldErrorMessage, TYPE_SELECT_WIDTH } from "@/components/ui/FormPrimitives";
import { LeadingIconInput } from "@/components/ui/LeadingIconInput";
import { ListFieldCard, ContactSubListShell, resolveSubListAllowAdd } from "./ContactSubListCards";
import {
  ContactSubListCustomFields,
  withSubListCustomFieldDefaults,
} from "./ContactSubListCustomFields";
import type { ContactSubListTabBaseProps } from "./types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveAddressLabel } from "@/lib/contacts/contactI18n";
import { Address, listEnabledCustomContactFormFields } from "@mms/shared";

interface ContactAddressesTabProps extends ContactSubListTabBaseProps {
  addressLabels: string[];
  onUpdateAddressLabels: (labels: string[]) => void;
  countryOptions: string[];
  onUpdateCountryOptions: (countries: string[]) => void;
  defaultCity: string;
  defaultProvince: string;
  defaultCountry: string;
}

export function ContactAddressesTab({
  contactDraft,
  getLocalId,
  addressLabels,
  onUpdateAddressLabels,
  countryOptions,
  onUpdateCountryOptions,
  defaultCity,
  defaultProvince,
  defaultCountry,
  getListItemError,
  isFieldEnabled,
  isFieldRequired,
  fields,
  formInstanceId,
  addSubListItem,
  ensureSubListItem,
  updateSubListItem,
  removeSubListItem,
}: ContactAddressesTabProps): JSX.Element {
  const { t } = useTranslation();
  const showLabel = isFieldEnabled("addresses", "label");
  const showLine1 = isFieldEnabled("addresses", "line1");
  const showCity = isFieldEnabled("addresses", "city");
  const showState = isFieldEnabled("addresses", "state");
  const showCountry = isFieldEnabled("addresses", "country");
  const customFields = listEnabledCustomContactFormFields(fields, "addresses");
  const allowAdd = resolveSubListAllowAdd(
    [showLabel, showLine1, showCity, showState, showCountry],
    customFields.length,
  );
  const addresses = contactDraft.addresses || [];
  const emptyAddress = () =>
    withSubListCustomFieldDefaults(
      {
        label: resolveAddressLabel(undefined, addressLabels, t),
        line1: "",
        city: defaultCity,
        state: defaultProvince,
        country: defaultCountry,
      },
      fields,
      "addresses",
    );
  const addAddress = () => {
    addSubListItem("addresses", emptyAddress());
  };
  const ensureAddress = () => {
    ensureSubListItem("addresses", emptyAddress());
  };
  const removeAddress = (idx: number) => removeSubListItem("addresses", idx);
  const updateAddress = (idx: number, patch: Partial<Address> & Record<string, unknown>) =>
    updateSubListItem("addresses", idx, patch);

  return (
    <ContactSubListShell
      isEmpty={addresses.length === 0}
      emptyIcon={MapPin}
      emptyMessage={t("contacts.form.noAddressesYet")}
      addLabel={t("contacts.form.addAddress")}
      onAdd={addAddress}
      onEnsureRow={ensureAddress}
      allowAdd={allowAdd}
    >
      <AnimatePresence initial={false}>
        {addresses.map((addr, idx) => {
          const line1Error = getListItemError("addresses", "line1", idx);
          const cityError = getListItemError("addresses", "city", idx);
          const stateError = getListItemError("addresses", "state", idx);
          const countryError = getListItemError("addresses", "country", idx);
          return (
            <ListFieldCard
              key={getLocalId("addresses", idx)}
              id={getLocalId("addresses", idx)}
              index={idx}
              icon={MapPin}
              accentClass="bg-success/60 group-hover:bg-success"
              iconClass="text-success group-hover:text-success"
              label={`${t("contacts.form.type")}:`}
              typeSelect={
                showLabel ? (
                  <EditableSelect
                    options={addressLabels}
                    value={resolveAddressLabel(addr.label, addressLabels, t)}
                    onChange={(val) => updateAddress(idx, { label: val })}
                    onUpdateOptions={onUpdateAddressLabels}
                    className={TYPE_SELECT_WIDTH}
                    id={`address-label-${idx}`}
                    name={`address-label-${idx}`}
                  />
                ) : undefined
              }
              onRemove={() => removeAddress(idx)}
              removeLabel={t("contacts.form.removeAddress", { index: idx + 1 })}
            >
              <div className="space-y-3">
                {showLine1 ? (
                  <div>
                    <LeadingIconInput
                      icon={MapPin}
                      id={`address-line1-${idx}`}
                      name={`address-line1-${idx}`}
                      value={addr.line1 || ""}
                      required={isFieldRequired("addresses", "line1")}
                      onChange={(e) => updateAddress(idx, { line1: e.target.value })}
                      placeholder={t("contacts.fields.streetAddress")}
                      className={cn(line1Error && "border-destructive focus-visible:ring-destructive")}
                    />
                    <FieldErrorMessage message={line1Error} />
                  </div>
                ) : null}
                {showCity || showState || showCountry ? (
                  <div className="grid grid-cols-1 gap-2.5 @sm:grid-cols-3">
                    {showCity ? (
                      <div>
                        <Input
                          id={`address-city-${idx}`}
                          name={`address-city-${idx}`}
                          value={addr.city || ""}
                          required={isFieldRequired("addresses", "city")}
                          onChange={(e) => updateAddress(idx, { city: e.target.value })}
                          placeholder={t("contacts.fields.city")}
                          className={cn(
                            cityError && "border-destructive focus-visible:ring-destructive",
                          )}
                        />
                        <FieldErrorMessage message={cityError} />
                      </div>
                    ) : null}
                    {showState ? (
                      <div>
                        <Input
                          id={`address-state-${idx}`}
                          name={`address-state-${idx}`}
                          value={addr.state || ""}
                          required={isFieldRequired("addresses", "state")}
                          onChange={(e) => updateAddress(idx, { state: e.target.value })}
                          placeholder={t("contacts.fields.state")}
                          className={cn(
                            stateError && "border-destructive focus-visible:ring-destructive",
                          )}
                        />
                        <FieldErrorMessage message={stateError} />
                      </div>
                    ) : null}
                    {showCountry ? (
                      <div>
                        <EditableSelect
                          options={countryOptions}
                          value={addr.country || defaultCountry || countryOptions[0] || ""}
                          onChange={(val) => updateAddress(idx, { country: val })}
                          onUpdateOptions={onUpdateCountryOptions}
                          className="w-full min-w-0"
                          id={`address-country-${idx}`}
                          name={`address-country-${idx}`}
                          placeholder={t("contacts.fields.country")}
                        />
                        <FieldErrorMessage message={countryError} />
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <ContactSubListCustomFields
                  tabId="addresses"
                  fields={fields}
                  formInstanceId={formInstanceId}
                  rowIndex={idx}
                  row={addr}
                  getListItemError={getListItemError}
                  onPatch={(patch) => updateAddress(idx, patch)}
                />
              </div>
            </ListFieldCard>
          );
        })}
      </AnimatePresence>
    </ContactSubListShell>
  );
}
