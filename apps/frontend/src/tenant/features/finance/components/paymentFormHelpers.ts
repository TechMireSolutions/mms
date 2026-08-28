import { PAYMENT_METHODS } from '@/lib/data/financeData';
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { type AppTranslationKey, todayISO, type PaymentCreateInput } from "@mms/shared";

export interface PaymentFormDraft {
  amount: string;
  method: string;
  date: string;
  receivedByUserId: string;
  note: string;
}

export function validatePaymentFormDraft(
  draft: PaymentFormDraft,
  balance: number,
  t: TranslationFunction,
): Record<string, string> {
  const newErrors: Record<string, string> = {};

  if (!draft.amount.trim() || Number(draft.amount) <= 0) {
    newErrors.amount = t("finance.amountRequired");
  } else if (Number(draft.amount) > balance) {
    newErrors.amount = t("finance.amountExceedsBalance");
  }
  if (!draft.method) {
    newErrors.method = t("finance.methodRequired");
  }
  if (!draft.date) {
    newErrors.date = t("finance.dateRequired");
  }
  if (!draft.receivedByUserId) {
    newErrors.receivedByUserId = t("finance.receivedByRequired");
  }

  return newErrors;
}

export function buildInitialPaymentDraft(balance: number, receivedByUserId: string): PaymentFormDraft {
  return {
    amount: balance > 0 ? String(balance) : "",
    method: "Cash",
    date: todayISO(),
    receivedByUserId,
    note: "",
  };
}

export function buildPaymentCreatePayload(
  draft: PaymentFormDraft,
  invoiceId: string,
  studentId: string,
  studentName: string,
  fallbackReceivedByUserId: string,
): PaymentCreateInput {
  return {
    ...draft,
    amount: Number(draft.amount),
    invoiceId,
    studentId,
    studentName,
    receivedByUserId: draft.receivedByUserId || fallbackReceivedByUserId,
  };
}

export const PAYMENT_METHOD_LABEL_KEYS: Record<(typeof PAYMENT_METHODS)[number], AppTranslationKey> = {
  Cash: "finance.paymentMethod.cash",
  "Bank Transfer": "finance.paymentMethod.bank_transfer",
  Online: "finance.paymentMethod.online",
  Cheque: "finance.paymentMethod.cheque",
  Other: "finance.paymentMethod.other",
};
