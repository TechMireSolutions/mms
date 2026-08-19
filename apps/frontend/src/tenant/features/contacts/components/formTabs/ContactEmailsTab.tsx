import { Mail } from "lucide-react";
import type { ContactSubListTabBaseProps } from "./types";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveEmailLabel } from "@/lib/contacts/contactI18n";
import { ContactLabeledValueSubListTab } from "./ContactLabeledValueSubListTab";

interface ContactEmailsTabProps extends ContactSubListTabBaseProps {
  emailLabels: string[];
  onUpdateEmailLabels: (labels: string[]) => void;
}

export function ContactEmailsTab({
  emailLabels,
  onUpdateEmailLabels,
  ...base
}: ContactEmailsTabProps): JSX.Element {
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
      accentClass="bg-warning/60 group-hover:bg-warning"
      iconClass="text-warning group-hover:text-warning"
      emptyMessage={t("contacts.form.noEmailAddressesYet")}
      addLabel={t("contacts.form.addEmailAddress")}
      removeLabel={(index) => t("contacts.form.removeEmailAddress", { index })}
      valuePlaceholder={t("auth.emailAddress")}
      valueInputType="email"
      valueInputIdPrefix="email-address"
      labelSelectIdPrefix="email-label"
    />
  );
}
