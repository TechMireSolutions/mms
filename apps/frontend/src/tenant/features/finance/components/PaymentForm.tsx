import React, { useMemo, useState } from "react";
import { ReceiptText, Coins, DollarSign, FileText } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/FormPrimitives";
import { UserActorSelect } from "@/components/ui/UserActorSelect";

import { useAuth } from "@/lib/contexts/AuthContext";
import { notify } from "@/lib/notify";
import { PAYMENT_METHODS, Invoice } from '@/lib/data/financeData';
import { FORM_INPUT } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";
import { Card } from "@/components/ui/card";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { useTranslation } from "@/hooks/useTranslation";
import { AppTranslationKey, todayISO, type PaymentCreateInput } from "@mms/shared";
import { NotifiedFinanceMutationError } from "@/tenant/features/finance/hooks/useFinanceApi";

interface PaymentFormProps {
  open: boolean;
  invoice: Invoice | null;
  onClose: () => void;
  onSave: (payment: PaymentCreateInput) => void | Promise<void>;
}

const PAYMENT_METHOD_LABEL_KEYS: Record<(typeof PAYMENT_METHODS)[number], AppTranslationKey> = {
  Cash: "finance.paymentMethod.cash",
  "Bank Transfer": "finance.paymentMethod.bank_transfer",
  Online: "finance.paymentMethod.online",
  Cheque: "finance.paymentMethod.cheque",
  Other: "finance.paymentMethod.other",
};

export function PaymentForm({ open, invoice, onClose, onSave }: PaymentFormProps): React.JSX.Element {
  const { user: authUser } = useAuth();
  const { t } = useTranslation();
  const { formatCurrency, activeCurrency } = useFinanceCurrency();
  const balance = invoice ? invoice.finalAmt - (invoice.paidAmt || 0) : 0;

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [paymentDraft, setPaymentDraft] = useState(() => ({
    amount: balance,
    method: "Cash",
    date: todayISO(),
    receivedByUserId: authUser?.id || "",
    note: "",
  }));

  const paymentMethodOptions = useMemo(
    () =>
      PAYMENT_METHODS.map((method) => ({
        value: method,
        label: t(PAYMENT_METHOD_LABEL_KEYS[method]),
      })),
    [t],
  );

  const updateDraft = (patch: Partial<typeof paymentDraft>) => {
    setPaymentDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (!paymentDraft.amount || Number(paymentDraft.amount) <= 0) {
      newErrors.amount = t("finance.amountRequired");
    } else if (Number(paymentDraft.amount) > balance) {
      newErrors.amount = t("finance.amountExceedsBalance");
    }
    if (!paymentDraft.method) {
      newErrors.method = t("finance.methodRequired");
    }
    if (!paymentDraft.date) {
      newErrors.date = t("finance.dateRequired");
    }
    if (!paymentDraft.receivedByUserId) {
      newErrors.receivedByUserId = t("finance.receivedByRequired");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notify.error(t("finance.fixErrors"));
      return;
    }

    if (!invoice) return;

    setSaving(true);
    try {
      await onSave({
        ...paymentDraft,
        amount: Number(paymentDraft.amount),
        invoiceId: invoice.id,
        studentId: invoice.studentId,
        studentName: invoice.studentName,
        receivedByUserId: paymentDraft.receivedByUserId || authUser?.id || '',
      });
      notify.success(t("finance.paymentSaved"));
      onClose();
    } catch (err: unknown) {
      if (!(err instanceof NotifiedFinanceMutationError)) {
        notify.error(t("finance.paymentSaveFailed"), { description: err instanceof Error ? err.message : String(err) });
      }
    } finally {
      setSaving(false);
    }
  };

  const footerStart = invoice ? (
    <div className="flex flex-wrap items-center gap-2.5 text-xs">
      <span className="font-bold text-foreground bg-muted/65 px-2.5 py-1 rounded-lg border border-border/60">
        {invoice.studentName}
      </span>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-success/10 text-success font-semibold border border-success/20 text-[10px]">
          {t("finance.balance", { balance: formatCurrency(balance - Number(paymentDraft.amount || 0)) })}
        </span>
      </div>
    </div>
  ) : null;

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={t("finance.recordPayment")}
      icon={ReceiptText}
      cancelLabel={t("common.cancel")}
      saveLabel={t("finance.recordPayment")}
      onSave={handleSave}
      saving={saving}
      saveDisabled={!paymentDraft.amount || Number(paymentDraft.amount) <= 0}
      footerStart={footerStart || undefined}
    >
      <div className="space-y-5 text-left">
        {invoice && (
          <Card accentColor="primary" className="p-5 px-6 space-y-2 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-[14px] font-bold text-foreground m-0">{invoice.studentName}</h4>
                <p className="text-[11px] text-muted-foreground m-0 mt-0.5">{invoice.id} · {invoice.class}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">{t("finance.balanceDue")}</p>
                <p className="text-[14px] font-bold text-primary m-0 mt-0.5">{formatCurrency(balance)}</p>
              </div>
            </div>
          </Card>
        )}

        <Card accentColor="primary" className="p-5.5 px-6.5 pb-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40">
            <Coins className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("finance.paymentDetails")}</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label={`${t("finance.columns.amount")} (${activeCurrency.code}) *`} error={errors.amount}>
                <div className="relative flex items-center group/input">
                  <DollarSign className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                  <Input
                    id="payment-amount-input"
                    name="amount"
                    type="number"
                    className="pl-10"
                    value={paymentDraft.amount || ""}
                    onChange={(event) => updateDraft({ amount: event.target.value === "" ? 0 : Number(event.target.value) })}
                    max={balance}
                    min={1}
                    required
                  />
                </div>
                {Number(paymentDraft.amount) < balance && Number(paymentDraft.amount) > 0 && (
                  <p className="m-0 mt-1 text-[10px] text-warning">
                    {t("finance.partialPayment", { balance: formatCurrency(balance - Number(paymentDraft.amount)) })}
                  </p>
                )}
              </Field>
            </div>

            <Field label={`${t("finance.columns.method")} *`} error={errors.method}>
              <FormSelect
                id="payment-method"
                name="method"
                value={paymentDraft.method || "Cash"}
                onChange={(val) => updateDraft({ method: val })}
                options={paymentMethodOptions}
              />
            </Field>

            <Field label={`${t("finance.columns.paymentDate")} *`} error={errors.date}>
              <DatePicker
                value={paymentDraft.date || ""}
                onChange={(val) => updateDraft({ date: val })}
                required
              />
            </Field>

            <div className="sm:col-span-2">
              <UserActorSelect
                id="payment-receivedBy"
                label={t("finance.columns.receivedBy")}
                required
                value={paymentDraft.receivedByUserId || ""}
                onChange={(val) => updateDraft({ receivedByUserId: val })}
              />
            </div>

            <div className="sm:col-span-2">
              <Field label={t("finance.columns.note")} error={errors.note}>
                <div className="relative flex items-center group/input">
                  <FileText className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                  <Input
                    id="payment-note"
                    name="note"
                    className={`${FORM_INPUT} pl-10`}
                    value={paymentDraft.note || ""}
                    onChange={(event) => updateDraft({ note: event.target.value })}
                    placeholder={t("finance.paymentNotePlaceholder")}
                  />
                </div>
              </Field>
            </div>
          </div>
        </Card>
      </div>
    </FormModal>
  );
}
