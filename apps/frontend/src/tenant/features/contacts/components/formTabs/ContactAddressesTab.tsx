import React from "react";
import { MapPin, Plus } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EditableSelect, TYPE_SELECT_WIDTH } from "@/components/ui/FormPrimitives";
import { ListFieldCard, EmptyListCard } from "./FormCardUtils";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { Contact, Address, DEFAULT_ADDRESS_LABELS } from "@mms/shared";

export interface ContactAddressesTabProps {
  contactDraft: Partial<Contact>;
  getLocalId: (tabName: string, idx: number) => string;
  addressLabels: string[];
  defaultCity: string;
  defaultProvince: string;
  defaultCountry: string;
  getListItemError: (tabId: string, fieldId: string, index: number) => string | undefined;
  addSubListItem: <K extends "phones" | "emails" | "addresses" | "socials" | "emergencyContacts">(
    fieldKey: K,
    newItem: NonNullable<Contact[K]>[number]
  ) => void;
  updateSubListItem: <K extends "phones" | "emails" | "addresses" | "socials" | "emergencyContacts">(
    fieldKey: K,
    idx: number,
    patch: Partial<NonNullable<Contact[K]>[number]>
  ) => void;
  removeSubListItem: (fieldKey: "phones" | "emails" | "addresses" | "socials" | "emergencyContacts", idx: number) => void;
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
  updateSubListItem,
  removeSubListItem,
}: ContactAddressesTabProps): JSX.Element {
  const { t } = useTranslation();
  const addresses = contactDraft.addresses || [];
  const addAddress = () => {
    addSubListItem("addresses", {
      label: addressLabels[0] || "Home",
      line1: "",
      city: defaultCity,
      state: defaultProvince,
      country: defaultCountry,
    });
  };
  const removeAddress = (idx: number) => removeSubListItem("addresses", idx);
  const updateAddress = (idx: number, patch: Partial<Address>) => updateSubListItem("addresses", idx, patch);

  return (
    <div className="space-y-3 text-left">
      {addresses.length === 0 && (
        <EmptyListCard icon={MapPin} message={t("contacts.form.noAddressesYet")} />
      )}

      <div className="space-y-3">
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
                accentClass="bg-emerald-500/60 group-hover:bg-emerald-500"
                iconClass="text-emerald-500/70 group-hover:text-emerald-500"
                label={`${t("contacts.form.type")}:`}
                typeSelect={
                  <EditableSelect
                    options={
                      addressLabels.length > 0
                        ? addressLabels
                        : (DEFAULT_ADDRESS_LABELS as unknown as string[])
                    }
                    value={addr.label || "Home"}
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
                      <MapPin className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                      <Input
                        id={`address-line1-${idx}`}
                        name={`address-line1-${idx}`}
                        value={addr.line1 || ""}
                        onChange={(e) => updateAddress(idx, { line1: e.target.value })}
                        placeholder={t("contacts.reportFields.streetAddress")}
                        className={cn(
                          "pl-10",
                          line1Error && "border-destructive focus-visible:ring-destructive",
                        )}
                      />
                    </div>
                    {line1Error && (
                      <p className="text-[10px] text-destructive mt-1 font-medium">
                        {line1Error}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <Input
                        id={`address-city-${idx}`}
                        name={`address-city-${idx}`}
                        value={addr.city || ""}
                        onChange={(e) => updateAddress(idx, { city: e.target.value })}
                        placeholder={t("contacts.reportFields.city")}
                        className={cn(
                          cityError && "border-destructive focus-visible:ring-destructive",
                        )}
                      />
                      {cityError && (
                        <p className="text-[10px] text-destructive mt-1 font-medium">
                          {cityError}
                        </p>
                      )}
                    </div>
                    <Input
                      id={`address-state-${idx}`}
                      name={`address-state-${idx}`}
                      value={addr.state || ""}
                      onChange={(e) => updateAddress(idx, { state: e.target.value })}
                      placeholder={t("contacts.reportFields.state")}
                    />
                    <Input
                      id={`address-country-${idx}`}
                      name={`address-country-${idx}`}
                      value={addr.country || ""}
                      onChange={(e) => updateAddress(idx, { country: e.target.value })}
                      placeholder={t("contacts.reportFields.country")}
                    />
                  </div>
                </div>
              </ListFieldCard>
            );
          })}
        </AnimatePresence>
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={addAddress}
        className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors p-0 justify-start mt-2 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>{t("contacts.form.addAddress")}</span>
      </Button>
    </div>
  );
}
