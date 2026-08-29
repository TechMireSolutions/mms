import type React from "react";
import { Mail, Star } from "lucide-react";
import type { ContactSubListTabBaseProps } from "./types";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveEmailLabel } from "@/lib/contacts/contactI18n";
import { SUB_LIST_CARD_ACCENTS } from "@/lib/semanticTone";
import { cn } from "@/lib/utils";
import { ContactLabeledValueSubListTab } from "./ContactLabeledValueSubListTab";

export interface ContactEmailsTabProps extends ContactSubListTabBaseProps {
  emailLabels: string[];
  onUpdateEmailLabels: (labels: string[]) => void;
}

export function ContactEmailsTab({
  emailLabels,
  onUpdateEmailLabels,
  ...base
}: ContactEmailsTabProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ContactLabeledValueSubListTab
      {...base}
      listKey="emails"
      labelFieldKey="label"
      valueFieldKey="address"
      valueLabel={t("contacts.fields.emailAddress")}
      options={emailLabels}
      onUpdateOptions={onUpdateEmailLabels}
      resolveLabel={(raw, options, translate) => resolveEmailLabel(raw as string | undefined, options, translate)}
      emptyItem={(resolvedLabel) => ({ label: resolvedLabel, address: "" })}
      icon={Mail}
      accentClass={SUB_LIST_CARD_ACCENTS.emails.accent}
      iconClass={SUB_LIST_CARD_ACCENTS.emails.icon}
      emptyMessage={t("contacts.form.noEmailAddressesYet")}
      addLabel={t("contacts.form.addEmailAddress")}
      removeLabel={(index) => t("contacts.form.removeEmailAddress", { index })}
      valuePlaceholder={t("auth.emailAddress")}
      valueInputType="email"
      valueInputIdPrefix={`cf-${base.formInstanceId}-email-address`}
      labelSelectIdPrefix={`cf-${base.formInstanceId}-email-label`}
      autoComplete="email"
      inputMode="email"
      autoCapitalize="none"
      spellCheck={false}
      enterKeyHint="next"
      headerExtras={({ item, index }) => {
        const emails = base.contactDraft.emails || [];
        if (emails.length <= 1) return null;
        const hasExplicitPrimary = emails.some((e) => e.isPrimary);
        const isPrimary = Boolean(item.isPrimary || (!hasExplicitPrimary && index === 0));
        return (
          <button
            type="button"
            onClick={() => {
              emails.forEach((_, i) => {
                base.updateSubListItem("emails", i, { isPrimary: i === index });
              });
            }}
            className={cn(
              "cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-semibold transition-colors select-none",
              isPrimary
                ? "bg-primary/10 text-primary border border-primary/30"
                : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/40 border border-transparent",
            )}
            title={isPrimary ? t("contacts.form.primaryEmail") : t("contacts.form.primaryEmail")}
            aria-label={t("contacts.form.primaryEmail")}
          >
            <Star className={cn("w-3 h-3", isPrimary && "fill-primary text-primary")} aria-hidden />
            <span>{t("contacts.form.primaryEmail")}</span>
          </button>
        );
      }}
    />
  );
}
