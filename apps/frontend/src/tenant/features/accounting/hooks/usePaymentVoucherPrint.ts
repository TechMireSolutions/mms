import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatAmountInWords, formatDate, type AppTranslationKey } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { useAccountingCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/lib/contexts/AuthContext";
import { notify } from "@/lib/notify";
import { getPrintBrandingTokens } from "@/lib/printBrandingTokens";
import { buildPrintWindowHtml } from "@/lib/printWindowHtml";
import { getScopedBrandingSettings } from "@/lib/settingsPreviewStore";
import type { Account, JournalEntry } from "@/lib/data/accountingData";
import { facultyResolveQueryOptions } from "@/tenant/hooks/collections/faculty";
import { VOUCHER_KIND_TITLE_KEY, voucherPreparerName } from "@/tenant/features/accounting/components/paymentVoucherKind";
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
 * Prints a voucher for any posted journal entry. Salary payments resolve the
 * staff member's name; other payees stay blank to be filled in by hand.
 * Prepared By is the user who entered the voucher.
 */
export function usePaymentVoucherPrint(accounts: readonly Account[]) {
  const { t, language, isRtl } = useTranslation();
  const { formatCurrency, activeCurrency } = useAccountingCurrency();
  const { user } = useAuth();
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
      const title = t(VOUCHER_KIND_TITLE_KEY[model.kind]);
      labels.title = title;
      if (model.layout === "receipt") {
        labels.paidTo = t("accounting.journal.voucher.receivedFrom");
        labels.paidFrom = t("accounting.journal.voucher.receivedIn");
        labels.paidBy = t("accounting.journal.voucher.receivedBy");
      }
      const contactLine = [branding.addressLine1, branding.city, branding.phone].filter(Boolean).join(" · ");
      const money = (amount: number) => (amount > 0 ? formatCurrency(amount) : "");

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
        deductions: model.deductions.map((row) => ({ account: row.account, amount: formatCurrency(row.amount) })),
        netPaid: model.deductions.length > 0 ? formatCurrency(model.netAmount) : "",
        journalLines: model.journalLines.map((row) => ({
          account: row.account,
          debit: money(row.debit),
          credit: money(row.credit),
        })),
        amount: formatCurrency(model.amount),
        amountInWords: formatAmountInWords(
          model.deductions.length > 0 ? model.netAmount : model.amount,
          activeCurrency.code,
        ),
        layout: model.layout,
        preparedByName: voucherPreparerName(entry.created_by, user?.name ?? ""),
      });

      printWindow.document.write(
        buildPrintWindowHtml({
          windowTitle: t("accounting.journal.voucher.windowTitle", { title, ref: entry.ref || entry.id }),
          language: language || "en",
          direction: isRtl ? "rtl" : "ltr",
          width: PAYMENT_VOUCHER_PAGE.width,
          height: PAYMENT_VOUCHER_PAGE.height,
          bodyContent,
        }),
      );
      printWindow.document.close();
    },
    [accounts, activeCurrency.code, formatCurrency, isRtl, language, resolvePayee, t, user?.name],
  );
}
