import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatAmountInWords, formatDate, type AppTranslationKey } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { useAccountingCurrency } from "@/hooks/useCurrency";
import { notify } from "@/lib/notify";
import { getPrintBrandingTokens } from "@/lib/printBrandingTokens";
import { buildPrintWindowHtml } from "@/lib/printWindowHtml";
import { getScopedBrandingSettings } from "@/lib/settingsPreviewStore";
import type { Account, JournalEntry } from "@/lib/data/accountingData";
import { facultyResolveQueryOptions } from "@/tenant/hooks/collections/faculty";
import { buildPaymentVoucherModel, type SalaryVoucherRef } from "@/tenant/features/accounting/components/paymentVoucherModel";
import {
  PAYMENT_VOUCHER_LABEL_KEYS,
  PAYMENT_VOUCHER_PAGE,
  buildPaymentVoucherBody,
  type PaymentVoucherLabels,
  type PaymentVoucherPrintInput,
} from "@/tenant/features/accounting/components/paymentVoucherHtml";

type Payee = PaymentVoucherPrintInput["payee"];

/**
 * Prints a payment voucher (with payer/receiver signature blocks) for a posted
 * money-out journal entry. Salary entries resolve the staff member's name; any
 * other payee is left as blank lines to be filled in by hand.
 */
export function usePaymentVoucherPrint(accounts: readonly Account[]) {
  const { t, language, isRtl } = useTranslation();
  const { formatCurrency, activeCurrency } = useAccountingCurrency();
  const queryClient = useQueryClient();

  const resolvePayee = useCallback(
    async (salary: SalaryVoucherRef | null): Promise<Payee> => {
      if (!salary) return null;
      try {
        const faculty = await queryClient.fetchQuery(facultyResolveQueryOptions([salary.staffId]));
        const member = faculty?.find((candidate) => String(candidate.id) === salary.staffId);
        if (!member?.name) return null;
        return { name: member.name, employeeId: member.employeeId ?? "", designation: member.designation ?? "" };
      } catch {
        // Lookup failure is non-fatal: the voucher still prints with a blank payee line to fill by hand.
        return null;
      }
    },
    [queryClient],
  );

  return useCallback(
    async (entry: JournalEntry): Promise<void> => {
      // Open synchronously inside the click so popup blockers allow it; content is written after the payee lookup.
      const printWindow = window.open("", "_blank", "width=700,height=900");
      if (!printWindow) {
        notify.error(t("accounting.journal.voucher.popupBlocked"));
        return;
      }
      const model = buildPaymentVoucherModel(entry, accounts);
      const payee = await resolvePayee(model.salary);
      const branding = getScopedBrandingSettings();
      const labels = Object.fromEntries(
        PAYMENT_VOUCHER_LABEL_KEYS.map((key) => [key, t(`accounting.journal.voucher.${key}` as AppTranslationKey)]),
      ) as PaymentVoucherLabels;
      const contactLine = [branding.addressLine1, branding.city, branding.phone].filter(Boolean).join(" · ");

      const bodyContent = buildPaymentVoucherBody({
        labels,
        institution: { name: branding.madrasaName, logoUrl: branding.logoUrl, contactLine },
        primaryColor: getPrintBrandingTokens().primary,
        voucherNo: entry.ref || entry.id,
        date: formatDate(entry.date),
        fiscalYear: entry.fiscal_year,
        narration: entry.description,
        payee,
        payPeriod: model.salary?.payPeriod ?? null,
        paidFrom: model.paidFrom,
        particulars: model.particulars.map((row) => ({ account: row.account, amount: formatCurrency(row.amount) })),
        amount: formatCurrency(model.amount),
        amountInWords: formatAmountInWords(model.amount, activeCurrency.code),
      });

      printWindow.document.write(
        buildPrintWindowHtml({
          windowTitle: t("accounting.journal.voucher.windowTitle", { ref: entry.ref || entry.id }),
          language: language || "en",
          direction: isRtl ? "rtl" : "ltr",
          width: PAYMENT_VOUCHER_PAGE.width,
          height: PAYMENT_VOUCHER_PAGE.height,
          bodyContent,
        }),
      );
      printWindow.document.close();
    },
    [accounts, activeCurrency.code, formatCurrency, isRtl, language, resolvePayee, t],
  );
}
