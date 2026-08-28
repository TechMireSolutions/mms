import type React from "react";
import { Mail } from "lucide-react";
import type { ContactSubListTabBaseProps } from "./types";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveEmailLabel } from "@/lib/contacts/contactI18n";
import { SUB_LIST_CARD_ACCENTS } from "@/lib/semanticTone";
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
    />
  );
}
