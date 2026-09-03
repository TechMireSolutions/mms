import React from "react";
import { Landmark, Star, CreditCard, Globe, Building2 } from "lucide-react";
import type { Contact } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { DetailSection } from "./DetailSection";
import { CopyBtn } from "@/components/ui/CopyBtn";

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
      <DetailSection title={t("contacts.detail.bankDetails") || "Bank Details"}>
        <div className="p-3 text-xs text-muted-foreground italic">
          {t("contacts.detail.emptyBankDetails") || "No bank accounts recorded."}
        </div>
      </DetailSection>
    );
  }

  return (
    <DetailSection title={t("contacts.detail.bankDetails") || "Bank Details"}>
      {bankDetails.map((bank, idx) => {
        const copySummary = [
          bank.bankName,
          bank.accountTitle,
          bank.accountNumber,
          bank.iban ? `IBAN: ${bank.iban}` : null,
        ]
          .filter(Boolean)
          .join(" · ");

        return (
          <div
            key={bank.id || `bank-${idx}`}
            className="p-3 border-b border-border/50 last:border-b-0 space-y-2 text-xs"
          >
            {/* Header: Bank Name, Badges & Copy */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-foreground inline-flex items-center gap-1">
                    <Landmark className="h-3.5 w-3.5 text-primary" />
                    {bank.bankName}
                  </span>
                  {bank.label ? (
                    <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border">
                      {bank.label}
                    </span>
                  ) : null}
                  {bank.currency ? (
                    <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                      {bank.currency}
                    </span>
                  ) : null}
                  {bank.isPrimary ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <Star className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                      {t("contacts.form.primary") || "Primary"}
                    </span>
                  ) : null}
                </div>

                {bank.accountTitle ? (
                  <div className="text-muted-foreground font-medium">
                    {t("contacts.fields.bankAccountTitle") || "Account Title"}:{" "}
                    <span className="text-foreground">{bank.accountTitle}</span>
                  </div>
                ) : null}
              </div>

              <CopyBtn text={copySummary} showToast />
            </div>

            {/* Account Number & IBAN */}
            <div className="bg-muted/30 rounded-md p-2 space-y-1.5 border border-border/40 font-mono">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground inline-flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  {t("contacts.fields.bankAccountNumber") || "Account"}:
                </span>
                <span className="font-semibold tracking-wider text-foreground select-all">
                  {bank.accountNumber}
                </span>
              </div>

              {bank.iban ? (
                <div className="flex items-center justify-between gap-2 border-t border-border/30 pt-1">
                  <span className="text-muted-foreground inline-flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {t("contacts.fields.bankIban") || "IBAN"}:
                  </span>
                  <span className="tracking-wider text-foreground uppercase select-all">
                    {bank.iban}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Branch & SWIFT info */}
            {(bank.swiftCode || bank.branchName || bank.branchCode || bank.routingNumber) && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-[11px]">
                {bank.swiftCode ? (
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    SWIFT: <span className="font-mono text-foreground">{bank.swiftCode}</span>
                  </span>
                ) : null}
                {bank.branchName ? (
                  <span>
                    {t("contacts.fields.bankBranchName") || "Branch"}:{" "}
                    <span className="text-foreground">{bank.branchName}</span>
                    {bank.branchCode ? ` (${bank.branchCode})` : ""}
                  </span>
                ) : null}
                {bank.routingNumber ? (
                  <span>
                    Routing: <span className="font-mono text-foreground">{bank.routingNumber}</span>
                  </span>
                ) : null}
              </div>
            )}
          </div>
        );
      })}
    </DetailSection>
  );
}
