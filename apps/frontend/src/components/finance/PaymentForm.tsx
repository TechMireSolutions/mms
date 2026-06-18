import React, { useState, useMemo } from "react";
import { ReceiptText } from "lucide-react";
import { PAYMENT_METHODS, Invoice, Payment } from '@/lib/data/financeData';
import { getObject } from "../../lib/db";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  type FinanceSettings,
  DEFAULT_FINANCE_SETTINGS,
  DEFAULT_FINANCE_FIELD_DEFS,
  getSortedFields,
} from "@mms/shared";
import { DatePicker } from "../ui/DatePicker";
import FormModal from "../ui/FormModal";
import { FORM_INPUT, FORM_LABEL } from "../ui/formStyles";
import { calculateModuleFieldsCompleteness } from "@/lib/formCompleteness";
import UserActorSelect from "../ui/UserActorSelect";

const fmt = (n: number) => `PKR ${Number(n).toLocaleString()}`;

interface PaymentFormProps {
  open: boolean;
  invoice: Invoice | null;
  onClose: () => void;
  onSave: (payment: Payment) => void;
}

/**
 * Modal form for recording a payment against a specific invoice.
 */
export default function PaymentForm({ open, invoice, onClose, onSave }: PaymentFormProps) {
  const { user: authUser } = useAuth();
  const balance = invoice ? invoice.finalAmt - (invoice.paidAmt || 0) : 0;
  const [data, setData] = useState<Partial<Payment>>({
    amount: balance,
    method: "Cash",
    date: new Date().toISOString().split("T")[0],
    receivedByUserId: authUser?.id || "",
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const settings = useMemo(() => getObject<FinanceSettings>("finance_settings", DEFAULT_FINANCE_SETTINGS), []);
  const fields = settings.fields || DEFAULT_FINANCE_SETTINGS.fields || {};
  const customFields = settings.customFields || [];
  const fieldOrder = settings.fieldOrder || DEFAULT_FINANCE_SETTINGS.fieldOrder || [];

  const orderedFields = useMemo(() => {
    return getSortedFields(DEFAULT_FINANCE_FIELD_DEFS, fieldOrder, fields, customFields);
  }, [fieldOrder, fields, customFields]);

  const completeness = useMemo(
    () => calculateModuleFieldsCompleteness(data as Record<string, unknown>, orderedFields, fields),
    [data, orderedFields, fields],
  );

  const upd = (f: keyof Payment, v: Payment[keyof Payment]) => setData((d) => ({ ...d, [f]: v }));

  const handleSave = async () => {
    if (!invoice) return;
    setError("");

    if (!data.amount || Number(data.amount) <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    for (const key of Object.keys(fields)) {
      if (fields[key].required && (data[key as keyof Payment] === undefined || data[key as keyof Payment] === "")) {
        setError(`${key.charAt(0).toUpperCase() + key.slice(1)} is required.`);
        return;
      }
    }

    for (const cf of customFields) {
      if (cf.required && !(data as Record<string, unknown>)[cf.id]) {
        setError(`"${cf.label}" is required.`);
        return;
      }
    }

    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    onSave({
      ...data,
      amount: Number(data.amount),
      invoiceId: invoice.id,
      studentId: invoice.studentId,
      receivedByUserId: data.receivedByUserId || authUser?.id || '',
      id: `pay${Date.now()}`,
    } as Payment);
    setSaving(false);
  };

  const valid = !!(data.amount && Number(data.amount) > 0);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Record Payment"
      icon={ReceiptText}
      progress={completeness}
      progressLabel="Progress"
      error={error}
      cancelLabel="Cancel"
      saveLabel="Record Payment"
      onSave={handleSave}
      saving={saving}
      saveDisabled={!valid}
    >
      {invoice && (
        <article className="mb-4 rounded-xl border border-border bg-muted/40 px-4 py-3">
          <p className="m-0 text-[12px] font-bold text-foreground">{invoice.studentName}</p>
          <p className="m-0 text-[11px] text-muted-foreground">{invoice.id} · {invoice.class}</p>
          <p className="m-0 mt-1 text-[12px] font-semibold text-primary">Balance due: {fmt(balance)}</p>
        </article>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {orderedFields.map((field) => {
          const isEnabled = fields[field.id]?.enabled !== false;
          if (!isEnabled) return null;

          if (field.id === "amount") {
            return (
              <div key="amount" className="sm:col-span-2">
                <label className={FORM_LABEL} htmlFor="payment-amount">Amount (PKR) *</label>
                <input
                  id="payment-amount"
                  type="number"
                  className={FORM_INPUT}
                  value={data.amount || ""}
                  onChange={(e) => upd("amount", e.target.value)}
                  max={balance}
                  min={1}
                  required
                />
                {Number(data.amount) < balance && Number(data.amount) > 0 && (
                  <p className="m-0 mt-1 text-[10px] text-warning">Partial payment — balance remaining: {fmt(balance - Number(data.amount))}</p>
                )}
              </div>
            );
          }

          if (field.id === "method") {
            return (
              <div key="method">
                <label className={FORM_LABEL} htmlFor="payment-method">Method {field.required ? "*" : ""}</label>
                <select id="payment-method" className={`${FORM_INPUT} cursor-pointer`} value={data.method || "Cash"} onChange={(e) => upd("method", e.target.value)} required={field.required}>
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            );
          }

          if (field.id === "date") {
            return (
              <div key="date">
                <label className={FORM_LABEL} htmlFor="payment-date">Date {field.required ? "*" : ""}</label>
                <DatePicker
                  id="payment-date"
                  value={data.date || ""}
                  onChange={(val) => upd("date", val)}
                  required={field.required}
                />
              </div>
            );
          }

          if (field.id === "receivedBy") {
            return (
              <div key="receivedBy" className="sm:col-span-2">
                <UserActorSelect
                  id="payment-receivedBy"
                  label="Received By"
                  required={!!field.required}
                  value={data.receivedByUserId || ""}
                  onChange={(id) => upd("receivedByUserId", id)}
                />
              </div>
            );
          }

          if (field.id === "note") {
            return (
              <div key="note" className="sm:col-span-2">
                <label className={FORM_LABEL} htmlFor="payment-note">Note {field.required ? "*" : ""}</label>
                <input id="payment-note" className={FORM_INPUT} value={data.note || ""} onChange={(e) => upd("note", e.target.value)} placeholder="e.g. Cash received, receipt #123" required={field.required} />
              </div>
            );
          }

          if (!["amount", "method", "date", "receivedBy", "note"].includes(field.id)) {
            const val = (data as Record<string, unknown>)[field.id] ?? "";
            return (
              <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                <label className={FORM_LABEL}>
                  {field.label} {field.required ? "*" : ""}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    className={`${FORM_INPUT} min-h-[80px] resize-none py-2`}
                    value={val as string}
                    onChange={(e) => setData((d) => ({ ...d, [field.id]: e.target.value }))}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}…`}
                    required={field.required}
                  />
                ) : field.type === "select" ? (
                  <select
                    className={`${FORM_INPUT} cursor-pointer`}
                    value={val as string}
                    onChange={(e) => setData((d) => ({ ...d, [field.id]: e.target.value }))}
                    required={field.required}
                  >
                    <option value="">Select option…</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : field.type === "boolean" ? (
                  <label className="flex cursor-pointer select-none items-center gap-2.5 py-2">
                    <input
                      type="checkbox"
                      checked={!!val}
                      onChange={(e) => setData((d) => ({ ...d, [field.id]: e.target.checked }))}
                      className="h-4 w-4 cursor-pointer rounded border border-border accent-primary"
                    />
                    <span className="text-xs font-medium text-foreground">{field.label}</span>
                  </label>
                ) : field.type === "number" ? (
                  <input
                    type="number"
                    className={FORM_INPUT}
                    value={val as number}
                    onChange={(e) => setData((d) => ({ ...d, [field.id]: e.target.value }))}
                    placeholder={field.placeholder || "Enter number…"}
                    required={field.required}
                  />
                ) : field.type === "date" ? (
                  <DatePicker
                    value={val as string}
                    onChange={(v) => setData((d) => ({ ...d, [field.id]: v }))}
                    required={field.required}
                  />
                ) : (
                  <input
                    type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
                    className={FORM_INPUT}
                    value={val as string}
                    onChange={(e) => setData((d) => ({ ...d, [field.id]: e.target.value }))}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}…`}
                    required={field.required}
                  />
                )}
              </div>
            );
          }

          return null;
        })}
      </div>
    </FormModal>
  );
}
