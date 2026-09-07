import React from "react";
import { Landmark, CreditCard } from "lucide-react";
import type { Contact } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { DetailSection } from "./DetailSection";
import { CopyBtn } from "@/components/ui/CopyBtn";
import { EmptyState } from "@/components/ui/EmptyState";

export interface ContactDetailBankDetailsSectionProps {
  contact: Contact;
}

export function ContactDetailBankDetailsSection({
  contact,
}: ContactDetailBankDetailsSectionProps): React.JSX.Element {
  const { t } = useTranslation();
  const bankDetails = contact.bankDetails ?? [];

  if (bankDetails.length === 0) {
    return (
      <DetailSection title={t("contacts.detail.bankDetails")}>
        <EmptyState compact icon={Landmark} title={t("contacts.detail.emptyBankDetails")} />
      </DetailSection>
    );
  }

  return (
    <DetailSection title={t("contacts.detail.bankDetails")}>
      {bankDetails.map((bank, idx) => {
        const copySummary = [bank.bankName, bank.accountType, bank.accountNumber]
          .filter(Boolean)
          .join(" · ");

        return (
          <div
            key={bank.id || `bank-${idx}`}
            className="p-3 border-b border-border/50 last:border-b-0 space-y-2 text-xs"
          >
            {/* Header: Bank Name, Account Type Badge & Copy */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-foreground inline-flex items-center gap-1">
                    <Landmark className="h-3.5 w-3.5 text-primary" />
                    {bank.bankName || t("contacts.form.bankAccount")}
                  </span>
                  {bank.accountType ? (
                    <span className="px-1.5 py-0.5 rounded text-3xs font-medium bg-muted text-muted-foreground border border-border">
                      {bank.accountType}
                    </span>
                  ) : null}
                </div>
              </div>

              {copySummary ? <CopyBtn text={copySummary} showToast /> : null}
            </div>

            {/* Account Number / IBAN */}
            {bank.accountNumber ? (
              <div className="bg-muted/30 rounded-md p-2 space-y-1.5 border border-border/40 font-mono">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground inline-flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    {t("contacts.fields.bankAccountNumber")}:
                  </span>
                  <span className="font-semibold tracking-wider text-foreground select-all">
                    {bank.accountNumber}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </DetailSection>
  );
}
