import React from "react";
import { MapPin } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { EditableSelect, TYPE_SELECT_WIDTH } from "@/components/ui/FormPrimitives";
import { ListFieldCard, ContactSubListShell, FieldInlineError } from "./ContactSubListCards";
import type { ContactSubListTabBaseProps } from "./types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveAddressLabel } from "@/lib/contacts/contactI18n";
import { Address, DEFAULT_ADDRESS_LABELS } from "@mms/shared";

export interface ContactAddressesTabProps extends ContactSubListTabBaseProps {
  addressLabels: string[];
  defaultCity: string;
  defaultProvince: string;
  defaultCountry: string;
}

export function ContactAddressesTab({
  contactDraft,
  getLocalId,
  addressLabels,
  defaultCity,
  defaultProvince,
  defaultCountry,
  getListItemError,
  addSubListItem,
  ensureSubListItem,
  updateSubListItem,
  removeSubListItem,
}: ContactAddressesTabProps): JSX.Element {
  const { t } = useTranslation();
  const addresses = contactDraft.addresses || [];
  const emptyAddress = () => ({
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
  const updateAddress = (idx: number, patch: Partial<Address>) => updateSubListItem("addresses", idx, patch);

  return (
    <ContactSubListShell
      isEmpty={addresses.length === 0}
      emptyIcon={MapPin}
      emptyMessage={t("contacts.form.noAddressesYet")}
      addLabel={t("contacts.form.addAddress")}
      onAdd={addAddress}
      onEnsureRow={ensureAddress}
    >
      <AnimatePresence initial={false}>
        {addresses.map((addr, idx) => {
          const line1Error = getListItemError("addresses", "line1", idx);
          const cityError = getListItemError("addresses", "city", idx);
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
                <EditableSelect
                  options={
                    addressLabels.length > 0
                      ? addressLabels
                      : (DEFAULT_ADDRESS_LABELS as unknown as string[])
                  }
                  value={resolveAddressLabel(addr.label, addressLabels, t)}
                  onChange={(val) => updateAddress(idx, { label: val })}
                  className={TYPE_SELECT_WIDTH}
                  id={`address-label-${idx}`}
                  name={`address-label-${idx}`}
                />
              }
              onRemove={() => removeAddress(idx)}
              removeLabel={t("contacts.form.removeAddress", { index: idx + 1 })}
            >
              <div className="space-y-3">
                <div>
                  <div className="relative flex items-center group/input">
                    <MapPin className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                    <Input
                      id={`address-line1-${idx}`}
                      name={`address-line1-${idx}`}
                      value={addr.line1 || ""}
                      onChange={(e) => updateAddress(idx, { line1: e.target.value })}
                      placeholder={t("contacts.fields.streetAddress")}
                      className={cn(
                        "ps-10",
                        line1Error && "border-destructive focus-visible:ring-destructive",
                      )}
                    />
                  </div>
                  <FieldInlineError message={line1Error} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <Input
                      id={`address-city-${idx}`}
                      name={`address-city-${idx}`}
                      value={addr.city || ""}
                      onChange={(e) => updateAddress(idx, { city: e.target.value })}
                      placeholder={t("contacts.fields.city")}
                      className={cn(
                        cityError && "border-destructive focus-visible:ring-destructive",
                      )}
                    />
                    <FieldInlineError message={cityError} />
                  </div>
                  <Input
                    id={`address-state-${idx}`}
                    name={`address-state-${idx}`}
                    value={addr.state || ""}
                    onChange={(e) => updateAddress(idx, { state: e.target.value })}
                    placeholder={t("contacts.fields.state")}
                  />
                  <Input
                    id={`address-country-${idx}`}
                    name={`address-country-${idx}`}
                    value={addr.country || ""}
                    onChange={(e) => updateAddress(idx, { country: e.target.value })}
                    placeholder={t("contacts.fields.country")}
                  />
                </div>
              </div>
            </ListFieldCard>
          );
        })}
      </AnimatePresence>
    </ContactSubListShell>
  );
}
