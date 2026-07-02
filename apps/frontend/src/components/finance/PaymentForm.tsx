import React, { useState, useMemo } from "react";
import { ReceiptText } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { Input } from "@/components/ui/input";
import { DatePicker } from "../ui/DatePicker";
import { Field } from "@/components/ui/FormPrimitives";
import { UserActorSelect } from "../ui/UserActorSelect";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { notify } from "@/lib/notify";
import { PAYMENT_METHODS, Invoice, Payment } from '@/lib/data/financeData';
import { FORM_INPUT, FORM_SELECT } from "@/components/ui/formStyles";

const formatMoney = (amount: number) => `PKR ${Number(amount).toLocaleString()}`;

interface PaymentFormProps {
  open: boolean;
  invoice: Invoice | null;
  onClose: () => void;
  onSave: (payment: Payment) => void;
}

export function PaymentForm({ open, invoice, onClose, onSave }: PaymentFormProps): React.JSX.Element {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const balance = invoice ? invoice.finalAmt - (invoice.paidAmt || 0) : 0;

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [paymentDraft, setPaymentDraft] = useState(() => ({
    amount: balance,
    method: "Cash",
    date: new Date().toISOString().split("T")[0],
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
      newErrors.amount = "Amount must be greater than zero.";
    }
    if (!paymentDraft.method) {
      newErrors.method = "Method is required.";
    }
    if (!paymentDraft.date) {
      newErrors.date = "Date is required.";
    }
    if (!paymentDraft.receivedByUserId) {
      newErrors.receivedByUserId = "Received By is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notify.error("Please fix validation errors");
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
      notify.success("Payment recorded successfully");
      onClose();
    } catch (err: any) {
      notify.error("Failed to save payment", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const footerStart = invoice ? (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="font-semibold text-foreground truncate max-w-[200px]">{invoice.studentName}</span>
      <div className="flex items-center gap-2 border-s border-border ps-3">
        <span>Balance: {formatMoney(balance - Number(paymentDraft.amount || 0))}</span>
      </div>
    </div>
  ) : null;

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Record Payment"
      icon={ReceiptText}
      cancelLabel="Cancel"
      saveLabel="Record Payment"
      onSave={handleSave}
      saving={saving}
      saveDisabled={!paymentDraft.amount || Number(paymentDraft.amount) <= 0}
      footerStart={footerStart || undefined}
    >
      <div className="space-y-5 text-left">
        {invoice && (
          <article className="rounded-xl border border-border bg-card p-4">
            <h4 className="text-[14px] font-bold text-foreground m-0">{invoice.studentName}</h4>
            <p className="text-[11px] text-muted-foreground m-0 mt-0.5">{invoice.id} · {invoice.class}</p>
            <p className="text-[12px] font-semibold text-primary m-0 mt-2">Balance due: {formatMoney(balance)}</p>
          </article>
        )}

        <section className="rounded-xl border border-border bg-card/50 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Amount (PKR) *" error={errors.amount}>
                <input
                  type="number"
                  className={FORM_INPUT}
                  value={paymentDraft.amount || ""}
                  onChange={(e) => updateDraft({ amount: e.target.value === "" ? 0 : Number(e.target.value) })}
                  max={balance}
                  min={1}
                  required
                />
                {Number(paymentDraft.amount) < balance && Number(paymentDraft.amount) > 0 && (
                  <p className="m-0 mt-1 text-[10px] text-warning">
                    Partial payment — balance remaining: {formatMoney(balance - Number(paymentDraft.amount))}
                  </p>
                )}
              </Field>
            </div>

            <Field label="Method *" error={errors.method}>
              <select
                className={`${FORM_SELECT} cursor-pointer`}
                value={paymentDraft.method || "Cash"}
                onChange={(e) => updateDraft({ method: e.target.value })}
                required
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Field>

            <Field label="Date *" error={errors.date}>
              <DatePicker
                value={paymentDraft.date || ""}
                onChange={(val) => updateDraft({ date: val })}
                required
              />
            </Field>

            <div className="sm:col-span-2">
              <UserActorSelect
                id="payment-receivedBy"
                label="Received By"
                required
                value={paymentDraft.receivedByUserId || ""}
                onChange={(val) => updateDraft({ receivedByUserId: val })}
              />
            </div>

            <div className="sm:col-span-2">
              <Field label="Note" error={errors.note}>
                <Input
                  className={FORM_INPUT}
                  value={paymentDraft.note || ""}
                  onChange={(e) => updateDraft({ note: e.target.value })}
                  placeholder="e.g. Cash received, receipt #123"
                />
              </Field>
            </div>
          </div>
        </section>
      </div>
    </FormModal>
  );
}
