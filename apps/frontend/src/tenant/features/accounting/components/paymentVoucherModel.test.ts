import { describe, expect, it } from "vitest";
import type { Account, JournalEntry } from "@/lib/data/accountingData";
import {
  buildPaymentVoucherModel,
  isPaymentVoucherEligible,
  parseSalaryVoucherRef,
} from "@/tenant/features/accounting/components/paymentVoucherModel";
import { PAYMENT_VOUCHER_LABEL_KEYS, buildPaymentVoucherBody } from "@/tenant/features/accounting/components/paymentVoucherHtml";

const account = (id: string, type: Account["type"], name: string): Account => ({
  id, code: id.toUpperCase(), name, type, subtype: "", description: "", isActive: true,
});
const accounts = [account("cash", "Asset", "Cash"), account("sal", "Expense", "Salaries"), account("fee", "Revenue", "Fees")];

const entry = (overrides: Partial<JournalEntry> = {}): JournalEntry => ({
  id: "je-1", date: "2026-09-30", ref: "JV-1", description: "", status: "posted", created_by: "",
  tags: [], attachments: [], fiscal_year: "2026", lines: [], ...overrides,
});

const salaryLines = [
  { id: "l1", account_id: "sal", debit: 25000, credit: 0, description: "Salary payment — staff fac-42 (2026-09)" },
  { id: "l2", account_id: "cash", debit: 0, credit: 25000, description: "Salary payment — staff fac-42 (2026-09)" },
];

describe("parseSalaryVoucherRef", () => {
  it("given a salary entry with a custom note, should read staff id and pay period from the line description", () => {
    const salary = entry({ transaction_type: "salary", description: "September pay", lines: salaryLines });
    expect(parseSalaryVoucherRef(salary)).toEqual({ staffId: "fac-42", payPeriod: "2026-09" });
  });

  it("given no parsable line description, should fall back to the SAL- reference", () => {
    const salary = entry({ transaction_type: "salary", ref: "SAL-2026-08-fac-7", lines: [] });
    expect(parseSalaryVoucherRef(salary)).toEqual({ staffId: "fac-7", payPeriod: "2026-08" });
  });

  it("given a non-salary entry, should return null", () => {
    expect(parseSalaryVoucherRef(entry({ lines: salaryLines }))).toBeNull();
  });
});

describe("isPaymentVoucherEligible", () => {
  it("given a posted entry debiting an expense account, should be eligible", () => {
    expect(isPaymentVoucherEligible(entry({ lines: salaryLines }), accounts)).toBe(true);
  });

  it("given a draft, archived or money-in entry, should not be eligible", () => {
    expect(isPaymentVoucherEligible(entry({ status: "draft", lines: salaryLines }), accounts)).toBe(false);
    expect(isPaymentVoucherEligible(entry({ deletedAt: "2026-10-01", lines: salaryLines }), accounts)).toBe(false);
    const feeIn = entry({
      lines: [
        { id: "a", account_id: "cash", debit: 500, credit: 0, description: "" },
        { id: "b", account_id: "fee", debit: 0, credit: 500, description: "" },
      ],
    });
    expect(isPaymentVoucherEligible(feeIn, accounts)).toBe(false);
  });
});

describe("buildPaymentVoucherModel", () => {
  it("given a salary entry, should total the debits and list the paying account", () => {
    const model = buildPaymentVoucherModel(entry({ transaction_type: "salary", lines: salaryLines }), accounts);
    expect(model.amount).toBe(25000);
    expect(model.particulars).toEqual([{ account: "SAL — Salaries", amount: 25000 }]);
    expect(model.paidFrom).toEqual(["CASH — Cash"]);
    expect(model.salary?.staffId).toBe("fac-42");
  });
});

describe("buildPaymentVoucherBody", () => {
  it("given untrusted text and no payee, should escape it and render blank receiver signature lines", () => {
    const labels = Object.fromEntries(PAYMENT_VOUCHER_LABEL_KEYS.map((key) => [key, key])) as Record<
      (typeof PAYMENT_VOUCHER_LABEL_KEYS)[number],
      string
    >;
    const html = buildPaymentVoucherBody({
      labels,
      institution: { name: "Madrasa <script>", logoUrl: "", contactLine: "" },
      primaryColor: "#0369a1",
      voucherNo: "JV-1", date: "30 Sep 2026", fiscalYear: "2026", narration: "Electricity & gas",
      payee: null, payPeriod: null, paidFrom: ["Cash"],
      particulars: [{ account: "Utilities", amount: "Rs 1,000" }],
      amount: "Rs 1,000", amountInWords: "One Thousand PKR Only",
    });
    expect(html).toContain("Madrasa &lt;script&gt;");
    expect(html).toContain("Electricity &amp; gas");
    expect(html).toContain("receivedBy");
    expect(html).toContain("thumbImpression");
    expect(html).not.toContain("employeeId");
  });
});
