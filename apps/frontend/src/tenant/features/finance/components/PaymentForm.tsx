import React, { useState } from "react";
import { ReceiptText, Coins, DollarSign, FileText } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/FormPrimitives";
import { UserActorSelect } from "@/components/ui/UserActorSelect";

import { useAuth } from "@/lib/contexts/AuthContext";
import { notify } from "@/lib/notify";
import { PAYMENT_METHODS, Invoice, Payment } from '@/lib/data/financeData';
import { FORM_INPUT } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { useTranslation } from "@/hooks/useTranslation";
import { todayISO } from "@mms/shared";

interface PaymentFormProps {
  open: boolean;
  invoice: Invoice | null;
  onClose: () => void;
  onSave: (payment: Payment) => void;
}

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

  const updateDraft = (patch: Partial<typeof paymentDraft>) => {
    setPaymentDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (!paymentDraft.amount || Number(paymentDraft.amount) <= 0) {
      newErrors.amount = t("finance.amountRequired");
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
      await new Promise((resolve) => setTimeout(resolve, 600));
      onSave({
        ...paymentDraft,
        amount: Number(paymentDraft.amount),
        invoiceId: invoice.id,
        studentId: invoice.studentId,
        receivedByUserId: paymentDraft.receivedByUserId || authUser?.id || '',
        id: `pay${Date.now()}`,
      } as unknown as Payment);
      notify.success(t("finance.paymentSaved"));
      onClose();
    } catch (err: unknown) {
      notify.error(t("finance.paymentSaveFailed"), { description: err instanceof Error ? err.message : String(err) });
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
          <article className="relative overflow-hidden group rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5 px-6 space-y-2 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="absolute inset-inline-start-0 top-0 bottom-0 w-1.5 bg-primary/60 transition-colors group-hover:bg-primary" />
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
          </article>
        )}

        <section className="relative overflow-hidden group rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5.5 px-6.5 pb-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute inset-inline-start-0 top-0 bottom-0 w-1.5 bg-primary/60 transition-colors group-hover:bg-primary" />
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
                options={PAYMENT_METHODS}
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
                    className={`${FORM_INPUT} pl-10`}
                    value={paymentDraft.note || ""}
                    onChange={(event) => updateDraft({ note: event.target.value })}
                    placeholder={t("finance.paymentNotePlaceholder")}
                  />
                </div>
              </Field>
            </div>
          </div>
        </section>
      </div>
    </FormModal>
  );
}
