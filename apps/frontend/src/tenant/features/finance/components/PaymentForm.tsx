import React, { useState } from "react";
import { ReceiptText, Coins, DollarSign, FileText } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/FormPrimitives";
import { UserActorSelect } from "@/components/ui/UserActorSelect";
import { useAuth } from "@/lib/contexts/AuthContext";
import { notify } from "@/lib/notify";
import { PAYMENT_METHODS, type Invoice } from '@/lib/data/financeData';
import { FORM_INPUT } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";
import { Card } from "@/components/ui/card";
import { SectionCard } from "@/components/ui/SectionCard";
import { cn } from "@/lib/utils";
import { CARD_STRIPE_INSET } from "@/lib/semanticTone";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { useTranslation } from "@/hooks/useTranslation";
import { type PaymentCreateInput } from "@mms/shared";
import { NotifiedMutationError } from "@/lib/notifiedMutationError";
import {
  PAYMENT_METHOD_LABEL_KEYS,
  buildInitialPaymentDraft,
  buildPaymentCreatePayload,
  validatePaymentFormDraft,
} from "@/tenant/features/finance/components/paymentFormHelpers";

export interface PaymentFormProps {
  open: boolean;
  invoice: Invoice | null;
  onClose: () => void;
  onSave: (payment: PaymentCreateInput) => void | Promise<void>;
}

export function PaymentForm({ open, invoice, onClose, onSave }: PaymentFormProps): React.JSX.Element {
  const { user: authUser } = useAuth();
  const { t } = useTranslation();
  const { formatCurrency, activeCurrency } = useFinanceCurrency();
  const balance = invoice ? invoice.finalAmt - (invoice.paidAmt || 0) : 0;

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentDraft, setPaymentDraft] = useState(() =>
    buildInitialPaymentDraft(balance, authUser?.id || ""),
  );

  const paymentMethodOptions = (() =>
      PAYMENT_METHODS.map((method) => ({
        value: method,
        label: t(PAYMENT_METHOD_LABEL_KEYS[method]),
      })))();

  const updateDraft = (patch: Partial<typeof paymentDraft>) => {
    setPaymentDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = async () => {
    setErrors({});
    const newErrors = validatePaymentFormDraft(paymentDraft, balance, t);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notify.error(t("finance.fixErrors"));
      return;
    }

    if (!invoice) return;

    setSaving(true);
    try {
      await onSave(buildPaymentCreatePayload(
        paymentDraft,
        invoice.id,
        invoice.studentId,
        invoice.studentName,
        authUser?.id || '',
      ));
      notify.success(t("finance.paymentSaved"));
      onClose();
    } catch (err: unknown) {
      if (!(err instanceof NotifiedMutationError)) {
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
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-success/10 text-success font-semibold border border-success/20 text-xs">
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
      saveDisabled={!paymentDraft.amount.trim() || Number(paymentDraft.amount) <= 0}
      footerStart={footerStart || undefined}
    >
      <div className="space-y-5 text-start">
        {invoice && (
          <Card accentColor="primary" className={cn("p-5 space-y-2 shadow-sm", CARD_STRIPE_INSET)}>
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h4 className="truncate text-sm font-bold text-foreground m-0">{invoice.studentName}</h4>
                <p className="truncate text-xs text-muted-foreground m-0 mt-0.5">{invoice.id} · {invoice.class}</p>
              </div>
              <div className="shrink-0 text-end">
                <p className="text-xs uppercase font-bold text-muted-foreground">{t("finance.balanceDue")}</p>
                <p className="text-sm font-bold text-primary m-0 mt-0.5">{formatCurrency(balance)}</p>
              </div>
            </div>
          </Card>
        )}

        <SectionCard
          accentColor="primary"
          icon={Coins}
          title={t("finance.paymentDetails")}
          className="shadow-sm"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label={`${t("finance.columns.amount")} (${activeCurrency.code})`} required error={errors.amount}>
                <div className="relative flex items-center group/input">
                  <DollarSign className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                  <Input
                    id="payment-amount-input"
                    name="amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    className={`${FORM_INPUT} ps-10`}
                    value={paymentDraft.amount}
                    onChange={(event) => updateDraft({ amount: event.target.value })}
                    required
                  />
                </div>
                {Number(paymentDraft.amount) < balance && Number(paymentDraft.amount) > 0 && (
                  <p className="m-0 mt-1 text-xs text-warning">
                    {t("finance.partialPayment", { balance: formatCurrency(balance - Number(paymentDraft.amount)) })}
                  </p>
                )}
              </Field>
            </div>

            <Field label={t("finance.columns.method")} required>
              <FormSelect
                id="payment-method-select"
                value={paymentDraft.method}
                onChange={(value) => updateDraft({ method: value })}
                options={paymentMethodOptions}
              />
            </Field>

            <Field label={t("finance.columns.paymentDate")} required>
              <DatePicker
                id="payment-date-input"
                name="date"
                value={paymentDraft.date}
                onChange={(value) => updateDraft({ date: value })}
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
                  <FileText className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                  <Input
                    id="payment-note"
                    name="note"
                    className={`${FORM_INPUT} ps-10`}
                    value={paymentDraft.note || ""}
                    onChange={(event) => updateDraft({ note: event.target.value })}
                    placeholder={t("finance.paymentNotePlaceholder")}
                  />
                </div>
              </Field>
            </div>
          </div>
        </SectionCard>
      </div>
    </FormModal>
  );
}
