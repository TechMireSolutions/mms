import React from "react";
import { Mail, Plus } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EditableSelect, TYPE_SELECT_WIDTH } from "@/components/ui/FormPrimitives";
import { ListFieldCard, EmptyListCard } from "./FormCardUtils";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { Contact, EmailAddress, DEFAULT_EMAIL_LABELS } from "@mms/shared";

export interface ContactEmailsTabProps {
  contactDraft: Partial<Contact>;
  getLocalId: (tabName: string, idx: number) => string;
  emailLabels: string[];
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

export function ContactEmailsTab({
  contactDraft,
  getLocalId,
  emailLabels,
  getListItemError,
  addSubListItem,
  updateSubListItem,
  removeSubListItem,
}: ContactEmailsTabProps): JSX.Element {
  const { t } = useTranslation();
  const emails = contactDraft.emails || [];
  const addEmail = () => {
    addSubListItem("emails", { label: emailLabels[0] || "Personal", address: "" });
  };
  const removeEmail = (idx: number) => removeSubListItem("emails", idx);
  const updateEmail = (idx: number, patch: Partial<EmailAddress>) => updateSubListItem("emails", idx, patch);

  return (
    <div className="space-y-3 text-left">
      {emails.length === 0 && (
        <EmptyListCard icon={Mail} message={t("contacts.form.noEmailAddressesYet")} />
      )}

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {emails.map((email, idx) => {
            const emailError = getListItemError("emails", "address", idx);
            return (
              <ListFieldCard
                key={getLocalId("emails", idx)}
                id={getLocalId("emails", idx)}
                index={idx}
                icon={Mail}
                accentClass="bg-amber-500/60 group-hover:bg-amber-500"
                iconClass="text-amber-500/70 group-hover:text-amber-500"
                label={`${t("contacts.form.type")}:`}
                typeSelect={
                  <EditableSelect
                    options={
                      emailLabels.length > 0
                        ? emailLabels
                        : (DEFAULT_EMAIL_LABELS as unknown as string[])
                    }
                    value={email.label || "Personal"}
                    onChange={(val) => updateEmail(idx, { label: val })}
                    className={TYPE_SELECT_WIDTH}
                    id={`email-label-${idx}`}
                    name={`email-label-${idx}`}
                  />
                }
                onRemove={() => removeEmail(idx)}
                removeLabel={t("contacts.form.removeEmailAddress", { index: idx + 1 })}
              >
                <div className="relative flex items-center group/input">
                  <Mail className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                  <Input
                    type="email"
                    id={`email-address-${idx}`}
                    name={`email-address-${idx}`}
                    value={email.address || ""}
                    onChange={(e) => updateEmail(idx, { address: e.target.value })}
                    placeholder={t("auth.emailAddress")}
                    className={cn(
                      "pl-10",
                      emailError && "border-destructive focus-visible:ring-destructive",
                    )}
                  />
                </div>
                {emailError && (
                  <p className="text-[10px] text-destructive mt-1 font-medium">
                    {emailError}
                  </p>
                )}
              </ListFieldCard>
            );
          })}
        </AnimatePresence>
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={addEmail}
        className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors p-0 justify-start mt-2 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>{t("contacts.form.addEmailAddress")}</span>
      </Button>
    </div>
  );
}
