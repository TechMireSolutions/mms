import type React from "react";
import { MapPin, Building, Landmark, Star } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { EditableSelect, Field } from "@/components/ui/FormPrimitives";
import { LeadingIconInput } from "@/components/ui/LeadingIconInput";
import { ListFieldCard, ContactSubListShell, resolveSubListAllowAdd } from "./ContactSubListCards";
import type { ContactSubListTabBaseProps } from "./types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveAddressLabel } from "@/lib/contacts/contactI18n";
import { SUB_LIST_CARD_ACCENTS } from "@/lib/semanticTone";
import type { Address } from "@mms/shared";

export interface ContactAddressesTabProps extends ContactSubListTabBaseProps {
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
  fields: _fields,
  formInstanceId,
  addSubListItem,
  ensureSubListItem,
  updateSubListItem,
  removeSubListItem,
}: ContactAddressesTabProps): React.JSX.Element {
  const { t } = useTranslation();
  const showLabel = isFieldEnabled("addresses", "label");
  const showLine1 = isFieldEnabled("addresses", "line1");
  const showCity = isFieldEnabled("addresses", "city");
  const showState = isFieldEnabled("addresses", "state");
  const showCountry = isFieldEnabled("addresses", "country");
  const allowAdd = resolveSubListAllowAdd([showLabel, showLine1, showCity, showState, showCountry]);
  const addresses = contactDraft.addresses || [];
  const emptyAddress = (): Address => ({
    label: resolveAddressLabel(undefined, addressLabels, t),
    line1: "",
    city: defaultCity,
    state: defaultProvince,
    country: defaultCountry,
  });
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
              accentClass={SUB_LIST_CARD_ACCENTS.addresses.accent}
              iconClass={SUB_LIST_CARD_ACCENTS.addresses.icon}
              label={`${t("contacts.form.type")}:`}
              typeSelect={
                showLabel ? (
                  <EditableSelect
                    options={addressLabels}
                    value={resolveAddressLabel(addr.label, addressLabels, t)}
                    onChange={(val) => updateAddress(idx, { label: val })}
                    onUpdateOptions={onUpdateAddressLabels}
                    className="w-36 @sm:w-48 min-w-0"
                    id={`cf-${formInstanceId}-address-label-${idx}`}
                    name={`cf-${formInstanceId}-address-label-${idx}`}
                  />
                ) : undefined
              }
              headerExtras={
                addresses.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      addresses.forEach((_, i) => {
                        updateAddress(i, { isPrimary: i === idx });
                      });
                    }}
                    className={cn(
                      "cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-semibold transition-colors select-none",
                      (addr.isPrimary || (!addresses.some((a) => a.isPrimary) && idx === 0))
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/40 border border-transparent",
                    )}
                    title={t("contacts.form.primaryAddress")}
                    aria-label={t("contacts.form.primaryAddress")}
                  >
                    <Star
                      className={cn(
                        "w-3 h-3",
                        (addr.isPrimary || (!addresses.some((a) => a.isPrimary) && idx === 0)) &&
                          "fill-primary text-primary",
                      )}
                      aria-hidden
                    />
                    <span>{t("contacts.form.primaryAddress")}</span>
                  </button>
                ) : undefined
              }
              onRemove={() => removeAddress(idx)}
              removeLabel={t("contacts.form.removeAddress", { index: idx + 1 })}
            >
              <div className="space-y-3">
                {showLine1 ? (
                  <Field
                    label={t("contacts.fields.streetAddress")}
                    required={isFieldRequired("addresses", "line1")}
                    error={line1Error}
                    id={`cf-${formInstanceId}-address-line1-${idx}`}
                  >
                    <LeadingIconInput
                      icon={MapPin}
                      id={`cf-${formInstanceId}-address-line1-${idx}`}
                      name={`cf-${formInstanceId}-address-line1-${idx}`}
                      autoComplete="street-address"
                      autoCapitalize="words"
                      enterKeyHint="next"
                      aria-invalid={Boolean(line1Error)}
                      value={addr.line1 || ""}
                      required={isFieldRequired("addresses", "line1")}
                      onChange={(e) => updateAddress(idx, { line1: e.target.value })}
                      placeholder={t("contacts.fields.streetAddress")}
                      className={cn(line1Error && "border-destructive focus-visible:ring-destructive")}
                    />
                  </Field>
                ) : null}
                {showCity || showState || showCountry ? (
                  <div className="grid grid-cols-1 gap-3 @sm:grid-cols-3">
                    {showCity ? (
                      <Field
                        label={t("contacts.fields.city")}
                        required={isFieldRequired("addresses", "city")}
                        error={cityError}
                        id={`cf-${formInstanceId}-address-city-${idx}`}
                      >
                        <LeadingIconInput
                          icon={Building}
                          id={`cf-${formInstanceId}-address-city-${idx}`}
                          name={`cf-${formInstanceId}-address-city-${idx}`}
                          autoComplete="address-level2"
                          autoCapitalize="words"
                          enterKeyHint="next"
                          aria-invalid={Boolean(cityError)}
                          value={addr.city || ""}
                          required={isFieldRequired("addresses", "city")}
                          onChange={(e) => updateAddress(idx, { city: e.target.value })}
                          placeholder={t("contacts.fields.city")}
                          className={cn(
                            cityError && "border-destructive focus-visible:ring-destructive",
                          )}
                        />
                      </Field>
                    ) : null}
                    {showState ? (
                      <Field
                        label={t("contacts.fields.state")}
                        required={isFieldRequired("addresses", "state")}
                        error={stateError}
                        id={`cf-${formInstanceId}-address-state-${idx}`}
                      >
                        <LeadingIconInput
                          icon={Landmark}
                          id={`cf-${formInstanceId}-address-state-${idx}`}
                          name={`cf-${formInstanceId}-address-state-${idx}`}
                          autoComplete="address-level1"
                          autoCapitalize="words"
                          enterKeyHint="next"
                          aria-invalid={Boolean(stateError)}
                          value={addr.state || ""}
                          required={isFieldRequired("addresses", "state")}
                          onChange={(e) => updateAddress(idx, { state: e.target.value })}
                          placeholder={t("contacts.fields.state")}
                          className={cn(
                            stateError && "border-destructive focus-visible:ring-destructive",
                          )}
                        />
                      </Field>
                    ) : null}
                    {showCountry ? (
                      <Field
                        label={t("contacts.fields.country")}
                        required={isFieldRequired("addresses", "country")}
                        error={countryError}
                        id={`cf-${formInstanceId}-address-country-${idx}`}
                      >
                        <EditableSelect
                          options={countryOptions}
                          value={addr.country || defaultCountry || countryOptions[0] || ""}
                          onChange={(val) => updateAddress(idx, { country: val })}
                          onUpdateOptions={onUpdateCountryOptions}
                          className="w-full min-w-0"
                          id={`cf-${formInstanceId}-address-country-${idx}`}
                          name={`cf-${formInstanceId}-address-country-${idx}`}
                          placeholder={t("contacts.fields.country")}
                        />
                      </Field>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </ListFieldCard>
          );
        })}
      </AnimatePresence>
    </ContactSubListShell>
  );
}
