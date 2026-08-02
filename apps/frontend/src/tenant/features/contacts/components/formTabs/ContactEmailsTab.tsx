import React from "react";
import { Mail } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { EditableSelect, TYPE_SELECT_WIDTH } from "@/components/ui/FormPrimitives";
import { ListFieldCard, ContactSubListShell, FieldInlineError } from "./ContactSubListCards";
import type { ContactSubListTabBaseProps } from "./types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveEmailLabel } from "@/lib/contacts/contactI18n";
import { EmailAddress } from "@mms/shared";

export interface ContactEmailsTabProps extends ContactSubListTabBaseProps {
  emailLabels: string[];
  onUpdateEmailLabels: (labels: string[]) => void;
}

export function ContactEmailsTab({
  contactDraft,
  getLocalId,
  emailLabels,
  onUpdateEmailLabels,
  getListItemError,
  isFieldEnabled,
  isFieldRequired,
  addSubListItem,
  ensureSubListItem,
  updateSubListItem,
  removeSubListItem,
}: ContactEmailsTabProps): JSX.Element {
  const { t } = useTranslation();
  const showLabel = isFieldEnabled("emails", "label");
  const showAddress = isFieldEnabled("emails", "address");
  const allowAdd = showLabel || showAddress;
  const emails = contactDraft.emails || [];
  const emptyEmail = () => ({
    label: resolveEmailLabel(undefined, emailLabels, t),
    address: "",
  });
  const addEmail = () => {
    addSubListItem("emails", emptyEmail());
  };
  const ensureEmail = () => {
    ensureSubListItem("emails", emptyEmail());
  };
  const removeEmail = (idx: number) => removeSubListItem("emails", idx);
  const updateEmail = (idx: number, patch: Partial<EmailAddress>) => updateSubListItem("emails", idx, patch);

  return (
    <ContactSubListShell
      isEmpty={emails.length === 0}
      emptyIcon={Mail}
      emptyMessage={t("contacts.form.noEmailAddressesYet")}
      addLabel={t("contacts.form.addEmailAddress")}
      onAdd={addEmail}
      onEnsureRow={ensureEmail}
      allowAdd={allowAdd}
    >
      <AnimatePresence initial={false}>
        {emails.map((email, idx) => {
          const emailError = getListItemError("emails", "address", idx);
          return (
            <ListFieldCard
              key={getLocalId("emails", idx)}
              id={getLocalId("emails", idx)}
              index={idx}
              icon={Mail}
              accentClass="bg-warning/60 group-hover:bg-warning"
              iconClass="text-warning group-hover:text-warning"
              label={`${t("contacts.form.type")}:`}
              typeSelect={
                showLabel ? (
                  <EditableSelect
                    options={emailLabels}
                    value={resolveEmailLabel(email.label, emailLabels, t)}
                    onChange={(val) => updateEmail(idx, { label: val })}
                    onUpdateOptions={onUpdateEmailLabels}
                    className={TYPE_SELECT_WIDTH}
                    id={`email-label-${idx}`}
                    name={`email-label-${idx}`}
                  />
                ) : undefined
              }
              onRemove={() => removeEmail(idx)}
              removeLabel={t("contacts.form.removeEmailAddress", { index: idx + 1 })}
            >
              {showAddress ? (
                <>
                  <div className="relative flex items-center group/input">
                    <Mail className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                    <Input
                      type="email"
                      id={`email-address-${idx}`}
                      name={`email-address-${idx}`}
                      value={email.address || ""}
                      required={isFieldRequired("emails", "address")}
                      onChange={(e) => updateEmail(idx, { address: e.target.value })}
                      placeholder={t("auth.emailAddress")}
                      className={cn(
                        "ps-10",
                        emailError && "border-destructive focus-visible:ring-destructive",
                      )}
                    />
                  </div>
                  <FieldInlineError message={emailError} />
                </>
              ) : null}
            </ListFieldCard>
          );
        })}
      </AnimatePresence>
    </ContactSubListShell>
  );
}
