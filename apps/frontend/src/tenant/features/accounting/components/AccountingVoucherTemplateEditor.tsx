import React, { useMemo } from "react";
import type { AppTranslationKey, TemplateFieldDefinition } from "@mms/shared";
import { TemplateEditor } from "@/components/ui/TemplateEditor";
import { useTranslation } from "@/hooks/useTranslation";
import { useBranding } from "@/tenant/hooks/useBranding";
import { saveObject } from "@/lib/db";
import { notify } from "@/lib/notify";
import {
  ACCOUNTING_VOUCHER_TEMPLATE_KEY,
  loadVoucherTemplate,
  type VoucherPrintPayload,
} from "@/tenant/features/accounting/components/voucherTemplateModel";
import {
  buildVoucherTemplate,
  voucherLayoutCopy,
} from "@/tenant/features/accounting/components/voucherTemplateLayout";

const FIELD_DEFS: { field: keyof VoucherPrintPayload & string; labelKey: AppTranslationKey; sample: string }[] = [
  { field: "title", labelKey: "accounting.journal.voucher.title", sample: "Payment Voucher" },
  { field: "institution", labelKey: "accounting.settings.secOrganisation", sample: "Dar Ul Quran" },
  { field: "contactLine", labelKey: "accounting.voucherTemplate.contact", sample: "Lahore · 0300-0000000" },
  { field: "voucherNo", labelKey: "accounting.journal.voucher.voucherNo", sample: "JE-26-0034" },
  { field: "date", labelKey: "accounting.journal.voucher.date", sample: "09/10/2026" },
  { field: "fiscalYear", labelKey: "accounting.journal.voucher.fiscalYear", sample: "2025-2026" },
  { field: "partyLabel", labelKey: "accounting.journal.voucher.paidTo", sample: "Paid To" },
  { field: "partyName", labelKey: "accounting.journal.voucher.receiverName", sample: "Ms. Zehra Haider" },
  { field: "employeeIdLabel", labelKey: "accounting.journal.voucher.employeeId", sample: "Employee ID" },
  { field: "employeeId", labelKey: "accounting.journal.voucher.employeeId", sample: "EMP-14" },
  { field: "designationLabel", labelKey: "accounting.journal.voucher.designation", sample: "Designation" },
  { field: "designation", labelKey: "accounting.journal.voucher.designation", sample: "Teacher" },
  { field: "payPeriodLabel", labelKey: "accounting.journal.voucher.payPeriod", sample: "Pay Period" },
  { field: "payPeriod", labelKey: "accounting.journal.voucher.payPeriod", sample: "2026-09" },
  { field: "purpose", labelKey: "accounting.journal.voucher.purpose", sample: "Salary for September 2026" },
  { field: "sourceLabel", labelKey: "accounting.journal.voucher.paidFrom", sample: "Paid From" },
  { field: "sourceValue", labelKey: "accounting.journal.voucher.paidFrom", sample: "1000 — Cash In Hand" },
  { field: "amount", labelKey: "accounting.journal.voucher.total", sample: "Rs 19,500.00" },
  { field: "netPaid", labelKey: "accounting.journal.voucher.netPaid", sample: "Rs 19,000.00" },
  { field: "amountInWords", labelKey: "accounting.journal.voucher.amountInWords", sample: "Nineteen Thousand PKR Only" },
  { field: "preparedBy", labelKey: "accounting.journal.voucher.preparedBy", sample: "Amina Accountant" },
];

function samplePayload(): VoucherPrintPayload {
  return {
    title: "Payment Voucher",
    institution: "Dar Ul Quran",
    contactLine: "Lahore · 0300-0000000",
    voucherNo: "JE-26-0034",
    date: "09/10/2026",
    fiscalYear: "2025-2026",
    partyLabel: "Paid To",
    partyName: "Ms. Zehra Haider",
    employeeIdLabel: "Employee ID",
    employeeId: "EMP-14",
    designationLabel: "Designation",
    designation: "Teacher",
    payPeriodLabel: "Pay Period",
    payPeriod: "2026-09",
    purpose: "Salary for September 2026",
    sourceLabel: "Paid From",
    sourceValue: "1000 — Cash In Hand",
    lines: [
      { account: "1027 — Salaries payable", debit: "Rs 19,500.00", credit: "", amount: "Rs 19,500.00" },
      { account: "Less: Staff Late Deduction", debit: "", credit: "Rs 500.00", amount: "Rs 500.00" },
    ],
    amount: "Rs 19,500.00",
    netPaid: "Rs 19,000.00",
    amountInWords: "Nineteen Thousand PKR Only",
    preparedBy: "Amina Accountant",
    receiverName: "",
    receiverId: "",
    receiverSign: "",
    receiverDate: "",
  };
}

export function AccountingVoucherTemplateEditor(): React.JSX.Element {
  const { t } = useTranslation();
  const branding = useBranding();
  const copy = useMemo(() => voucherLayoutCopy(t), [t]);
  const a6 = useMemo(() => buildVoucherTemplate("A6", copy), [copy]);
  const a5 = useMemo(() => buildVoucherTemplate("A5", copy), [copy]);
  const current = useMemo(() => loadVoucherTemplate(a6), [a6]);
  const fields = useMemo<TemplateFieldDefinition<VoucherPrintPayload>[]>(
    () => FIELD_DEFS.map((item) => ({ field: item.field, label: t(item.labelKey), sampleValue: item.sample })),
    [t],
  );

  return (
    <TemplateEditor<VoucherPrintPayload>
      title={t("accounting.voucherTemplate.title")}
      template={current}
      defaultTemplate={a6}
      availableFields={fields}
      presets={[
        { key: "a6", label: t("accounting.voucherTemplate.presetA6"), description: t("accounting.voucherTemplate.presetA6Description"), template: a6 },
        { key: "a5", label: t("accounting.voucherTemplate.presetA5"), description: t("accounting.voucherTemplate.presetA5Description"), template: a5 },
      ]}
      documentType="voucher"
      sampleData={samplePayload()}
      fullscreen={false}
      branding={branding}
      onSave={(template) => {
        saveObject(ACCOUNTING_VOUCHER_TEMPLATE_KEY, template);
        notify.success(t("accounting.voucherTemplate.saved"));
      }}
      onClose={() => {}}
    />
  );
}

export default AccountingVoucherTemplateEditor;
