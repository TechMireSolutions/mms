import {
  todayISO,
  financeSettingsToSequenceConfig,
  formatDeterministicSequence,
  type FinanceSettings,
} from "@mms/shared";

export interface InvoiceDraft {
  studentId: string;
  studentName: string;
  class: string;
  session: string;
  baseFee: string;
  discountType: string;
  discountValue: string;
  dueDate: string;
  feeStructureId: string;
}

export function nextInvoiceId(
  prefixOrSettings: string | Partial<FinanceSettings>,
  currentSeq: number = 1
): string {
  if (typeof prefixOrSettings === "object" && prefixOrSettings !== null) {
    const config = financeSettingsToSequenceConfig(prefixOrSettings);
    return formatDeterministicSequence(currentSeq, config);
  }
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return `${prefixOrSettings || "INV"}-${stamp}`;
}

export function createInitialDraft(dueDays: string): InvoiceDraft {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + Math.max(0, Number.parseInt(dueDays, 10) || 0));
  return {
    studentId: "",
    studentName: "",
    class: "",
    session: "",
    baseFee: "",
    discountType: "",
    discountValue: "0",
    dueDate: dueDate.toISOString().slice(0, 10) || todayISO(),
    feeStructureId: "",
  };
}

export function computeInvoiceAmounts(baseFeeRaw: string, discountValueRaw: string) {
  const baseFee = Number(baseFeeRaw || 0);
  const discountValue = Number(discountValueRaw || 0);
  const discountAmt = Math.min(Math.max(discountValue, 0), Math.max(baseFee, 0));
  const finalAmt = Math.max(baseFee - discountAmt, 0);
  return { baseFee, discountValue, discountAmt, finalAmt };
}

export function canSaveInvoiceDraft(draft: InvoiceDraft, baseFee: number): boolean {
  return (
    draft.studentId.trim().length > 0 &&
    draft.studentName.trim().length > 0 &&
    draft.class.trim().length > 0 &&
    draft.session.trim().length > 0 &&
    draft.dueDate.trim().length > 0 &&
    baseFee > 0
  );
}
