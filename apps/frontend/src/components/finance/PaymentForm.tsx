import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { X, Save, Loader2, ReceiptText } from "lucide-react";
import { PAYMENT_METHODS, Invoice, Payment } from '@/lib/data/financeData';
import { getObject } from "../../lib/db";
import {
  type FinanceSettings,
  DEFAULT_FINANCE_SETTINGS,
  DEFAULT_FINANCE_FIELD_DEFS,
  getSortedFields,
} from "@mms/shared";
import { DatePicker } from "../ui/DatePicker";

const INPUT = "w-full px-3.5 py-2.5 rounded-lg border border-border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";
const LABEL = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";
const fmt = (n: number) => `PKR ${Number(n).toLocaleString()}`;

interface PaymentFormProps {
  invoice: Invoice | null;
  onClose: () => void;
  onSave: (payment: Payment) => void;
}

/**
 * PaymentForm Component
 * 
 * A form modal for recording a payment against a specific invoice.
 */
export default function PaymentForm({ invoice, onClose, onSave }: PaymentFormProps) {
  const balance = invoice ? invoice.finalAmt - (invoice.paidAmt || 0) : 0;
  const [data, setData] = useState<Partial<Payment>>({
    amount: balance,
    method: "Cash",
    date: new Date().toISOString().split("T")[0],
    receivedBy: "",
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

  const upd = (f: keyof Payment, v: Payment[keyof Payment]) => setData((d) => ({ ...d, [f]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;
    setError("");

    if (!data.amount || Number(data.amount) <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    // Validate default required fields
    for (const key of Object.keys(fields)) {
      if (fields[key].required && (data[key as keyof Payment] === undefined || data[key as keyof Payment] === "")) {
        setError(`${key.charAt(0).toUpperCase() + key.slice(1)} is required.`);
        return;
      }
    }

    // Validate custom required fields
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
      studentName: invoice.studentName,
      id: `pay${Date.now()}`,
    } as Payment);
    setSaving(false);
  };

  const valid = !!(data.amount && Number(data.amount) > 0);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="payment-form-title">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <motion.form
        onSubmit={handleSave}
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm flex flex-col z-10"
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-primary" aria-hidden="true" />
            <h3 id="payment-form-title" className="text-sm font-bold text-foreground m-0">Record Payment</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" aria-hidden="true" /></button>
        </header>

        {invoice && (
          <article className="mx-5 mt-4 px-4 py-3 rounded-xl bg-muted/40 border border-border">
            <p className="text-[12px] font-bold text-foreground m-0">{invoice.studentName}</p>
            <p className="text-[11px] text-muted-foreground m-0">{invoice.id} · {invoice.class}</p>
            <p className="text-[12px] font-semibold text-primary mt-1 m-0">Balance due: {fmt(balance)}</p>
          </article>
        )}

        <fieldset className="px-5 py-4 border-none m-0">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-semibold text-left">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {orderedFields.map((field) => {
              const isEnabled = fields[field.id]?.enabled !== false;
              if (!isEnabled) return null;

              if (field.id === "amount") {
                return (
                  <div key="amount" className="sm:col-span-2">
                    <label className={LABEL} htmlFor="payment-amount">Amount (PKR) *</label>
                    <input
                      id="payment-amount"
                      type="number"
                      className={INPUT}
                      value={data.amount || ""}
                      onChange={(e) => upd("amount", e.target.value)}
                      max={balance}
                      min={1}
                      required
                    />
                    {Number(data.amount) < balance && Number(data.amount) > 0 && (
                      <p className="text-[10px] text-amber-600 mt-1 m-0">Partial payment — balance remaining: {fmt(balance - Number(data.amount))}</p>
                    )}
                  </div>
                );
              }

              if (field.id === "method") {
                return (
                  <div key="method">
                    <label className={LABEL} htmlFor="payment-method">Method {field.required ? "*" : ""}</label>
                    <select id="payment-method" className={INPUT + " cursor-pointer"} value={data.method || "Cash"} onChange={(e) => upd("method", e.target.value)} required={field.required}>
                      {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                );
              }

              if (field.id === "date") {
                return (
                  <div key="date">
                    <label className={LABEL} htmlFor="payment-date">Date {field.required ? "*" : ""}</label>
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
                    <label className={LABEL} htmlFor="payment-receivedBy">Received By {field.required ? "*" : ""}</label>
                    <input id="payment-receivedBy" className={INPUT} value={data.receivedBy || ""} onChange={(e) => upd("receivedBy", e.target.value)} placeholder="Your name" required={field.required} />
                  </div>
                );
              }

              if (field.id === "note") {
                return (
                  <div key="note" className="sm:col-span-2">
                    <label className={LABEL} htmlFor="payment-note">Note {field.required ? "*" : ""}</label>
                    <input id="payment-note" className={INPUT} value={data.note || ""} onChange={(e) => upd("note", e.target.value)} placeholder="e.g. Cash received, receipt #123" required={field.required} />
                  </div>
                );
              }

              // Custom field
              if (!["amount", "method", "date", "receivedBy", "note"].includes(field.id)) {
                const val = (data as Record<string, unknown>)[field.id] ?? "";
                return (
                  <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                    <label className={LABEL}>
                      {field.label} {field.required ? "*" : ""}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        className={INPUT + " min-h-[80px] py-2 resize-none"}
                        value={val as string}
                        onChange={(e) => setData((d) => ({ ...d, [field.id]: e.target.value }))}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}…`}
                        required={field.required}
                      />
                    ) : field.type === "select" ? (
                      <select
                        className={INPUT + " cursor-pointer"}
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
                      <label className="flex items-center gap-2.5 py-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!val}
                          onChange={(e) => setData((d) => ({ ...d, [field.id]: e.target.checked }))}
                          className="w-4 h-4 rounded border border-border accent-primary cursor-pointer"
                        />
                        <span className="text-xs font-medium text-foreground">{field.label}</span>
                      </label>
                    ) : field.type === "number" ? (
                      <input
                        type="number"
                        className={INPUT}
                        value={val as number}
                        onChange={(e) => setData((d) => ({ ...d, [field.id]: e.target.value }))}
                        placeholder={field.placeholder || `Enter number…`}
                        required={field.required}
                      />
                    ) : field.type === "date" ? (
                      <DatePicker
                        value={val as string}
                        onChange={(val) => setData((d) => ({ ...d, [field.id]: val }))}
                        required={field.required}
                      />
                    ) : (
                      <input
                        type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
                        className={INPUT}
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
        </fieldset>

        <footer className="px-5 py-4 border-t border-border flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
          <button
            type="submit"
            disabled={saving || !valid}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
            {saving ? "Saving…" : "Record Payment"}
          </button>
        </footer>
      </motion.form>
    </div>
  );
}
