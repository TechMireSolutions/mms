import type { DocumentTemplate } from "@mms/shared";
import { readObjectLocal } from "@/lib/db";
import type { PaymentVoucherModel } from "@/tenant/features/accounting/components/paymentVoucherModel";

/** Settings singleton for the accounting voucher layout. Includes "template" so title-case is skipped. */
export const ACCOUNTING_VOUCHER_TEMPLATE_KEY = "accounting_voucher_template";

export interface VoucherLine {
  account: string;
  debit: string;
  credit: string;
  amount: string;
}

/** Flat print payload. `lines` is the only array so the template table binds to it. */
export interface VoucherPrintPayload {
  title: string;
  institution: string;
  contactLine: string;
  voucherNo: string;
  date: string;
  fiscalYear: string;
  partyLabel: string;
  partyName: string;
  employeeIdLabel: string;
  employeeId: string;
  designationLabel: string;
  designation: string;
  payPeriodLabel: string;
  payPeriod: string;
  purpose: string;
  sourceLabel: string;
  sourceValue: string;
  lines: VoucherLine[];
  amount: string;
  netPaid: string;
  amountInWords: string;
  preparedBy: string;
  /** Blank on purpose: the receiver writes these by hand. */
  receiverName: string;
  receiverId: string;
  receiverSign: string;
  receiverDate: string;
}

export type VoucherTemplate = DocumentTemplate<VoucherPrintPayload>;

export function loadVoucherTemplate(fallback: VoucherTemplate): VoucherTemplate {
  const saved = readObjectLocal<VoucherTemplate>(ACCOUNTING_VOUCHER_TEMPLATE_KEY);
  if (!saved || typeof saved.pageSize !== "string" || !Array.isArray(saved.elements)) return fallback;
  return saved;
}

export function voucherTableLines(
  model: PaymentVoucherModel,
  formatMoney: (amount: number) => string,
  deductionLabel: string,
): VoucherLine[] {
  if (model.layout === "journal") {
    return model.journalLines.map((row) => ({
      account: row.account,
      debit: row.debit > 0 ? formatMoney(row.debit) : "",
      credit: row.credit > 0 ? formatMoney(row.credit) : "",
      amount: "",
    }));
  }
  const particulars = model.particulars.map((row) => ({
    account: row.account,
    debit: formatMoney(row.amount),
    credit: "",
    amount: formatMoney(row.amount),
  }));
  const deductions = model.deductions.map((row) => ({
    account: `${deductionLabel}: ${row.account}`,
    debit: "",
    credit: formatMoney(row.amount),
    amount: formatMoney(row.amount),
  }));
  return [...particulars, ...deductions];
}
